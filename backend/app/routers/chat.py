from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, Pet, ChatMessage, WeightEntry
from app.schemas.schemas import (
    ChatSend, ChatMessageOut, ChatResponse, MessageResponse,
    MealSuggestionRequest, MealSuggestionItem, MealSuggestionsOut,
    WeightAnalysisRequest, WeightAnalysisOut, WeightLogEntry,
    NutritionRecsRequest, NutritionRecItem, NutritionRecsOut,
    FoodEvalRequest, FoodEvalOut,
)
from app.auth import get_current_user
from typing import List, Optional
import os
import json
import asyncio
import logging

from openai import AsyncOpenAI

router = APIRouter()
log = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are Pawzo AI, a pet care assistant. Be BRIEF — 2 to 3 sentences max. "
    "No bullet lists, no bold text, no long explanations. Just a short, friendly, direct answer. "
    "If listing multiple things, write them as a simple comma-separated line, not bullet points. "
    "\n\nIMAGE RULES (highest priority):\n"
    "- When a photo is in the message, ALWAYS answer about the animal you SEE in that photo. Never substitute a registered pet name.\n"
    "- If you see a bird in the photo, answer about that bird. If you see a dog, answer about that dog. The photo overrides everything.\n"
    "- For follow-up questions, look at the photo already in the conversation — do NOT ask for it again.\n"
    "- For BREED: name the most likely breed and one or two key traits. One sentence.\n"
    "- For GENDER: give your best guess from physical traits. One sentence.\n"
    "- For HEALTH/WOUNDS: describe what you see and severity in one sentence, then say whether to see a vet.\n"
    "\nOnly decline if the question has nothing to do with animals or pet care. "
    "End health answers with: 'See a vet to be sure.'"
)


def _get_client() -> AsyncOpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return AsyncOpenAI(api_key=api_key)


def _describe_pet(pet: Pet) -> str:
    parts = [f"{pet.name} ({pet.species}"]
    if pet.breed:
        parts[0] += f", {pet.breed}"
    parts[0] += ")"
    if pet.dob:
        parts.append(f"DOB {pet.dob}")
    if pet.weight:
        parts.append(f"{pet.weight} kg")
    if pet.region:
        parts.append(f"region: {pet.region}")
    if pet.notes:
        parts.append(pet.notes)
    return ", ".join(parts)


def _build_pet_context(pets: list[Pet]) -> str:
    if not pets:
        return ""
    if len(pets) == 1:
        return f"The user's pet: {_describe_pet(pets[0])}."
    lines = "\n".join(f"- {_describe_pet(p)}" for p in pets)
    return f"The user's pets:\n{lines}\nAnswer about whichever pet the user asks about."


async def _openai_reply(
    user_text: str,
    pets: list[Pet],
    history: list[ChatMessage],
    image_base64: Optional[str] = None,
) -> str:
    client = _get_client()

    # Find if there's a recent image (new upload or from last 4 history messages)
    recent_image = next(
        (m.image_data for m in reversed(history[-4:]) if m.role == "user" and m.image_data),
        None,
    )
    has_image = bool(image_base64 or recent_image)

    messages: list = [{"role": "system", "content": _SYSTEM_PROMPT}]

    # Only inject pet names/details for text-only questions.
    # When an image is involved the pet context confuses the AI into naming registered pets.
    if not has_image:
        context = _build_pet_context(pets)
        if context:
            messages.append({"role": "system", "content": context})

    for msg in (history[-20:] if len(history) > 20 else history):
        if msg.image_data and msg.role == "user":
            messages.append({
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{msg.image_data}", "detail": "high"}},
                    {"type": "text", "text": msg.text or "What do you see?"},
                ],
            })
        else:
            messages.append({
                "role": "user" if msg.role == "user" else "assistant",
                "content": msg.text,
            })

    if image_base64:
        content: list = [
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}", "detail": "high"}},
        ]
        if user_text:
            content.append({"type": "text", "text": user_text})
        messages.append({"role": "user", "content": content})
    elif recent_image:
        # Re-attach the recent image for follow-up questions
        messages.append({
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{recent_image}", "detail": "high"}},
                {"type": "text", "text": user_text},
            ],
        })
    else:
        messages.append({"role": "user", "content": user_text})

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        max_tokens=150,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


def _fallback_reply(text: str, pet: Optional[Pet]) -> str:
    import re
    s = text.lower()
    pet_name = pet.name if pet else "your pet"
    species  = pet.species if pet else "pet"
    persona  = {"Dog": "Woof!", "Cat": "Meow~", "Bird": "Tweet tweet!"}.get(species, "Hi!")
    lead = f"{persona} "
    if re.search(r"chocolate|grape|onion|xylitol|toxic|poison", s):
        return f"{lead}Keep chocolate, grapes, onions and xylitol away from {pet_name} — they're toxic. Call your vet immediately if ingested."
    if re.search(r"eat|food|feed|diet|meal|nutrition", s):
        return f"{lead}For {pet_name}, focus on high-quality protein appropriate for a {species}. Split into 2–3 portions daily and keep treats under 10% of calories."
    if re.search(r"vaccine|vaccination|shot", s):
        return f"{lead}Check the Health tab for {pet_name}'s vaccination schedule. Your vet sets the exact plan."
    if re.search(r"emergency|hurt|bleeding|vomit|sick|ill", s):
        return f"{lead}If this is urgent, open the Emergency screen to call your vet now. Keep {pet_name} calm and warm while you reach help."
    return f"{lead}I'm having trouble connecting right now. Please try again in a moment 🐾"


_MEAL_FALLBACK: dict[str, list[dict]] = {
    "Dog": [
        {"name": "Morning Bowl",   "food": "Dry kibble with warm water",     "time": "08:00", "kcal": 300, "reason": "Complete balanced nutrition to start the day.",          "recipe": "1. Measure portion per weight guide.\n2. Add warm water, stir gently.\n3. Let cool 2 min before serving."},
        {"name": "Midday Snack",   "food": "Boiled chicken & carrot sticks", "time": "13:00", "kcal": 100, "reason": "Lean protein keeps energy steady between meals.",         "recipe": "1. Boil chicken breast 15 min, no salt.\n2. Slice into small pieces.\n3. Add raw carrot sticks alongside."},
        {"name": "Evening Dinner", "food": "Wet food with rice & veggies",   "time": "18:30", "kcal": 350, "reason": "High-moisture meal aids digestion overnight.",            "recipe": "1. Cook plain rice until soft.\n2. Mix wet food with rice 2:1 ratio.\n3. Add steamed veggies, cool before serving."},
    ],
    "Cat": [
        {"name": "Morning Feed",   "food": "Wet cat food with tuna",         "time": "08:00", "kcal": 180, "reason": "Cats need high animal protein; wet food boosts hydration.", "recipe": "1. Open wet food pouch, place in bowl.\n2. Add a few flakes of plain tuna on top.\n3. Serve at room temperature."},
        {"name": "Afternoon Bite", "food": "Dry kibble (measured portion)",   "time": "14:00", "kcal": 120, "reason": "Crunchy kibble supports dental health.",                  "recipe": "1. Measure portion per weight chart.\n2. Place in clean dry bowl.\n3. Ensure fresh water is available alongside."},
        {"name": "Evening Meal",   "food": "Wet food with chicken & gravy",  "time": "19:00", "kcal": 180, "reason": "Aromatic wet meal appeals to picky eaters at night.",      "recipe": "1. Warm pouch in warm water 2 min.\n2. Mix in a small spoon of plain chicken.\n3. Serve immediately while aromatic."},
    ],
    "Bird": [
        {"name": "Breakfast Seeds", "food": "Mixed seed & millet spray",     "time": "07:30", "kcal": 60,  "reason": "Seeds provide essential fatty acids for feather health.", "recipe": "1. Fill seed dish ¾ full with fresh mix.\n2. Clip millet spray to cage bars.\n3. Remove uneaten fresh food after 2 hrs."},
        {"name": "Lunch Veggies",   "food": "Chopped leafy greens & carrot", "time": "12:00", "kcal": 30,  "reason": "Fresh vegetables supply vitamins A and K.",               "recipe": "1. Wash greens and carrot thoroughly.\n2. Chop into small beak-sized pieces.\n3. Place in a clean dish, discard after 3 hrs."},
        {"name": "Evening Pellets", "food": "Fortified pelleted diet",        "time": "17:00", "kcal": 70,  "reason": "Pellets ensure complete mineral intake.",                  "recipe": "1. Measure pellets per species weight guide.\n2. Offer in a separate dish from seeds.\n3. Transition gradually if new to pellets."},
    ],
    "Rabbit": [
        {"name": "Morning Hay",     "food": "Unlimited timothy hay",         "time": "08:00", "kcal": 50,  "reason": "Hay must be 70% of diet for healthy gut motility.",       "recipe": "1. Fill hay rack generously with fresh hay.\n2. Remove old damp hay daily.\n3. Provide unlimited access throughout the day."},
        {"name": "Midday Greens",   "food": "Romaine, parsley & herbs",      "time": "12:00", "kcal": 20,  "reason": "Leafy greens provide moisture and vitamins.",              "recipe": "1. Rinse greens under cold water.\n2. Shake dry and tear into pieces.\n3. Offer a loosely packed cup per kg body weight."},
        {"name": "Evening Pellets", "food": "Plain rabbit pellets (50g)",    "time": "18:00", "kcal": 130, "reason": "Measured pellets prevent obesity in house rabbits.",        "recipe": "1. Measure exactly 50g on a kitchen scale.\n2. Place in a heavy ceramic bowl.\n3. Remove uneaten pellets after 1 hour."},
    ],
}
_MEAL_FALLBACK_DEFAULT = [
    {"name": "Morning Feed",   "food": "Species-appropriate staple food", "time": "08:00", "kcal": 200, "reason": "Consistent morning feeding builds routine.",              "recipe": "1. Prepare species-appropriate food per label guide.\n2. Serve in a clean bowl at regular time.\n3. Remove uneaten food after 30 min."},
    {"name": "Midday Snack",   "food": "Fresh vegetables or fruit",       "time": "13:00", "kcal": 80,  "reason": "Natural treats add enrichment and nutrients.",            "recipe": "1. Wash fresh produce thoroughly.\n2. Chop into appropriate-sized pieces.\n3. Offer as a small snack between main meals."},
    {"name": "Evening Meal",   "food": "Protein-rich evening portion",    "time": "18:30", "kcal": 220, "reason": "Larger evening meal supports overnight energy needs.",     "recipe": "1. Prepare protein source appropriate for species.\n2. Combine with any safe carbohydrates or greens.\n3. Let cool and serve in a clean bowl."},
]


@router.post("/chat/meal-suggestions", response_model=MealSuggestionsOut)
async def suggest_meals(
    body: MealSuggestionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Pet).where(Pet.id == body.pet_id, Pet.owner_id == current_user.id)
    )
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(404, "Pet not found")

    region = body.region or pet.region or "your region"
    breed_str = f" ({pet.breed})" if pet.breed else ""

    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            client = AsyncOpenAI(api_key=api_key)
            prompt = (
                f"Suggest exactly 3 daily meal options for {pet.name}, a {pet.species}{breed_str}. "
                f"The owner lives in {region} — use ingredients commonly available there. "
                f"Return a JSON object with a 'suggestions' array of exactly 3 items. "
                f"Each item must have: name (2-4 words), food (specific ingredients, max 8 words), "
                f"time (HH:MM 24h), kcal (realistic integer for a {pet.species}), "
                f"reason (one sentence explaining why this suits a {pet.species} in {region}), "
                f"recipe (exactly 3 concise preparation steps separated by newlines, e.g. '1. Step one.\\n2. Step two.\\n3. Step three.', max 30 words total)."
            )
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a certified pet nutritionist. Return valid JSON only, no markdown fences."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                max_tokens=900,
                temperature=0.8,
            )
            raw = response.choices[0].message.content.strip()
            parsed = json.loads(raw)
            items = [MealSuggestionItem(**s) for s in parsed.get("suggestions", [])[:3]]
            if items:
                return MealSuggestionsOut(suggestions=items)
        except Exception as exc:
            log.error("Meal suggestions OpenAI error: %s", exc)

    # Fallback: species-based hardcoded plan
    raw_list = _MEAL_FALLBACK.get(pet.species, _MEAL_FALLBACK_DEFAULT)
    return MealSuggestionsOut(suggestions=[MealSuggestionItem(**m) for m in raw_list])


_WEIGHT_FALLBACKS: dict[str, tuple[float, float]] = {
    "Dog": (5.0, 35.0), "Cat": (3.5, 6.0), "Bird": (0.05, 0.5),
    "Rabbit": (1.5, 4.0), "Hamster": (0.08, 0.2), "Guinea pig": (0.7, 1.2),
    "Fish": (0.05, 2.0), "Reptile": (0.2, 5.0), "Tortoise": (0.5, 10.0),
}

_NUTRITION_FALLBACKS: dict[str, list[dict]] = {
    "Dog": [
        {"name": "Chicken & Rice Bowl", "ingredients": "1.5 cups cooked chicken + 2 cups rice + 1 carrot (boiled)", "reason": "Complete protein with easy-to-digest carbs, ideal for most dogs.", "badge": "Recommended"},
        {"name": "Sweet Potato & Egg", "ingredients": "2 boiled eggs + 1 medium sweet potato + ½ cup peas", "reason": "High protein and beta-carotene for healthy coat and muscles.", "badge": "High protein"},
        {"name": "Veggie Dal Khichdi", "ingredients": "½ cup lentils + ½ cup rice + 1 carrot + 1 potato (no salt)", "reason": "Dog-safe comfort food with slow-digesting carbs.", "badge": "Occasional"},
    ],
    "Cat": [
        {"name": "Tuna & Rice Bowl", "ingredients": "½ cup cooked tuna + ½ cup rice + 1 tsp fish oil", "reason": "High-protein tuna meets a cat's essential amino acid needs.", "badge": "Recommended"},
        {"name": "Chicken Broth Meal", "ingredients": "1 cup shredded chicken + ½ cup broth + 1 tsp pumpkin puree", "reason": "Warm broth encourages hydration in cats.", "badge": "High protein"},
        {"name": "Egg & Pumpkin Mix", "ingredients": "2 scrambled eggs + 2 tbsp mashed pumpkin", "reason": "Easy-to-digest, high protein with added fibre.", "badge": "Light meal"},
    ],
    "Bird": [
        {"name": "Seed & Greens Mix", "ingredients": "2 tbsp mixed seeds + ½ cup chopped leafy greens + 1 tbsp grated carrot", "reason": "Balanced seeds with fresh vegetables for daily nutrition.", "badge": "Recommended"},
        {"name": "Fruit & Pellet Bowl", "ingredients": "1 tbsp pellets + ¼ cup diced apple + 1 tbsp pomegranate seeds", "reason": "Natural sugars with essential vitamins.", "badge": "High protein"},
        {"name": "Boiled Egg Crumble", "ingredients": "1 boiled egg (crumbled) + 1 tbsp millet", "reason": "Occasional protein boost for moulting birds.", "badge": "Occasional"},
    ],
}
_NUTRITION_FALLBACK_DEFAULT = [
    {"name": "Morning Bowl", "ingredients": "1.5 cups species-appropriate protein + 1 cup vegetables", "reason": "Balanced morning feed to start the day.", "badge": "Recommended"},
    {"name": "Midday Snack", "ingredients": "½ cup fresh vegetables or fruit (species-safe)", "reason": "Natural treats add enrichment and nutrients.", "badge": "Light meal"},
    {"name": "Evening Meal", "ingredients": "1 cup protein + ½ cup cooked grains", "reason": "Hearty evening meal for overnight energy.", "badge": "Recommended"},
]

_TOXIC_KEYWORDS = ["onion", "garlic", "chocolate", "grape", "raisin", "xylitol", "avocado", "macadamia", "alcohol", "caffeine", "leek", "chive"]



@router.post("/chat/weight-analysis", response_model=WeightAnalysisOut)
async def weight_analysis(
    body: WeightAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Pet).where(Pet.id == body.pet_id, Pet.owner_id == current_user.id)
    )
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(404, "Pet not found")

    # Use logs sent from frontend (already sorted by date asc); fall back to DB query
    if body.logs:
        sorted_logs = sorted(body.logs, key=lambda l: l.date)
        log_pairs = [(l.weight, l.date) for l in sorted_logs]
        current_weight = log_pairs[-1][0]
    else:
        db_logs = await db.execute(
            select(WeightEntry)
            .where(WeightEntry.pet_id == body.pet_id)
            .order_by(WeightEntry.date.asc())
        )
        entries = db_logs.scalars().all()
        log_pairs = [(e.weight, e.date) for e in entries]
        current_weight = log_pairs[-1][0] if log_pairs else (float(pet.weight) if pet.weight else 0.0)

    breed_str = f" ({pet.breed})" if pet.breed else ""

    # Compute trend locally (fast, no AI needed)
    def _compute_trend_local(logs: list, name: str) -> tuple[str, str]:
        from datetime import date as _date
        if len(logs) < 2:
            return "normal", "Log more entries over time to see a trend analysis."

        weights_only = [w for w, _ in logs]
        peak_w = max(weights_only)
        last_w, last_d = logs[-1]

        # Check for significant drop from peak (>20% loss from highest recorded weight)
        drop_from_peak = peak_w - last_w
        drop_pct = drop_from_peak / max(peak_w, 0.001)
        if drop_pct > 0.20 and drop_from_peak * 1000 > 5:
            return (
                "warning",
                f"⚠️ {name} has dropped {drop_from_peak*1000:.0f}g from their peak of {peak_w*1000:.0f}g "
                f"(a {drop_pct*100:.0f}% loss). This is a significant decline — please consult a vet."
            )

        # Check consecutive pairs for sudden spikes or fast rates
        for i in range(1, len(logs)):
            prev_w, prev_d = logs[i - 1]
            curr_w, curr_d = logs[i]
            days_apart = max((_date.fromisoformat(curr_d) - _date.fromisoformat(prev_d)).days, 1)
            change_g = (curr_w - prev_w) * 1000
            pct_change = abs(curr_w - prev_w) / max(prev_w, 0.001)
            if pct_change > 0.10 and days_apart <= 7:
                direction = "gain" if change_g > 0 else "loss"
                return (
                    "warning",
                    f"⚠️ Sudden {direction} of {abs(change_g):.0f}g in {days_apart} day(s). "
                    "Rapid changes may indicate illness or a logging error — consult a vet if it continues."
                )
            threshold = 3.0 if prev_w <= 0.5 else 10.0
            rate_g_per_day = abs(change_g) / days_apart
            if rate_g_per_day > threshold:
                verb = "gained" if change_g > 0 else "lost"
                return (
                    "caution",
                    f"📊 {abs(change_g):.0f}g {verb} in {days_apart} day(s) (~{rate_g_per_day:.1f}g/day). "
                    "Monitor closely — a slower pace is generally healthier."
                )

        first_w, first_d = logs[0]
        total_days = max((_date.fromisoformat(last_d) - _date.fromisoformat(first_d)).days, 1)
        total_g = (last_w - first_w) * 1000
        verb = "gained" if total_g > 0 else "lost"
        rate = abs(total_g) / total_days
        return (
            "normal",
            f"✅ {name} has {verb} {abs(total_g):.0f}g over {total_days} day(s) (~{rate:.1f}g/day) — a healthy, gradual pace."
        )

    trend_status, trend_message = _compute_trend_local(log_pairs, pet.name)

    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and current_weight > 0:
        try:
            client = AsyncOpenAI(api_key=api_key)
            log_summary = ", ".join(f"{w*1000:.0f}g on {d}" for w, d in log_pairs[-10:])
            prompt = (
                f"Analyse the weight history of {pet.name}, a {pet.species}{breed_str}. "
                f"Weight logs (most recent 10): [{log_summary}]. "
                f"Current weight: {current_weight*1000:.0f}g ({current_weight:.4f} kg). "
                f"Return JSON only: {{\"ideal_min\": float (kg), \"ideal_max\": float (kg), "
                f"\"goal\": \"maintain\"|\"gain\"|\"lose\", \"goal_amount\": float (kg, 0 if maintain), "
                f"\"message\": \"1-2 sentence friendly advice about current weight vs ideal\"}}"
            )
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a certified veterinary nutritionist. Return valid JSON only, no markdown."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                max_tokens=250,
                temperature=0.3,
            )
            raw = json.loads(response.choices[0].message.content.strip())
            return WeightAnalysisOut(
                ideal_min=float(raw.get("ideal_min", 0)),
                ideal_max=float(raw.get("ideal_max", 0)),
                goal=str(raw.get("goal", "maintain")),
                goal_amount=float(raw.get("goal_amount", 0)),
                message=str(raw.get("message", "")),
                trend_status=trend_status,
                trend_message=trend_message,
            )
        except Exception as exc:
            log.error("Weight analysis OpenAI error: %s", exc)

    lo, hi = _WEIGHT_FALLBACKS.get(pet.species, (1.0, 50.0))
    if current_weight > 0:
        if current_weight < lo:
            goal, amt = "gain", round(lo - current_weight, 4)
            msg = f"{pet.name} is underweight for a {pet.species}. Aim to gain {amt*1000:.0f}g to reach the healthy range."
        elif current_weight > hi:
            goal, amt = "lose", round(current_weight - hi, 4)
            msg = f"{pet.name} is above the ideal range. A gradual loss of {amt*1000:.0f}g is recommended."
        else:
            goal, amt = "maintain", 0.0
            msg = f"{pet.name}'s weight is within the healthy range ({lo*1000:.0f}–{hi*1000:.0f}g). Keep it up!"
    else:
        goal, amt, msg = "maintain", 0.0, f"Typical ideal weight for a {pet.species} is {lo*1000:.0f}–{hi*1000:.0f}g."

    return WeightAnalysisOut(ideal_min=lo, ideal_max=hi, goal=goal, goal_amount=amt, message=msg,
                             trend_status=trend_status, trend_message=trend_message)


@router.post("/chat/nutrition-recs", response_model=NutritionRecsOut)
async def nutrition_recs(
    body: NutritionRecsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Pet).where(Pet.id == body.pet_id, Pet.owner_id == current_user.id)
    )
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(404, "Pet not found")

    region = pet.region or "your region"
    breed_str = f" ({pet.breed})" if pet.breed else ""
    weight_str = f", {pet.weight} kg" if pet.weight else ""

    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            client = AsyncOpenAI(api_key=api_key)
            prompt = (
                f"Suggest 3 home-cooked recipes for {pet.name}, a {pet.species}{breed_str}{weight_str}, living in {region}. "
                f"Use locally available ingredients. Specify amounts in household measures (cups, tablespoons, eggs, medium/large vegetables). "
                f"No calories. Return JSON only: {{\"recipes\": ["
                f"{{\"name\": str, \"ingredients\": str, \"reason\": str, \"badge\": \"Recommended\"|\"High protein\"|\"Occasional\"|\"Light meal\"}}]}}"
            )
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a veterinary nutritionist. Return valid JSON only, no markdown."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                max_tokens=600,
                temperature=0.7,
            )
            raw = json.loads(response.choices[0].message.content.strip())
            items = [NutritionRecItem(**r) for r in raw.get("recipes", [])[:3]]
            if items:
                return NutritionRecsOut(recipes=items)
        except Exception as exc:
            log.error("Nutrition recs OpenAI error: %s", exc)

    raw_list = _NUTRITION_FALLBACKS.get(pet.species, _NUTRITION_FALLBACK_DEFAULT)
    return NutritionRecsOut(recipes=[NutritionRecItem(**r) for r in raw_list])


@router.post("/chat/food-eval", response_model=FoodEvalOut)
async def food_eval(
    body: FoodEvalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Pet).where(Pet.id == body.pet_id, Pet.owner_id == current_user.id)
    )
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(404, "Pet not found")

    food_desc = body.food
    if body.ingredients:
        food_desc += f" (ingredients: {body.ingredients})"

    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            client = AsyncOpenAI(api_key=api_key)
            prompt = (
                f"Evaluate if '{food_desc}' is suitable for {pet.name}, a {pet.species}. "
                f"Return JSON only: {{\"suitable\": bool, \"reason\": \"1-2 sentences\", "
                f"\"serving\": \"household-measure amount e.g. 1.5 cups cooked chicken + 1 medium carrot (~350g total)\", "
                f"\"alternative\": \"safer option if not suitable, else empty string\"}}"
            )
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a veterinary nutritionist. Return valid JSON only, no markdown."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                max_tokens=280,
                temperature=0.3,
            )
            raw = json.loads(response.choices[0].message.content.strip())
            return FoodEvalOut(
                suitable=bool(raw.get("suitable", True)),
                reason=str(raw.get("reason", "")),
                serving=str(raw.get("serving", "")),
                alternative=str(raw.get("alternative", "")),
            )
        except Exception as exc:
            log.error("Food eval OpenAI error: %s", exc)

    # Simple keyword-based fallback
    combined = (body.food + " " + body.ingredients).lower()
    found_toxic = [t for t in _TOXIC_KEYWORDS if t in combined]
    if found_toxic:
        return FoodEvalOut(
            suitable=False,
            reason=f"{', '.join(t.title() for t in found_toxic)} can be harmful to {pet.species}s and should be avoided.",
            serving="",
            alternative=f"Plain boiled chicken or fish with rice is a safe alternative for a {pet.species}.",
        )
    return FoodEvalOut(
        suitable=True,
        reason=f"This food appears safe for {pet.name}. Always ensure no harmful additives or seasonings are included.",
        serving=f"Serve approximately 1–2 cups as a portion appropriate for a {pet.species}.",
        alternative="",
    )


@router.get("/chat/history", response_model=List[ChatMessageOut])
async def get_chat_history(
    pet_id: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(ChatMessage).where(ChatMessage.user_id == current_user.id)
    if pet_id:
        query = query.where(ChatMessage.pet_id == pet_id)
    else:
        query = query.where(ChatMessage.pet_id == None)  # noqa: E711 — IS NULL
    query = query.order_by(ChatMessage.created_at.desc()).limit(limit)
    result = await db.execute(query)
    # Return in chronological order (oldest first) for display
    return list(reversed(result.scalars().all()))


@router.delete("/chat/history", response_model=MessageResponse)
async def delete_chat_history(
    pet_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import delete as sql_delete
    query = sql_delete(ChatMessage).where(ChatMessage.user_id == current_user.id)
    if pet_id:
        query = query.where(ChatMessage.pet_id == pet_id)
    else:
        query = query.where(ChatMessage.pet_id == None)  # noqa: E711
    await db.execute(query)
    await db.commit()
    return {"message": "Chat history deleted."}


@router.post("/chat/send", response_model=ChatResponse)
async def send_chat_message(
    body: ChatSend,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pets: list[Pet] = []
    if body.pet_id:
        result = await db.execute(
            select(Pet).where(Pet.id == body.pet_id, Pet.owner_id == current_user.id)
        )
        single = result.scalar_one_or_none()
        if single:
            pets = [single]
    else:
        # General mode — load all of the user's pets so AI knows every pet by name
        all_result = await db.execute(
            select(Pet).where(Pet.owner_id == current_user.id)
        )
        pets = list(all_result.scalars().all())

    hist_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .where(ChatMessage.pet_id == body.pet_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
    )
    # Reverse so messages are in chronological order for the AI
    history = list(reversed(hist_result.scalars().all()))

    user_msg = ChatMessage(
        user_id=current_user.id,
        pet_id=body.pet_id,
        role="user",
        text=body.text or "",
        image_data=body.image_base64,
    )
    db.add(user_msg)
    await db.flush()

    fallback_pet = pets[0] if pets else None
    try:
        reply_text = await _openai_reply(body.text or "", pets, history, body.image_base64)
    except Exception as exc:
        log.error("OpenAI error: %s: %s", type(exc).__name__, exc)
        reply_text = _fallback_reply(body.text, fallback_pet)

    ai_msg = ChatMessage(
        user_id=current_user.id,
        pet_id=body.pet_id,
        role="ai",
        text=reply_text,
    )
    db.add(ai_msg)
    await db.commit()
    await db.refresh(user_msg)
    await db.refresh(ai_msg)

    return ChatResponse(user_msg=user_msg, ai_msg=ai_msg)

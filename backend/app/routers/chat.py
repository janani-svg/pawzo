from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, Pet, ChatMessage
from app.schemas.schemas import ChatSend, ChatMessageOut, ChatResponse, MessageResponse
from app.auth import get_current_user
from typing import List, Optional
import os
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

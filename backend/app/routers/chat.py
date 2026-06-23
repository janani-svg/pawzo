from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, Pet, ChatMessage
from app.schemas.schemas import ChatSend, ChatMessageOut, ChatResponse
from app.auth import get_current_user
from typing import List, Optional
import os
import asyncio
import logging

from openai import AsyncOpenAI

router = APIRouter()
log = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are Pawzo AI, a friendly and knowledgeable pet care assistant. "
    "You ONLY answer questions about pets, animals, and their care — food, health, "
    "vaccinations, grooming, behaviour, exercise, and emergencies. "
    "If someone asks about anything unrelated to animals or pet care, politely say: "
    "\"I'm your pet-care helper so I can only chat about animals and their wellbeing 🐾\". "
    "Keep responses concise (2-4 sentences), warm, and practical. "
    "When you know the pet's details, personalise your answer to their species, breed, age, and region."
)


def _get_client() -> AsyncOpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return AsyncOpenAI(api_key=api_key)


def _build_pet_context(pet: Optional[Pet]) -> str:
    if not pet:
        return ""
    parts = [f"The user's pet is named {pet.name}, a {pet.species}"]
    if pet.breed:
        parts.append(f"breed: {pet.breed}")
    if pet.dob:
        parts.append(f"date of birth: {pet.dob}")
    if pet.weight:
        parts.append(f"weight: {pet.weight} kg")
    if pet.region:
        parts.append(f"region: {pet.region}")
    if pet.notes:
        parts.append(f"notes: {pet.notes}")
    return "Pet context — " + ", ".join(parts) + "."


async def _openai_reply(
    user_text: str,
    pet: Optional[Pet],
    history: list[ChatMessage],
    image_base64: Optional[str] = None,
) -> str:
    client = _get_client()

    messages = [{"role": "system", "content": _SYSTEM_PROMPT}]

    context = _build_pet_context(pet)
    if context:
        messages.append({"role": "system", "content": context})

    for msg in (history[-20:] if len(history) > 20 else history):
        if msg.image_data and msg.role == "user":
            messages.append({
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{msg.image_data}", "detail": "low"}},
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
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}", "detail": "low"}},
        ]
        if user_text:
            content.append({"type": "text", "text": user_text})
        messages.append({"role": "user", "content": content})
    else:
        messages.append({"role": "user", "content": user_text})

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=400,
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


@router.get("/chat", response_model=List[ChatMessageOut])
async def get_chat_history(
    pet_id: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(ChatMessage).where(ChatMessage.user_id == current_user.id)
    if pet_id:
        query = query.where(ChatMessage.pet_id == pet_id)
    query = query.order_by(ChatMessage.created_at.asc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/chat", response_model=ChatResponse)
async def send_chat_message(
    body: ChatSend,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pet: Optional[Pet] = None
    if body.pet_id:
        result = await db.execute(
            select(Pet).where(Pet.id == body.pet_id, Pet.owner_id == current_user.id)
        )
        pet = result.scalar_one_or_none()

    hist_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .where(ChatMessage.pet_id == body.pet_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(20)
    )
    history = list(hist_result.scalars().all())

    user_msg = ChatMessage(
        user_id=current_user.id,
        pet_id=body.pet_id,
        role="user",
        text=body.text or "",
        image_data=body.image_base64,
    )
    db.add(user_msg)
    await db.flush()

    try:
        reply_text = await _openai_reply(body.text or "", pet, history, body.image_base64)
    except Exception as exc:
        log.error("OpenAI error: %s: %s", type(exc).__name__, exc)
        reply_text = _fallback_reply(body.text, pet)

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

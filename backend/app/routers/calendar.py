from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.database import get_db
from app.models.models import User, Pet, CalendarEvent
from app.schemas.schemas import CalendarEventCreate, CalendarEventUpdate, CalendarEventOut
from app.auth import get_current_user
from typing import List, Optional

router = APIRouter()


async def get_pet_or_404(pet_id: str, user: User, db: AsyncSession) -> Pet:
    result = await db.execute(select(Pet).where(Pet.id == pet_id, Pet.owner_id == user.id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(404, "Pet not found")
    return pet


@router.get("/{pet_id}/events", response_model=List[CalendarEventOut])
async def list_events(
    pet_id: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    today: Optional[str] = None,       # client's local date  yyyy-mm-dd
    now_hhmm: Optional[str] = None,    # client's local time  HH:MM
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)

    # Auto-cleanup: erase events whose time period is over (use client's local date/time)
    if today:
        # Delete all non-all-day events from past days
        await db.execute(
            delete(CalendarEvent).where(
                CalendarEvent.pet_id == pet_id,
                CalendarEvent.date < today,
                CalendarEvent.all_day == False,
            )
        )
        # Delete today's timed events whose time has already passed (skip all-day events)
        if now_hhmm:
            await db.execute(
                delete(CalendarEvent).where(
                    CalendarEvent.pet_id == pet_id,
                    CalendarEvent.date == today,
                    CalendarEvent.time != "",
                    CalendarEvent.time <= now_hhmm,
                    CalendarEvent.all_day == False,
                )
            )
        await db.commit()

    query = select(CalendarEvent).where(CalendarEvent.pet_id == pet_id).order_by(CalendarEvent.date)
    if from_date:
        query = query.where(CalendarEvent.date >= from_date)
    if to_date:
        query = query.where(CalendarEvent.date <= to_date)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{pet_id}/events", response_model=CalendarEventOut, status_code=201)
async def create_event(
    pet_id: str,
    body: CalendarEventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    event = CalendarEvent(**body.model_dump(), pet_id=pet_id)
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.put("/{pet_id}/events/{event_id}", response_model=CalendarEventOut)
async def update_event(
    pet_id: str,
    event_id: str,
    body: CalendarEventUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(CalendarEvent).where(CalendarEvent.id == event_id, CalendarEvent.pet_id == pet_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(404, "Event not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(event, field, value)
    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/{pet_id}/events/{event_id}", status_code=204)
async def delete_event(
    pet_id: str,
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(CalendarEvent).where(CalendarEvent.id == event_id, CalendarEvent.pet_id == pet_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(404, "Event not found")
    await db.delete(event)
    await db.commit()

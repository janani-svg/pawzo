from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, Pet, WeightEntry
from app.schemas.schemas import WeightEntryCreate, WeightEntryUpdate, WeightEntryOut
from app.auth import get_current_user
from typing import List

router = APIRouter()


async def get_pet_or_404(pet_id: str, user: User, db: AsyncSession) -> Pet:
    result = await db.execute(select(Pet).where(Pet.id == pet_id, Pet.owner_id == user.id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(404, "Pet not found")
    return pet


@router.get("/{pet_id}/weights", response_model=List[WeightEntryOut])
async def list_weights(
    pet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(WeightEntry).where(WeightEntry.pet_id == pet_id).order_by(WeightEntry.date)
    )
    return result.scalars().all()


@router.post("/{pet_id}/weights", response_model=WeightEntryOut, status_code=201)
async def create_weight(
    pet_id: str,
    body: WeightEntryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    entry = WeightEntry(**body.model_dump(), pet_id=pet_id)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.put("/{pet_id}/weights/{entry_id}", response_model=WeightEntryOut)
async def update_weight(
    pet_id: str,
    entry_id: str,
    body: WeightEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(WeightEntry).where(WeightEntry.id == entry_id, WeightEntry.pet_id == pet_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(404, "Weight entry not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(entry, field, value)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{pet_id}/weights/{entry_id}", status_code=204)
async def delete_weight(
    pet_id: str,
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(WeightEntry).where(WeightEntry.id == entry_id, WeightEntry.pet_id == pet_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(404, "Weight entry not found")
    await db.delete(entry)
    await db.commit()

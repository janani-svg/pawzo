from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, Pet, Milestone
from app.schemas.schemas import PetCreate, PetUpdate, PetOut, MilestoneCreate, MilestoneUpdate, MilestoneOut
from app.auth import get_current_user
from typing import List

router = APIRouter()


async def get_pet_or_404(pet_id: str, user: User, db: AsyncSession) -> Pet:
    result = await db.execute(select(Pet).where(Pet.id == pet_id, Pet.owner_id == user.id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(404, "Pet not found")
    return pet


# ── Pets ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[PetOut])
async def list_pets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Pet).where(Pet.owner_id == current_user.id))
    return result.scalars().all()


@router.post("", response_model=PetOut, status_code=201)
async def create_pet(
    body: PetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pet = Pet(**body.model_dump(), owner_id=current_user.id)
    db.add(pet)
    await db.commit()
    await db.refresh(pet)
    return pet


@router.get("/{pet_id}", response_model=PetOut)
async def get_pet(
    pet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_pet_or_404(pet_id, current_user, db)


@router.put("/{pet_id}", response_model=PetOut)
async def update_pet(
    pet_id: str,
    body: PetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pet = await get_pet_or_404(pet_id, current_user, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(pet, field, value)
    await db.commit()
    await db.refresh(pet)
    return pet


@router.delete("/{pet_id}", status_code=204)
async def delete_pet(
    pet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pet = await get_pet_or_404(pet_id, current_user, db)
    await db.delete(pet)
    await db.commit()


# ── Milestones ────────────────────────────────────────────────────────────────

@router.get("/{pet_id}/milestones", response_model=List[MilestoneOut])
async def list_milestones(
    pet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(select(Milestone).where(Milestone.pet_id == pet_id))
    return result.scalars().all()


@router.post("/{pet_id}/milestones", response_model=MilestoneOut, status_code=201)
async def create_milestone(
    pet_id: str,
    body: MilestoneCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    milestone = Milestone(**body.model_dump(), pet_id=pet_id)
    db.add(milestone)
    await db.commit()
    await db.refresh(milestone)
    return milestone


@router.put("/{pet_id}/milestones/{milestone_id}", response_model=MilestoneOut)
async def update_milestone(
    pet_id: str,
    milestone_id: str,
    body: MilestoneUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(Milestone).where(Milestone.id == milestone_id, Milestone.pet_id == pet_id)
    )
    milestone = result.scalar_one_or_none()
    if not milestone:
        raise HTTPException(404, "Milestone not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(milestone, field, value)
    await db.commit()
    await db.refresh(milestone)
    return milestone


@router.delete("/{pet_id}/milestones/{milestone_id}", status_code=204)
async def delete_milestone(
    pet_id: str,
    milestone_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(Milestone).where(Milestone.id == milestone_id, Milestone.pet_id == pet_id)
    )
    milestone = result.scalar_one_or_none()
    if not milestone:
        raise HTTPException(404, "Milestone not found")
    await db.delete(milestone)
    await db.commit()

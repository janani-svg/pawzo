from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, Pet, Memory
from app.schemas.schemas import MemoryCreate, MemoryUpdate, MemoryOut
from app.auth import get_current_user
from typing import List

router = APIRouter()


async def get_pet_or_404(pet_id: str, user: User, db: AsyncSession) -> Pet:
    result = await db.execute(select(Pet).where(Pet.id == pet_id, Pet.owner_id == user.id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(404, "Pet not found")
    return pet


@router.get("/{pet_id}/memories", response_model=List[MemoryOut])
async def list_memories(
    pet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(Memory).where(Memory.pet_id == pet_id).order_by(Memory.date.desc())
    )
    return result.scalars().all()


@router.post("/{pet_id}/memories", response_model=MemoryOut, status_code=201)
async def create_memory(
    pet_id: str,
    body: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    memory = Memory(**body.model_dump(), pet_id=pet_id)
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    return memory


@router.put("/{pet_id}/memories/{memory_id}", response_model=MemoryOut)
async def update_memory(
    pet_id: str,
    memory_id: str,
    body: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(Memory).where(Memory.id == memory_id, Memory.pet_id == pet_id)
    )
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(404, "Memory not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(memory, field, value)
    await db.commit()
    await db.refresh(memory)
    return memory


@router.delete("/{pet_id}/memories/{memory_id}", status_code=204)
async def delete_memory(
    pet_id: str,
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(Memory).where(Memory.id == memory_id, Memory.pet_id == pet_id)
    )
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(404, "Memory not found")
    await db.delete(memory)
    await db.commit()

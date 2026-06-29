from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, Pet, EnvironmentTask
from app.schemas.schemas import EnvironmentTaskCreate, EnvironmentTaskUpdate, EnvironmentTaskOut
from app.auth import get_current_user
from typing import List

router = APIRouter()


async def get_pet_or_404(pet_id: str, user: User, db: AsyncSession) -> Pet:
    result = await db.execute(select(Pet).where(Pet.id == pet_id, Pet.owner_id == user.id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(404, "Pet not found")
    return pet


@router.get("/{pet_id}/environment", response_model=List[EnvironmentTaskOut])
async def list_environment_tasks(
    pet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(EnvironmentTask).where(EnvironmentTask.pet_id == pet_id).order_by(EnvironmentTask.next_due)
    )
    return result.scalars().all()


@router.post("/{pet_id}/environment", response_model=EnvironmentTaskOut, status_code=201)
async def create_environment_task(
    pet_id: str,
    body: EnvironmentTaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    task = EnvironmentTask(**body.model_dump(), pet_id=pet_id)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.put("/{pet_id}/environment/{task_id}", response_model=EnvironmentTaskOut)
async def update_environment_task(
    pet_id: str,
    task_id: str,
    body: EnvironmentTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(EnvironmentTask).where(EnvironmentTask.id == task_id, EnvironmentTask.pet_id == pet_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Environment task not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{pet_id}/environment/{task_id}", status_code=204)
async def delete_environment_task(
    pet_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(EnvironmentTask).where(EnvironmentTask.id == task_id, EnvironmentTask.pet_id == pet_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Environment task not found")
    await db.delete(task)
    await db.commit()

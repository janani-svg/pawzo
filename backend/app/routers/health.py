from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, Pet, Vaccination, HealthRecord
from app.schemas.schemas import (
    VaccinationCreate, VaccinationUpdate, VaccinationOut,
    HealthRecordCreate, HealthRecordUpdate, HealthRecordOut,
)
from app.auth import get_current_user
from typing import List

router = APIRouter()


async def get_pet_or_404(pet_id: str, user: User, db: AsyncSession) -> Pet:
    result = await db.execute(select(Pet).where(Pet.id == pet_id, Pet.owner_id == user.id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(404, "Pet not found")
    return pet


# ── Vaccinations ──────────────────────────────────────────────────────────────

@router.get("/{pet_id}/vaccinations", response_model=List[VaccinationOut])
async def list_vaccinations(
    pet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(select(Vaccination).where(Vaccination.pet_id == pet_id))
    return result.scalars().all()


@router.post("/{pet_id}/vaccinations", response_model=VaccinationOut, status_code=201)
async def create_vaccination(
    pet_id: str,
    body: VaccinationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    vac = Vaccination(**body.model_dump(), pet_id=pet_id)
    db.add(vac)
    await db.commit()
    await db.refresh(vac)
    return vac


@router.put("/{pet_id}/vaccinations/{vac_id}", response_model=VaccinationOut)
async def update_vaccination(
    pet_id: str,
    vac_id: str,
    body: VaccinationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(Vaccination).where(Vaccination.id == vac_id, Vaccination.pet_id == pet_id)
    )
    vac = result.scalar_one_or_none()
    if not vac:
        raise HTTPException(404, "Vaccination not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(vac, field, value)
    await db.commit()
    await db.refresh(vac)
    return vac


@router.delete("/{pet_id}/vaccinations/{vac_id}", status_code=204)
async def delete_vaccination(
    pet_id: str,
    vac_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(Vaccination).where(Vaccination.id == vac_id, Vaccination.pet_id == pet_id)
    )
    vac = result.scalar_one_or_none()
    if not vac:
        raise HTTPException(404, "Vaccination not found")
    await db.delete(vac)
    await db.commit()


# ── Health Records ────────────────────────────────────────────────────────────

@router.get("/{pet_id}/health", response_model=List[HealthRecordOut])
async def list_health_records(
    pet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(select(HealthRecord).where(HealthRecord.pet_id == pet_id))
    return result.scalars().all()


@router.post("/{pet_id}/health", response_model=HealthRecordOut, status_code=201)
async def create_health_record(
    pet_id: str,
    body: HealthRecordCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    record = HealthRecord(**body.model_dump(), pet_id=pet_id)
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.put("/{pet_id}/health/{record_id}", response_model=HealthRecordOut)
async def update_health_record(
    pet_id: str,
    record_id: str,
    body: HealthRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(HealthRecord).where(HealthRecord.id == record_id, HealthRecord.pet_id == pet_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(404, "Health record not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(record, field, value)
    await db.commit()
    await db.refresh(record)
    return record


@router.delete("/{pet_id}/health/{record_id}", status_code=204)
async def delete_health_record(
    pet_id: str,
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(HealthRecord).where(HealthRecord.id == record_id, HealthRecord.pet_id == pet_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(404, "Health record not found")
    await db.delete(record)
    await db.commit()

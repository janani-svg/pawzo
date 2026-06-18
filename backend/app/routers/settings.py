from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, UserSettings, Vet, UserActivity
from app.schemas.schemas import SettingsUpdate, SettingsOut, VetCreate, VetOut, ActivityOut
from app.auth import get_current_user
from datetime import date as date_type

router = APIRouter()


# ── Settings ──────────────────────────────────────────────────────────────────

@router.get("/settings", response_model=SettingsOut)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.put("/settings", response_model=SettingsOut)
async def update_settings(
    body: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(settings, field, value)

    await db.commit()
    await db.refresh(settings)
    return settings


# ── Vet ───────────────────────────────────────────────────────────────────────

@router.get("/vet", response_model=VetOut | None)
async def get_vet(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Vet).where(Vet.owner_id == current_user.id))
    return result.scalar_one_or_none()


@router.put("/vet", response_model=VetOut)
async def upsert_vet(
    body: VetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Vet).where(Vet.owner_id == current_user.id))
    vet = result.scalar_one_or_none()

    if vet:
        for field, value in body.model_dump().items():
            setattr(vet, field, value)
    else:
        vet = Vet(**body.model_dump(), owner_id=current_user.id)
        db.add(vet)

    await db.commit()
    await db.refresh(vet)
    return vet


@router.delete("/vet", status_code=204)
async def delete_vet(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Vet).where(Vet.owner_id == current_user.id))
    vet = result.scalar_one_or_none()
    if not vet:
        raise HTTPException(404, "No vet saved")
    await db.delete(vet)
    await db.commit()


# ── Activity / Streak ─────────────────────────────────────────────────────────

@router.get("/activity", response_model=ActivityOut)
async def get_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserActivity.date).where(UserActivity.user_id == current_user.id)
    )
    dates = [row[0] for row in result.all()]
    return {"dates": sorted(dates)}


@router.post("/activity", response_model=ActivityOut)
async def record_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = str(date_type.today())
    result = await db.execute(
        select(UserActivity).where(
            UserActivity.user_id == current_user.id,
            UserActivity.date == today,
        )
    )
    if not result.scalar_one_or_none():
        db.add(UserActivity(user_id=current_user.id, date=today))
        await db.commit()

    result = await db.execute(
        select(UserActivity.date).where(UserActivity.user_id == current_user.id)
    )
    dates = [row[0] for row in result.all()]
    return {"dates": sorted(dates)}

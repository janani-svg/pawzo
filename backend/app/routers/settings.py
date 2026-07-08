from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, UserSettings, Vet, UserActivity
from app.schemas.schemas import SettingsUpdate, SettingsOut, VetCreate, VetOut, ActivityOut, UserOut, UserProfileUpdate
from app.auth import get_current_user
from datetime import date as date_type, timedelta, datetime

router = APIRouter()


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=UserOut)
async def update_profile(
    body: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.photo_url is not None:
        current_user.photo_url = body.photo_url
    await db.commit()
    await db.refresh(current_user)
    return current_user


# ── Account deletion ─────────────────────────────────────────────────────────

@router.post("/request-deletion", status_code=204)
async def request_deletion(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.deletion_requested_at = datetime.utcnow()
    await db.commit()


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

def _compute_streak(dates: list[str]) -> tuple[int, bool]:
    """
    Returns (streak, broken).
    streak = consecutive days ending today.
    broken = True when the user has prior history but missed yesterday —
             in that case streak is forced to 0 regardless of today's visit.
    """
    day_set = set(dates)
    today = date_type.today()
    yesterday = today - timedelta(days=1)

    has_prior = any(s < str(today) for s in day_set)
    broken = has_prior and str(yesterday) not in day_set

    if broken:
        return 0, True

    count = 0
    d = today
    while str(d) in day_set:
        count += 1
        d -= timedelta(days=1)
    return count, False


async def _upsert_today(user_id: str, db: AsyncSession) -> None:
    today = str(date_type.today())
    exists = await db.execute(
        select(UserActivity).where(
            UserActivity.user_id == user_id,
            UserActivity.date == today,
        )
    )
    if not exists.scalar_one_or_none():
        db.add(UserActivity(user_id=user_id, date=today))
        await db.commit()


async def _update_max_streak(user_id: str, streak: int, db: AsyncSession) -> int:
    """Update max_streak in user_settings if current streak is higher. Returns the max."""
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = UserSettings(user_id=user_id, max_streak=streak)
        db.add(settings)
        await db.commit()
        return streak
    current_max = settings.max_streak or 0
    if streak > current_max:
        settings.max_streak = streak
        await db.commit()
        return streak
    return current_max


@router.get("/activity", response_model=ActivityOut)
async def get_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Auto-record today so every app open counts toward the streak
    await _upsert_today(current_user.id, db)
    result = await db.execute(
        select(UserActivity.date).where(UserActivity.user_id == current_user.id)
    )
    dates = sorted(row[0] for row in result.all())
    streak, broken = _compute_streak(dates)
    max_streak = await _update_max_streak(current_user.id, streak, db)
    return {"dates": dates, "streak": streak, "streak_broken": broken, "max_streak": max_streak}


@router.post("/activity", response_model=ActivityOut)
async def record_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _upsert_today(current_user.id, db)
    result = await db.execute(
        select(UserActivity.date).where(UserActivity.user_id == current_user.id)
    )
    dates = sorted(row[0] for row in result.all())
    streak, broken = _compute_streak(dates)
    max_streak = await _update_max_streak(current_user.id, streak, db)
    return {"dates": dates, "streak": streak, "streak_broken": broken, "max_streak": max_streak}

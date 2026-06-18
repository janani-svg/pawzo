from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, Pet, Meal, MealLog, UserActivity
from app.schemas.schemas import MealCreate, MealUpdate, MealOut, MealLogToggle, MealLogOut
from app.auth import get_current_user
from datetime import date as date_type
from typing import List, Optional

router = APIRouter()


async def get_pet_or_404(pet_id: str, user: User, db: AsyncSession) -> Pet:
    result = await db.execute(select(Pet).where(Pet.id == pet_id, Pet.owner_id == user.id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(404, "Pet not found")
    return pet


async def record_activity(user_id: str, db: AsyncSession):
    today = str(date_type.today())
    result = await db.execute(
        select(UserActivity).where(UserActivity.user_id == user_id, UserActivity.date == today)
    )
    if not result.scalar_one_or_none():
        db.add(UserActivity(user_id=user_id, date=today))


# ── Meals ─────────────────────────────────────────────────────────────────────

@router.get("/{pet_id}/meals", response_model=List[MealOut])
async def list_meals(
    pet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(select(Meal).where(Meal.pet_id == pet_id))
    return result.scalars().all()


@router.post("/{pet_id}/meals", response_model=MealOut, status_code=201)
async def create_meal(
    pet_id: str,
    body: MealCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    meal = Meal(**body.model_dump(), pet_id=pet_id)
    db.add(meal)
    await record_activity(current_user.id, db)
    await db.commit()
    await db.refresh(meal)
    return meal


@router.put("/{pet_id}/meals/{meal_id}", response_model=MealOut)
async def update_meal(
    pet_id: str,
    meal_id: str,
    body: MealUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(select(Meal).where(Meal.id == meal_id, Meal.pet_id == pet_id))
    meal = result.scalar_one_or_none()
    if not meal:
        raise HTTPException(404, "Meal not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(meal, field, value)
    await db.commit()
    await db.refresh(meal)
    return meal


@router.delete("/{pet_id}/meals/{meal_id}", status_code=204)
async def delete_meal(
    pet_id: str,
    meal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(select(Meal).where(Meal.id == meal_id, Meal.pet_id == pet_id))
    meal = result.scalar_one_or_none()
    if not meal:
        raise HTTPException(404, "Meal not found")
    await db.delete(meal)
    await db.commit()


# ── Meal Logs ─────────────────────────────────────────────────────────────────

@router.get("/{pet_id}/meal-logs", response_model=List[MealLogOut])
async def list_meal_logs(
    pet_id: str,
    date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    query = select(MealLog).where(MealLog.pet_id == pet_id)
    if date:
        query = query.where(MealLog.date == date)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{pet_id}/meal-logs/toggle", response_model=MealLogOut)
async def toggle_meal_log(
    pet_id: str,
    body: MealLogToggle,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)

    result = await db.execute(
        select(MealLog).where(
            MealLog.pet_id == pet_id,
            MealLog.meal_id == body.meal_id,
            MealLog.date == body.date,
        )
    )
    log = result.scalar_one_or_none()

    if log:
        log.done = not log.done
    else:
        log = MealLog(pet_id=pet_id, meal_id=body.meal_id, date=body.date, done=True)
        db.add(log)

    await record_activity(current_user.id, db)
    await db.commit()
    await db.refresh(log)
    return log

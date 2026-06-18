from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, Pet, Expense
from app.schemas.schemas import ExpenseCreate, ExpenseUpdate, ExpenseOut
from app.auth import get_current_user
from typing import List, Optional

router = APIRouter()


async def get_pet_or_404(pet_id: str, user: User, db: AsyncSession) -> Pet:
    result = await db.execute(select(Pet).where(Pet.id == pet_id, Pet.owner_id == user.id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(404, "Pet not found")
    return pet


@router.get("/{pet_id}/expenses", response_model=List[ExpenseOut])
async def list_expenses(
    pet_id: str,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    query = select(Expense).where(Expense.pet_id == pet_id).order_by(Expense.date.desc())
    if category:
        query = query.where(Expense.category == category)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{pet_id}/expenses", response_model=ExpenseOut, status_code=201)
async def create_expense(
    pet_id: str,
    body: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    expense = Expense(**body.model_dump(), pet_id=pet_id)
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense


@router.put("/{pet_id}/expenses/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    pet_id: str,
    expense_id: str,
    body: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.pet_id == pet_id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(404, "Expense not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(expense, field, value)
    await db.commit()
    await db.refresh(expense)
    return expense


@router.delete("/{pet_id}/expenses/{expense_id}", status_code=204)
async def delete_expense(
    pet_id: str,
    expense_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_pet_or_404(pet_id, current_user, db)
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.pet_id == pet_id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(404, "Expense not found")
    await db.delete(expense)
    await db.commit()

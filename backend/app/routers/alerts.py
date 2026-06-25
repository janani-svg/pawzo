from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.database import get_db
from app.models.models import User, AlertRecord
from app.schemas.schemas import AlertRecordIn, AlertRecordOut
from app.auth import get_current_user
from typing import List
import time

router = APIRouter()


@router.get("/alerts", response_model=List[AlertRecordOut])
async def list_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now_ms = int(time.time() * 1000)
    # Auto-cleanup expired records
    await db.execute(
        delete(AlertRecord).where(
            AlertRecord.user_id == current_user.id,
            AlertRecord.expires_at < now_ms,
        )
    )
    await db.commit()
    result = await db.execute(
        select(AlertRecord)
        .where(AlertRecord.user_id == current_user.id)
        .order_by(AlertRecord.sort_time.desc())
    )
    return result.scalars().all()


@router.post("/alerts/upsert-batch", status_code=200)
async def upsert_alerts(
    body: List[AlertRecordIn],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not body:
        return {"upserted": 0}
    for item in body:
        exists = await db.execute(
            select(AlertRecord).where(
                AlertRecord.alert_key == item.alert_key,
                AlertRecord.user_id == current_user.id,
            )
        )
        if not exists.scalar_one_or_none():
            db.add(AlertRecord(**item.model_dump(), user_id=current_user.id))
    await db.commit()
    return {"upserted": len(body)}

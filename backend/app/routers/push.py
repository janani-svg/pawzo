import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel

from app.db.database import get_db
from app.models.models import User, PushSubscription
from app.auth import get_current_user

router = APIRouter()


class _Keys(BaseModel):
    p256dh: str
    auth: str


class SubscribeBody(BaseModel):
    endpoint: str
    keys: _Keys


@router.get("/vapid-public-key")
def get_vapid_public_key():
    key = os.getenv("VAPID_PUBLIC_KEY", "")
    if not key:
        raise HTTPException(status_code=500, detail="VAPID_PUBLIC_KEY not configured")
    return {"key": key}


@router.post("/subscribe", status_code=201)
async def subscribe(
    body: SubscribeBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PushSubscription).where(
            PushSubscription.user_id == current_user.id,
            PushSubscription.endpoint == body.endpoint,
        )
    )
    sub = result.scalar_one_or_none()
    if sub:
        sub.p256dh = body.keys.p256dh
        sub.auth   = body.keys.auth
    else:
        db.add(PushSubscription(
            user_id  = current_user.id,
            endpoint = body.endpoint,
            p256dh   = body.keys.p256dh,
            auth     = body.keys.auth,
        ))
    await db.commit()
    return {"status": "subscribed"}


@router.delete("/unsubscribe", status_code=204)
async def unsubscribe(
    body: SubscribeBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        delete(PushSubscription).where(
            PushSubscription.user_id == current_user.id,
            PushSubscription.endpoint == body.endpoint,
        )
    )
    await db.commit()

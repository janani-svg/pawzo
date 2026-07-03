import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, UserSettings
from app.schemas.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserOut,
    ForgotPasswordRequest, ResetPasswordRequest, MessageResponse,
)
from app.auth import hash_password, verify_password, create_token, get_current_user
from app.email_utils import send_reset_email

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(400, "Email already registered")

    result = await db.execute(select(User).where(User.username == body.username.lower()))
    existing_username = result.scalar_one_or_none()
    if existing_username:
        raise HTTPException(400, "Username already taken")

    user = User(
        name=body.name,
        username=body.username.lower(),
        email=body.email.lower(),
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.flush()

    db.add(UserSettings(user_id=user.id))
    await db.commit()
    await db.refresh(user)

    return {
        "access_token": create_token(user.id),
        "token_type": "bearer",
        "user": user,
    }


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    identifier = body.identifier.lower()
    result = await db.execute(
        select(User).where(
            (User.email == identifier) | (User.username == identifier)
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(401, "No account found with that email or username.")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Incorrect password.")

    if user.deletion_requested_at:
        days_elapsed = (datetime.utcnow() - user.deletion_requested_at).days
        if days_elapsed >= 30:
            await db.delete(user)
            await db.commit()
            raise HTTPException(401, "Invalid credentials")
        days_to_cancel = max(0, 7 - days_elapsed)
        days_to_delete = max(0, 30 - days_elapsed)
        raise HTTPException(403, f"PENDING_DELETION:{days_to_cancel}:{days_to_delete}")

    return {
        "access_token": create_token(user.id),
        "token_type": "bearer",
        "user": user,
    }


@router.post("/cancel-deletion", response_model=TokenResponse)
async def cancel_deletion(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    identifier = body.identifier.lower()
    result = await db.execute(
        select(User).where((User.email == identifier) | (User.username == identifier))
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    if not user.deletion_requested_at:
        raise HTTPException(400, "No deletion request found")

    days_elapsed = (datetime.utcnow() - user.deletion_requested_at).days
    if days_elapsed >= 7:
        raise HTTPException(403, "Cancellation window has expired")

    user.deletion_requested_at = None
    await db.commit()
    await db.refresh(user)
    return {"access_token": create_token(user.id), "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    from jose import jwt as jose_jwt
    result = await db.execute(select(User).where(User.email == body.email.lower().strip()))
    user = result.scalar_one_or_none()

    if user:
        secret = os.getenv("SECRET_KEY", "changeme")
        token = jose_jwt.encode(
            {"sub": user.id, "type": "password_reset", "exp": datetime.utcnow() + timedelta(hours=1)},
            secret, algorithm="HS256",
        )
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_link = f"{frontend_url}/reset-password?token={token}"
        try:
            send_reset_email(user.email, reset_link)
        except Exception:
            pass

    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password_endpoint(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    from jose import jwt as jose_jwt, JWTError
    try:
        secret = os.getenv("SECRET_KEY", "changeme")
        payload = jose_jwt.decode(body.token.strip(), secret, algorithms=["HS256"])
        if payload.get("type") != "password_reset":
            raise JWTError()
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(400, "Invalid or expired reset link.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(400, "Invalid or expired reset link.")

    user.password_hash = hash_password(body.new_password)
    await db.commit()

    return {"message": "Password updated successfully."}

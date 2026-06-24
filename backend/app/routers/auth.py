import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, UserSettings
from app.schemas.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserOut,
    VerifyEmailRequest, MessageResponse,
)
from app.auth import hash_password, verify_password, create_token, get_current_user
from app.email_utils import send_verification_email

router = APIRouter()

VERIFICATION_CODE_TTL_MIN = 10


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    result = await db.execute(select(User).where(User.username == body.username.lower()))
    if result.scalar_one_or_none():
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

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    return {
        "access_token": create_token(user.id),
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/send-verification", response_model=MessageResponse)
async def send_verification(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.email_verified:
        raise HTTPException(400, "Email already verified")

    code = f"{secrets.randbelow(1_000_000):06d}"
    current_user.verification_code = code
    current_user.verification_code_expires = (
        datetime.utcnow() + timedelta(minutes=VERIFICATION_CODE_TTL_MIN)
    )
    await db.commit()

    send_verification_email(current_user.email, code)

    return {"message": f"Verification code sent to {current_user.email}"}


@router.post("/verify-email", response_model=UserOut)
async def verify_email(
    body: VerifyEmailRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.email_verified:
        return current_user

    if not current_user.verification_code or not current_user.verification_code_expires:
        raise HTTPException(400, "No verification code requested. Please request a new code.")

    if datetime.utcnow() > current_user.verification_code_expires:
        raise HTTPException(400, "Verification code has expired. Please request a new code.")

    if body.code.strip() != current_user.verification_code:
        raise HTTPException(400, "Invalid verification code")

    current_user.email_verified = True
    current_user.verification_code = None
    current_user.verification_code_expires = None
    await db.commit()
    await db.refresh(current_user)

    return current_user

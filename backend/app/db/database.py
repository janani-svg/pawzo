from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv
from typing import AsyncGenerator
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL") or URL.create(
    drivername="postgresql+asyncpg",
    username=os.getenv("DB_USER") or "postgres",
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST") or "localhost",
    port=int(os.getenv("DB_PORT") or 5432),
    database=os.getenv("DB_NAME") or "pawzo",
)

is_supabase = os.getenv("DB_HOST", "").endswith("supabase.com")

engine = create_async_engine(DATABASE_URL, echo=False, connect_args={"ssl": "require"} if is_supabase else {})
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session

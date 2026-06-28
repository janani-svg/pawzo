import asyncio
import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context
from dotenv import load_dotenv

# Allow imports from backend/ root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Build DB URL object from parts (handles special characters in password safely)
from sqlalchemy.engine import URL as _URL
_db_url = _URL.create(
    drivername="postgresql+asyncpg",
    username=os.getenv("DB_USER") or "postgres",
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST") or "localhost",
    port=int(os.getenv("DB_PORT") or 5432),
    database=os.getenv("DB_NAME") or "pawzo",
)

# Import all models so Alembic can detect schema changes
from app.db.database import Base
from app.models.models import (  # noqa: F401
    User,
    Pet,
    Meal,
    MealLog,
    Vaccination,
    WeightEntry,
    HealthRecord,
    Expense,
    Milestone,
    Memory,
    CalendarEvent,
    Vet,
    UserSettings,
    UserActivity,
)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    from sqlalchemy.ext.asyncio import create_async_engine
    is_supabase = (os.getenv("DB_HOST", "")).endswith("supabase.com")
    connectable = create_async_engine(
        _db_url,
        poolclass=pool.NullPool,
        connect_args={"ssl": "require"} if is_supabase else {},
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

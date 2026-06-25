"""add fed_at to meal_logs, event_completions table, med_logs table

Revision ID: i9j0k1l2m3n4
Revises: h1i2j3k4l5m6
Create Date: 2026-06-23

"""
from alembic import op

revision = 'i9j0k1l2m3n4'
down_revision = 'h1i2j3k4l5m6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Exact epoch ms when a meal was marked fed (NULL = not yet fed / unknown)
    op.execute("ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS fed_at INTEGER DEFAULT NULL")

    # Which calendar events were completed on which date
    op.execute("""
        CREATE TABLE IF NOT EXISTS event_completions (
            id       TEXT PRIMARY KEY,
            event_id TEXT NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
            date     TEXT NOT NULL,
            done_at  INTEGER NOT NULL
        )
    """)

    # Daily medication administration log
    op.execute("""
        CREATE TABLE IF NOT EXISTS med_logs (
            id      TEXT PRIMARY KEY,
            med_id  TEXT NOT NULL REFERENCES health_records(id) ON DELETE CASCADE,
            pet_id  TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
            date    TEXT NOT NULL,
            given_at INTEGER NOT NULL
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS med_logs")
    op.execute("DROP TABLE IF EXISTS event_completions")
    op.execute("ALTER TABLE meal_logs DROP COLUMN IF EXISTS fed_at")

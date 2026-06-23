"""add alert_records table

Revision ID: j0k1l2m3n4o5
Revises: 98b99afc7072
Create Date: 2026-06-23

"""
from alembic import op

revision = 'j0k1l2m3n4o5'
down_revision = '98b99afc7072'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS alert_records (
            alert_key    TEXT    NOT NULL,
            user_id      TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            pet_id       TEXT,
            emoji        TEXT    DEFAULT '',
            title        TEXT    NOT NULL,
            body         TEXT    DEFAULT '',
            when_display TEXT    DEFAULT '',
            when_ms      BIGINT,
            group_name   TEXT    DEFAULT 'Today',
            color        TEXT    DEFAULT '',
            sort_time    BIGINT,
            status       TEXT    DEFAULT 'upcoming',
            created_at   BIGINT  NOT NULL,
            expires_at   BIGINT  NOT NULL,
            PRIMARY KEY (alert_key, user_id)
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS alert_records")

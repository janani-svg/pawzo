"""add photo_url to users

Revision ID: g5h6i7j8k9l0
Revises: f2e1d4c3b5a6
Create Date: 2026-06-22
"""
from alembic import op

revision = 'g5h6i7j8k9l0'
down_revision = 'f2e1d4c3b5a6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT ''")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS photo_url")

"""add image_data to chat_messages (merge dead branch into head)

Revision ID: f2e1d4c3b5a6
Revises: d4e5f6a7b8c9
Create Date: 2026-06-22

"""
from alembic import op
import sqlalchemy as sa

revision = 'f2e1d4c3b5a6'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ADD COLUMN IF NOT EXISTS so this is safe even if the column
    # was created manually or by a now-orphaned branch migration.
    op.execute(
        "ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_data TEXT"
    )


def downgrade() -> None:
    op.drop_column('chat_messages', 'image_data')

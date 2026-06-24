"""add image_data to chat_messages

Revision ID: a3f1c2d4e5b6
Revises: e822ec567755
Create Date: 2026-06-19

"""
from alembic import op
import sqlalchemy as sa

revision = 'a3f1c2d4e5b6'
down_revision = 'e822ec567755'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('chat_messages', sa.Column('image_data', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('chat_messages', 'image_data')

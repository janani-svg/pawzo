"""add deletion_requested_at to users

Revision ID: m3n4o5p6q7r8
Revises: l2m3n4o5p6q7
Create Date: 2026-06-24

"""
from alembic import op
import sqlalchemy as sa

revision = 'm3n4o5p6q7r8'
down_revision = 'l2m3n4o5p6q7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('deletion_requested_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'deletion_requested_at')

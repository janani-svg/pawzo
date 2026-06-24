"""add all_day to calendar_events

Revision ID: l2m3n4o5p6q7
Revises: k1l2m3n4o5p6
Create Date: 2026-06-24

"""
from alembic import op
import sqlalchemy as sa

revision = 'l2m3n4o5p6q7'
down_revision = 'k1l2m3n4o5p6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('calendar_events', sa.Column('all_day', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('calendar_events', 'all_day')

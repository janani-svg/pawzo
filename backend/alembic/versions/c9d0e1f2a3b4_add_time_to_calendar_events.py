"""add time to calendar_events

Revision ID: c9d0e1f2a3b4
Revises: a3f1c2d4e5b6
Create Date: 2026-06-22

"""
from alembic import op
import sqlalchemy as sa

revision = 'c9d0e1f2a3b4'
down_revision = 'a3f1c2d4e5b6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('calendar_events', sa.Column('time', sa.String(), nullable=True, server_default=''))


def downgrade():
    op.drop_column('calendar_events', 'time')

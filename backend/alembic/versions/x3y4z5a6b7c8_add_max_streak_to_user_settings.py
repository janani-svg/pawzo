"""add max_streak to user_settings

Revision ID: x3y4z5a6b7c8
Revises: w2x3y4z5a6b7
Create Date: 2026-07-08

"""
from typing import Union, Sequence
import sqlalchemy as sa
from alembic import op

revision: str = 'x3y4z5a6b7c8'
down_revision: Union[str, Sequence[str], None] = 'w2x3y4z5a6b7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('user_settings', sa.Column('max_streak', sa.Integer(), nullable=True, server_default='0'))


def downgrade() -> None:
    op.drop_column('user_settings', 'max_streak')

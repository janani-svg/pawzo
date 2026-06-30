"""add recipe to meals

Revision ID: q2r3s4t5u6v7
Revises: o6p7q8r9s0t1, p1q2r3s4t5u6
Create Date: 2026-06-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'q2r3s4t5u6v7'
down_revision: Union[str, Sequence[str], None] = ('o6p7q8r9s0t1', 'p1q2r3s4t5u6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('meals', sa.Column('recipe', sa.Text(), nullable=True, server_default=''))


def downgrade() -> None:
    op.drop_column('meals', 'recipe')

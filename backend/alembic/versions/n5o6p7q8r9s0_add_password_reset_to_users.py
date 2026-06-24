"""add_password_reset_to_users

Revision ID: n5o6p7q8r9s0
Revises: 705f473ee5b5
Create Date: 2026-06-24 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'n5o6p7q8r9s0'
down_revision: Union[str, None] = '705f473ee5b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('password_reset_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('password_reset_token_expires', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'password_reset_token_expires')
    op.drop_column('users', 'password_reset_token')

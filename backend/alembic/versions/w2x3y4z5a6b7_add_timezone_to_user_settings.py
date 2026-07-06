"""add timezone column to user_settings

Revision ID: w2x3y4z5a6b7
Revises: v1w2x3y4z5a6
Create Date: 2026-07-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'w2x3y4z5a6b7'
down_revision: Union[str, Sequence[str], None] = 'v1w2x3y4z5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'user_settings',
        sa.Column('timezone', sa.String(), nullable=True, server_default='Asia/Kolkata'),
    )


def downgrade() -> None:
    op.drop_column('user_settings', 'timezone')

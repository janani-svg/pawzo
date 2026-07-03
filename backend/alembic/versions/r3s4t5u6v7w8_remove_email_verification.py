"""remove email verification columns from users

Revision ID: r3s4t5u6v7w8
Revises: q2r3s4t5u6v7
Create Date: 2026-07-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'r3s4t5u6v7w8'
down_revision: Union[str, Sequence[str], None] = 'q2r3s4t5u6v7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('users', 'verification_code_expires')
    op.drop_column('users', 'verification_code')
    op.drop_column('users', 'email_verified')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        'users',
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column('users', sa.Column('verification_code', sa.String(), nullable=True))
    op.add_column('users', sa.Column('verification_code_expires', sa.DateTime(), nullable=True))

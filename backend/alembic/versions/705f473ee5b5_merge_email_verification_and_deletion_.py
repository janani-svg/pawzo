"""merge_email_verification_and_deletion_branches

Revision ID: 705f473ee5b5
Revises: a1b2c3d4e5f6, m3n4o5p6q7r8
Create Date: 2026-06-24 12:46:47.967156

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '705f473ee5b5'
down_revision: Union[str, Sequence[str], None] = ('a1b2c3d4e5f6', 'm3n4o5p6q7r8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

"""fix fed_at column type to BIGINT (epoch ms overflows INTEGER)

Revision ID: k1l2m3n4o5p6
Revises: j0k1l2m3n4o5
Create Date: 2026-06-23

"""
from alembic import op

revision = 'k1l2m3n4o5p6'
down_revision = 'j0k1l2m3n4o5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE meal_logs ALTER COLUMN fed_at TYPE BIGINT")


def downgrade() -> None:
    op.execute("ALTER TABLE meal_logs ALTER COLUMN fed_at TYPE INTEGER")

"""add environment_tasks table

Revision ID: o6p7q8r9s0t1
Revises: n5o6p7q8r9s0
Create Date: 2026-06-27 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'o6p7q8r9s0t1'
down_revision: Union[str, None] = 'n5o6p7q8r9s0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS environment_tasks (
            id             TEXT      PRIMARY KEY,
            pet_id         TEXT      NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
            name           TEXT      NOT NULL,
            frequency      TEXT      DEFAULT 'Weekly',
            interval_days  INTEGER   DEFAULT 7,
            last_completed TEXT      DEFAULT '',
            next_due       TEXT      DEFAULT '',
            created_at     TIMESTAMP
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS environment_tasks")

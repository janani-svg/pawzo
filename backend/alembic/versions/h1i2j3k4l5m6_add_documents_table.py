"""add documents table

Revision ID: h1i2j3k4l5m6
Revises: g5h6i7j8k9l0
Create Date: 2026-06-22

"""
from alembic import op

revision = 'h1i2j3k4l5m6'
down_revision = 'g5h6i7j8k9l0'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name        TEXT NOT NULL,
            category    TEXT DEFAULT 'Other',
            file_data   TEXT DEFAULT '',
            mime_type   TEXT DEFAULT '',
            uploaded_at TEXT NOT NULL
        )
    """)


def downgrade():
    op.execute("DROP TABLE IF EXISTS documents")

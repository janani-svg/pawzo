"""add memory fields

Revision ID: d4e5f6a7b8c9
Revises: c9d0e1f2a3b4
Create Date: 2026-06-22

"""
from alembic import op
import sqlalchemy as sa

revision = 'd4e5f6a7b8c9'
down_revision = 'c9d0e1f2a3b4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('memories', sa.Column('title',      sa.String(),  nullable=True, server_default=''))
    op.add_column('memories', sa.Column('mood',       sa.String(),  nullable=True, server_default=''))
    op.add_column('memories', sa.Column('tags',       sa.Text(),    nullable=True, server_default=''))
    op.add_column('memories', sa.Column('media_type', sa.String(),  nullable=True, server_default='photo'))
    op.add_column('memories', sa.Column('time_taken', sa.String(),  nullable=True, server_default=''))


def downgrade() -> None:
    op.drop_column('memories', 'time_taken')
    op.drop_column('memories', 'media_type')
    op.drop_column('memories', 'tags')
    op.drop_column('memories', 'mood')
    op.drop_column('memories', 'title')

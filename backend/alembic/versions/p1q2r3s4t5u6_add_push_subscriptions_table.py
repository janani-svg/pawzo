"""add push_subscriptions table

Revision ID: p1q2r3s4t5u6
Revises: e822ec567755
Create Date: 2026-06-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'p1q2r3s4t5u6'
down_revision: Union[str, Sequence[str], None] = 'e822ec567755'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'push_subscriptions',
        sa.Column('id',         sa.String(),   nullable=False),
        sa.Column('user_id',    sa.String(),   sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('endpoint',   sa.Text(),     nullable=False),
        sa.Column('p256dh',     sa.Text(),     nullable=False),
        sa.Column('auth',       sa.Text(),     nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('endpoint'),
    )
    op.create_index('ix_push_subscriptions_user_id', 'push_subscriptions', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_push_subscriptions_user_id', table_name='push_subscriptions')
    op.drop_table('push_subscriptions')

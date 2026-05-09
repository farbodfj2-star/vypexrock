"""add telegram bot token

Revision ID: 20260426_0002
Revises: 20260420_0001
Create Date: 2026-04-26 15:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260426_0002"
down_revision = "20260420_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("telegram_accounts", sa.Column("bot_token", sa.String(length=256), nullable=True))


def downgrade() -> None:
    op.drop_column("telegram_accounts", "bot_token")

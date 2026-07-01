"""billing whatsapp cleanup

Revision ID: 20260701_0001
Revises: None
Create Date: 2026-07-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260701_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("whatsapp_accounts", sa.Column("phone_number_e164", sa.String(length=30), nullable=True))
    op.add_column("whatsapp_accounts", sa.Column("alias", sa.String(length=120), nullable=True))
    op.add_column("transactions", sa.Column("source", sa.String(length=40), nullable=True))
    op.add_column("transactions", sa.Column("whatsapp_account_id", sa.String(length=36), nullable=True))
    op.add_column("transactions", sa.Column("whatsapp_alias", sa.String(length=120), nullable=True))
    op.add_column("transactions", sa.Column("provider_message_id", sa.String(length=120), nullable=True))

    op.create_foreign_key(
        "fk_transactions_whatsapp_account_id",
        "transactions",
        "whatsapp_accounts",
        ["whatsapp_account_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_transactions_whatsapp_account_id", "transactions", type_="foreignkey")
    op.drop_column("transactions", "provider_message_id")
    op.drop_column("transactions", "whatsapp_alias")
    op.drop_column("transactions", "whatsapp_account_id")
    op.drop_column("transactions", "source")
    op.drop_column("whatsapp_accounts", "alias")
    op.drop_column("whatsapp_accounts", "phone_number_e164")

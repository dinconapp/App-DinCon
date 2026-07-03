"""add user address fields

Revision ID: 20260703_0001
Revises: 20260701_0001
Create Date: 2026-07-03 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260703_0001"
down_revision = "20260701_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("zip_code", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("address_number", sa.String(length=30), nullable=True))
    op.add_column("users", sa.Column("residence_type", sa.String(length=30), nullable=True))
    op.execute("COMMENT ON COLUMN public.users.zip_code IS 'CEP do usuario, preferencialmente no formato 00000-000.'")
    op.execute("COMMENT ON COLUMN public.users.address_number IS 'Numero do endereco do usuario.'")
    op.execute("COMMENT ON COLUMN public.users.residence_type IS 'Tipo de residencia: house/apartment.'")


def downgrade() -> None:
    op.drop_column("users", "residence_type")
    op.drop_column("users", "address_number")
    op.drop_column("users", "zip_code")

"""create user addresses table

Revision ID: 20260703_0003
Revises: 20260703_0002
Create Date: 2026-07-03 00:00:02.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260703_0003"
down_revision = "20260703_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_addresses",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("zip_code", sa.String(length=20), nullable=True),
        sa.Column("address_number", sa.String(length=30), nullable=True),
        sa.Column("residence_type", sa.String(length=30), nullable=True),
        sa.Column("street_name", sa.String(length=180), nullable=True),
        sa.Column("neighborhood", sa.String(length=120), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("federal_unit", sa.String(length=2), nullable=True),
        sa.Column("complement", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    op.execute("""
        INSERT INTO public.user_addresses (
            id, user_id, zip_code, address_number, residence_type, street_name, neighborhood, city, federal_unit, complement, created_at, updated_at
        )
        SELECT
            id,
            id,
            zip_code,
            address_number,
            residence_type,
            street_name,
            neighborhood,
            city,
            federal_unit,
            complement,
            created_at,
            updated_at
        FROM public.users
        WHERE
            zip_code IS NOT NULL
            OR address_number IS NOT NULL
            OR residence_type IS NOT NULL
            OR street_name IS NOT NULL
            OR neighborhood IS NOT NULL
            OR city IS NOT NULL
            OR federal_unit IS NOT NULL
            OR complement IS NOT NULL
    """)


def downgrade() -> None:
    op.drop_table("user_addresses")

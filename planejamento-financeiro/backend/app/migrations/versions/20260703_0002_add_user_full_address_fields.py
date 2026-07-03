"""add user full address fields

Revision ID: 20260703_0002
Revises: 20260703_0001
Create Date: 2026-07-03 00:00:01.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260703_0002"
down_revision = "20260703_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("street_name", sa.String(length=180), nullable=True))
    op.add_column("users", sa.Column("neighborhood", sa.String(length=120), nullable=True))
    op.add_column("users", sa.Column("city", sa.String(length=120), nullable=True))
    op.add_column("users", sa.Column("federal_unit", sa.String(length=2), nullable=True))
    op.add_column("users", sa.Column("complement", sa.String(length=120), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "complement")
    op.drop_column("users", "federal_unit")
    op.drop_column("users", "city")
    op.drop_column("users", "neighborhood")
    op.drop_column("users", "street_name")

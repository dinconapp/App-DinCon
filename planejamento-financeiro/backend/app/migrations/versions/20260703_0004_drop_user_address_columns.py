"""drop legacy user address columns

Revision ID: 20260703_0004
Revises: 20260703_0003
Create Date: 2026-07-03 00:00:03.000000
"""

from alembic import op


revision = "20260703_0004"
down_revision = "20260703_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for column in [
        "complement",
        "federal_unit",
        "city",
        "neighborhood",
        "street_name",
        "residence_type",
        "address_number",
        "zip_code",
    ]:
        op.drop_column("users", column)


def downgrade() -> None:
    pass

"""Widen inventory movement vehicle number

Revision ID: b4c5d6e7f8a9
Revises: acc38e8c9926
Create Date: 2026-06-29 14:30:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b4c5d6e7f8a9"
down_revision: Union[str, None] = "acc38e8c9926"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "inventory_movements",
        "vehicle_number",
        existing_type=sa.String(length=50),
        type_=sa.String(length=120),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "inventory_movements",
        "vehicle_number",
        existing_type=sa.String(length=120),
        type_=sa.String(length=50),
        existing_nullable=True,
    )

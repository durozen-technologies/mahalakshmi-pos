"""drop inventory movement quantity positive constraint

Revision ID: d199bf838d3f
Revises: 0f40690b114f
Create Date: 2026-06-27 13:18:12.715627
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'd199bf838d3f'
down_revision: Union[str, None] = '0f40690b114f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    if table_name not in sa.inspect(bind).get_table_names():
        return set()
    return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}


def _check_constraint_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    if table_name not in sa.inspect(bind).get_table_names():
        return set()
    return {constraint["name"] for constraint in sa.inspect(bind).get_check_constraints(table_name)}


def upgrade() -> None:
    if "tamil_name" in _column_names("shops"):
        op.drop_column("shops", "tamil_name")
    if "ck_inventory_movements_quantity_positive" in _check_constraint_names("inventory_movements"):
        op.drop_constraint("ck_inventory_movements_quantity_positive", "inventory_movements", type_="check")


def downgrade() -> None:
    if "tamil_name" not in _column_names("shops"):
        op.add_column(
            "shops",
            sa.Column(
                "tamil_name",
                sa.VARCHAR(length=120),
                server_default=sa.text("''::character varying"),
                autoincrement=False,
                nullable=False,
            ),
        )
    if "ck_inventory_movements_quantity_positive" not in _check_constraint_names(
        "inventory_movements"
    ):
        op.create_check_constraint(
            "ck_inventory_movements_quantity_positive", "inventory_movements", "quantity > 0"
        )

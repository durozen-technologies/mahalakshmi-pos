"""add item custom attributes

Revision ID: 0007_add_item_custom_attributes
Revises: 0006_price_query_indexes
Create Date: 2026-05-30 00:00:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007_add_item_custom_attributes"
down_revision: str | None = "0006_price_query_indexes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _table_names(bind) -> set[str]:
    return set(sa.inspect(bind).get_table_names())


def _column_names(bind, table_name: str) -> set[str]:
    if table_name not in _table_names(bind):
        return set()
    return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}


def _add_json_object_column_if_missing(table_name: str, column_name: str) -> None:
    if column_name in _column_names(op.get_bind(), table_name):
        return
    op.add_column(
        table_name,
        sa.Column(column_name, sa.JSON(), server_default=sa.text("'{}'"), nullable=False),
    )


def upgrade() -> None:
    _add_json_object_column_if_missing("items", "custom_attributes")
    _add_json_object_column_if_missing("shop_item_allocations", "custom_attributes")


def downgrade() -> None:
    bind = op.get_bind()
    if "custom_attributes" in _column_names(bind, "shop_item_allocations"):
        op.drop_column("shop_item_allocations", "custom_attributes")
    if "custom_attributes" in _column_names(bind, "items"):
        op.drop_column("items", "custom_attributes")

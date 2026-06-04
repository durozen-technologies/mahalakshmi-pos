"""inventory ledger performance indexes

Revision ID: 0017_inventory_ledger_perf
Revises: 0016_inventory_item_perf
Create Date: 2026-06-04 00:00:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0017_inventory_ledger_perf"
down_revision: str | None = "0016_inventory_item_perf"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _table_names(bind) -> set[str]:
    return set(sa.inspect(bind).get_table_names())


def _index_names(bind, table_name: str) -> set[str]:
    if table_name not in _table_names(bind):
        return set()
    return {index["name"] for index in sa.inspect(bind).get_indexes(table_name)}


def _create_simple_index_if_missing(table_name: str, index_name: str, columns: list[str]) -> None:
    bind = op.get_bind()
    if table_name not in _table_names(bind):
        return
    if index_name in _index_names(bind, table_name):
        return
    op.create_index(index_name, table_name, columns)


def upgrade() -> None:
    bind = op.get_bind()
    if "inventory_movements" not in _table_names(bind):
        return

    if bind.dialect.name == "postgresql":
        with op.get_context().autocommit_block():
            op.execute(
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_inventory_movements_shop_item_type
                ON inventory_movements (shop_id, inventory_item_id, movement_type)
                """
            )
            op.execute(
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_inventory_movements_shop_item_category_created
                ON inventory_movements (shop_id, inventory_item_id, category_id, created_at, id)
                """
            )
            op.execute(
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_inventory_movements_shop_category_type
                ON inventory_movements (shop_id, category_id, movement_type)
                """
            )
        return

    _create_simple_index_if_missing(
        "inventory_movements",
        "ix_inventory_movements_shop_item_type",
        ["shop_id", "inventory_item_id", "movement_type"],
    )
    _create_simple_index_if_missing(
        "inventory_movements",
        "ix_inventory_movements_shop_item_category_created",
        ["shop_id", "inventory_item_id", "category_id", "created_at", "id"],
    )
    _create_simple_index_if_missing(
        "inventory_movements",
        "ix_inventory_movements_shop_category_type",
        ["shop_id", "category_id", "movement_type"],
    )


def downgrade() -> None:
    bind = op.get_bind()
    index_names = (
        "ix_inventory_movements_shop_category_type",
        "ix_inventory_movements_shop_item_category_created",
        "ix_inventory_movements_shop_item_type",
    )

    if bind.dialect.name == "postgresql":
        with op.get_context().autocommit_block():
            for index_name in index_names:
                op.execute(f"DROP INDEX CONCURRENTLY IF EXISTS {index_name}")
        return

    for index_name in index_names:
        if index_name in _index_names(bind, "inventory_movements"):
            op.drop_index(index_name, table_name="inventory_movements")

"""inventory item list performance

Revision ID: 0016_inventory_item_perf
Revises: 0015_inventory_management
Create Date: 2026-06-04 00:00:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0016_inventory_item_perf"
down_revision: str | None = "0015_inventory_management"
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
    if "inventory_items" not in _table_names(bind):
        return

    if bind.dialect.name == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
        with op.get_context().autocommit_block():
            op.execute(
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_inventory_items_sort_lower_name
                ON inventory_items (sort_order, lower(name), id)
                """
            )
            op.execute(
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_inventory_items_active_sort_lower_name
                ON inventory_items (is_active, sort_order, lower(name), id)
                """
            )
            op.execute(
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_inventory_items_lower_name_trgm
                ON inventory_items USING gin (lower(name) gin_trgm_ops)
                """
            )
            op.execute(
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_inventory_items_lower_tamil_name_trgm
                ON inventory_items USING gin (lower(tamil_name) gin_trgm_ops)
                """
            )
        return

    _create_simple_index_if_missing(
        "inventory_items",
        "ix_inventory_items_sort_lower_name",
        ["sort_order", "name", "id"],
    )
    _create_simple_index_if_missing(
        "inventory_items",
        "ix_inventory_items_active_sort_lower_name",
        ["is_active", "sort_order", "name", "id"],
    )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        with op.get_context().autocommit_block():
            for index_name in (
                "ix_inventory_items_lower_tamil_name_trgm",
                "ix_inventory_items_lower_name_trgm",
                "ix_inventory_items_active_sort_lower_name",
                "ix_inventory_items_sort_lower_name",
            ):
                op.execute(f"DROP INDEX CONCURRENTLY IF EXISTS {index_name}")
        return

    for index_name in (
        "ix_inventory_items_active_sort_lower_name",
        "ix_inventory_items_sort_lower_name",
    ):
        if index_name in _index_names(bind, "inventory_items"):
            op.drop_index(index_name, table_name="inventory_items")

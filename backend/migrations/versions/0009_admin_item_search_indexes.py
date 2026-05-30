"""admin item search indexes

Revision ID: 0009_admin_item_search_indexes
Revises: 0008_admin_item_management
Create Date: 2026-05-30 00:00:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0009_admin_item_search_indexes"
down_revision: str | None = "0008_admin_item_management"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _table_names(bind) -> set[str]:
    return set(sa.inspect(bind).get_table_names())


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    tables = _table_names(bind)
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    if "items" in tables:
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_items_lower_name_trgm "
            "ON items USING gin (lower(name) gin_trgm_ops)"
        )
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_items_lower_tamil_name_trgm "
            "ON items USING gin (lower(coalesce(tamil_name, '')) gin_trgm_ops)"
        )
    if "shop_item_allocations" in tables:
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_shop_item_allocations_lower_display_name_trgm "
            "ON shop_item_allocations USING gin (lower(coalesce(display_name, '')) gin_trgm_ops)"
        )
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_shop_item_allocations_lower_tamil_name_trgm "
            "ON shop_item_allocations USING gin (lower(coalesce(tamil_name, '')) gin_trgm_ops)"
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    for index_name in (
        "ix_shop_item_allocations_lower_tamil_name_trgm",
        "ix_shop_item_allocations_lower_display_name_trgm",
        "ix_items_lower_tamil_name_trgm",
        "ix_items_lower_name_trgm",
    ):
        op.execute(f"DROP INDEX IF EXISTS {index_name}")

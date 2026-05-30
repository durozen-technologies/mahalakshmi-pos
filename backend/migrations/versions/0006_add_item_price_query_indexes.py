"""add item price query indexes

Revision ID: 0006_price_query_indexes
Revises: 0005_add_shop_item_allocations
Create Date: 2026-05-30 00:00:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006_price_query_indexes"
down_revision: str | None = "0005_add_shop_item_allocations"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _table_names(bind) -> set[str]:
    return set(sa.inspect(bind).get_table_names())


def _index_names(bind, table_name: str) -> set[str]:
    if table_name not in _table_names(bind):
        return set()
    return {index["name"] for index in sa.inspect(bind).get_indexes(table_name)}


def _column_names(bind, table_name: str) -> set[str]:
    if table_name not in _table_names(bind):
        return set()
    return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    if "created_at" not in _column_names(bind, "daily_prices"):
        op.add_column(
            "daily_prices",
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )

    existing_indexes = _index_names(bind, "daily_prices")

    if "ix_daily_prices_shop_item_latest" not in existing_indexes:
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_daily_prices_shop_item_latest "
            "ON daily_prices (shop_id, item_id, price_date DESC, created_at DESC, id DESC)"
        )
    if "ix_daily_prices_item_latest" not in existing_indexes:
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_daily_prices_item_latest "
            "ON daily_prices (item_id, price_date DESC, created_at DESC, id DESC)"
        )


def downgrade() -> None:
    bind = op.get_bind()
    existing_indexes = _index_names(bind, "daily_prices")
    if "ix_daily_prices_item_latest" in existing_indexes:
        op.drop_index("ix_daily_prices_item_latest", table_name="daily_prices")
    if "ix_daily_prices_shop_item_latest" in existing_indexes:
        op.drop_index("ix_daily_prices_shop_item_latest", table_name="daily_prices")

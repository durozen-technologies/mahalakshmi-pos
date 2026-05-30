"""add item created timestamp

Revision ID: 0004_add_item_created_at
Revises: 0003_add_shop_scoped_items
Create Date: 2026-05-29 00:00:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_add_item_created_at"
down_revision: str | None = "0003_add_shop_scoped_items"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _table_names(bind) -> set[str]:
    return set(sa.inspect(bind).get_table_names())


def _column_names(bind, table_name: str) -> set[str]:
    if table_name not in _table_names(bind):
        return set()
    return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}


def _index_names(bind, table_name: str) -> set[str]:
    if table_name not in _table_names(bind):
        return set()
    return {index["name"] for index in sa.inspect(bind).get_indexes(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    if "created_at" not in _column_names(bind, "items"):
        op.add_column(
            "items",
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
    if "ix_items_created_at" not in _index_names(bind, "items"):
        op.create_index("ix_items_created_at", "items", ["created_at"])


def downgrade() -> None:
    bind = op.get_bind()
    if "ix_items_created_at" in _index_names(bind, "items"):
        op.drop_index("ix_items_created_at", table_name="items")
    if "created_at" in _column_names(bind, "items"):
        op.drop_column("items", "created_at")

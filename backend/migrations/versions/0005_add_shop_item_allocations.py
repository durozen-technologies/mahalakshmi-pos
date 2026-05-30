"""add explicit shop item allocations

Revision ID: 0005_add_shop_item_allocations
Revises: 0004_add_item_created_at
Create Date: 2026-05-30 00:00:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_add_shop_item_allocations"
down_revision: str | None = "0004_add_item_created_at"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _table_names(bind) -> set[str]:
    return set(sa.inspect(bind).get_table_names())


def _index_names(bind, table_name: str) -> set[str]:
    if table_name not in _table_names(bind):
        return set()
    return {index["name"] for index in sa.inspect(bind).get_indexes(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    if "shop_item_allocations" not in _table_names(bind):
        op.create_table(
            "shop_item_allocations",
            sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
            sa.Column("shop_id", sa.Uuid(as_uuid=True), nullable=False),
            sa.Column("item_id", sa.Uuid(as_uuid=True), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["item_id"], ["items.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["shop_id"], ["shops.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("shop_id", "item_id", name="uq_shop_item_allocations_shop_item"),
        )

    if "ix_shop_item_allocations_id" not in _index_names(bind, "shop_item_allocations"):
        op.create_index("ix_shop_item_allocations_id", "shop_item_allocations", ["id"])
    if "ix_shop_item_allocations_shop_id" not in _index_names(bind, "shop_item_allocations"):
        op.create_index("ix_shop_item_allocations_shop_id", "shop_item_allocations", ["shop_id"])
    if "ix_shop_item_allocations_item_id" not in _index_names(bind, "shop_item_allocations"):
        op.create_index("ix_shop_item_allocations_item_id", "shop_item_allocations", ["item_id"])
    if "ix_shop_item_allocations_created_at" not in _index_names(bind, "shop_item_allocations"):
        op.create_index(
            "ix_shop_item_allocations_created_at", "shop_item_allocations", ["created_at"]
        )

    if bind.dialect.name == "postgresql":
        op.execute(
            """
            INSERT INTO shop_item_allocations (id, shop_id, item_id, created_at)
            SELECT CAST(md5(random()::text || clock_timestamp()::text) AS uuid),
                   daily_prices.shop_id,
                   daily_prices.item_id,
                   now()
            FROM daily_prices
            JOIN items ON items.id = daily_prices.item_id
            WHERE items.shop_id IS NULL
            ON CONFLICT (shop_id, item_id) DO NOTHING
            """
        )


def downgrade() -> None:
    bind = op.get_bind()
    if "shop_item_allocations" in _table_names(bind):
        op.drop_table("shop_item_allocations")

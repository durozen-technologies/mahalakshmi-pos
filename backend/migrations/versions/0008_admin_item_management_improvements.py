"""admin item management improvements

Revision ID: 0008_admin_item_management
Revises: 0007_add_item_custom_attributes
Create Date: 2026-05-30 00:00:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008_admin_item_management"
down_revision: str | None = "0007_add_item_custom_attributes"
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


def _constraint_names(bind, table_name: str) -> set[str]:
    if table_name not in _table_names(bind):
        return set()
    inspector = sa.inspect(bind)
    names = set()
    for collection in (
        inspector.get_check_constraints(table_name),
        inspector.get_unique_constraints(table_name),
        inspector.get_foreign_keys(table_name),
    ):
        names.update(item["name"] for item in collection if item.get("name"))
    return names


def _add_column_if_missing(table_name: str, column: sa.Column) -> None:
    if column.name not in _column_names(op.get_bind(), table_name):
        op.add_column(table_name, column)


def _enum_type(name: str, values: Sequence[str]) -> sa.Enum:
    return sa.Enum(*values, name=name)


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name
    timestamp_default = sa.func.now()
    unit_type_enum = _enum_type("unittype", ("WEIGHT", "COUNT"))
    base_unit_enum = _enum_type("baseunit", ("KG", "UNIT"))

    if "items" in _table_names(bind):
        _add_column_if_missing(
            "items",
            sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        )
        _add_column_if_missing("items", sa.Column("category", sa.String(length=80), nullable=True))
        _add_column_if_missing(
            "items",
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=timestamp_default,
                nullable=False,
            ),
        )
        op.execute(
            "UPDATE items SET tamil_name = name WHERE tamil_name IS NULL OR trim(tamil_name) = ''"
        )
        if dialect != "sqlite":
            op.alter_column("items", "tamil_name", nullable=False)
            constraints = _constraint_names(bind, "items")
            if "ck_items_name_not_blank" not in constraints:
                op.create_check_constraint(
                    "ck_items_name_not_blank",
                    "items",
                    "length(trim(name)) >= 2",
                )
            if "ck_items_tamil_name_not_blank" not in constraints:
                op.create_check_constraint(
                    "ck_items_tamil_name_not_blank",
                    "items",
                    "length(trim(tamil_name)) >= 1",
                )
            if "ck_items_unit_pair" not in constraints:
                op.create_check_constraint(
                    "ck_items_unit_pair",
                    "items",
                    "(unit_type = 'WEIGHT' AND base_unit = 'KG') OR "
                    "(unit_type = 'COUNT' AND base_unit = 'UNIT')",
                )
            if dialect == "postgresql":
                op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
                if "ix_items_name_trgm" not in _index_names(bind, "items"):
                    op.execute(
                        "CREATE INDEX IF NOT EXISTS ix_items_name_trgm "
                        "ON items USING gin (name gin_trgm_ops)"
                    )
                if "ix_items_tamil_name_trgm" not in _index_names(bind, "items"):
                    op.execute(
                        "CREATE INDEX IF NOT EXISTS ix_items_tamil_name_trgm "
                        "ON items USING gin (tamil_name gin_trgm_ops)"
                    )
        if "ix_items_sort_name" not in _index_names(bind, "items"):
            op.create_index("ix_items_sort_name", "items", ["sort_order", "name", "id"])

    if "shop_item_allocations" in _table_names(bind):
        _add_column_if_missing(
            "shop_item_allocations",
            sa.Column("display_name", sa.String(length=120), nullable=True),
        )
        _add_column_if_missing(
            "shop_item_allocations",
            sa.Column("tamil_name", sa.String(length=120), nullable=True),
        )
        _add_column_if_missing(
            "shop_item_allocations",
            sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        )
        _add_column_if_missing(
            "shop_item_allocations",
            sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        )
        _add_column_if_missing(
            "shop_item_allocations",
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=timestamp_default,
                nullable=False,
            ),
        )
        if "ix_shop_item_allocations_sort" not in _index_names(bind, "shop_item_allocations"):
            op.create_index(
                "ix_shop_item_allocations_sort",
                "shop_item_allocations",
                ["shop_id", "is_active", "sort_order", "item_id"],
            )

    if "bill_items" in _table_names(bind):
        _add_column_if_missing(
            "bill_items", sa.Column("item_name", sa.String(length=120), nullable=True)
        )
        _add_column_if_missing(
            "bill_items", sa.Column("item_tamil_name", sa.String(length=120), nullable=True)
        )
        _add_column_if_missing(
            "bill_items", sa.Column("item_unit_type", unit_type_enum, nullable=True)
        )
        _add_column_if_missing(
            "bill_items", sa.Column("item_base_unit", base_unit_enum, nullable=True)
        )
        op.execute(
            """
            UPDATE bill_items
            SET item_name = COALESCE(item_name, (SELECT name FROM items WHERE items.id = bill_items.item_id)),
                item_tamil_name = COALESCE(item_tamil_name, (SELECT tamil_name FROM items WHERE items.id = bill_items.item_id)),
                item_unit_type = COALESCE(item_unit_type, (SELECT unit_type FROM items WHERE items.id = bill_items.item_id)),
                item_base_unit = COALESCE(item_base_unit, unit)
            """
        )

    if "item_change_events" not in _table_names(bind):
        op.create_table(
            "item_change_events",
            sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
            sa.Column("item_id", sa.Uuid(as_uuid=True), nullable=True),
            sa.Column("shop_id", sa.Uuid(as_uuid=True), nullable=True),
            sa.Column("event_type", sa.String(length=50), nullable=False),
            sa.Column("before", sa.JSON(), nullable=False),
            sa.Column("after", sa.JSON(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=timestamp_default,
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["item_id"], ["items.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["shop_id"], ["shops.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
    if "ix_item_change_events_id" not in _index_names(bind, "item_change_events"):
        op.create_index("ix_item_change_events_id", "item_change_events", ["id"])
    if "ix_item_change_events_item_id" not in _index_names(bind, "item_change_events"):
        op.create_index("ix_item_change_events_item_id", "item_change_events", ["item_id"])
    if "ix_item_change_events_shop_id" not in _index_names(bind, "item_change_events"):
        op.create_index("ix_item_change_events_shop_id", "item_change_events", ["shop_id"])
    if "ix_item_change_events_created_at" not in _index_names(bind, "item_change_events"):
        op.create_index("ix_item_change_events_created_at", "item_change_events", ["created_at"])


def downgrade() -> None:
    bind = op.get_bind()
    if "item_change_events" in _table_names(bind):
        op.drop_table("item_change_events")

    if "ix_shop_item_allocations_sort" in _index_names(bind, "shop_item_allocations"):
        op.drop_index("ix_shop_item_allocations_sort", table_name="shop_item_allocations")

    for column_name in ("updated_at", "sort_order", "is_active", "tamil_name", "display_name"):
        if column_name in _column_names(bind, "shop_item_allocations"):
            op.drop_column("shop_item_allocations", column_name)

    if "ix_items_sort_name" in _index_names(bind, "items"):
        op.drop_index("ix_items_sort_name", table_name="items")
    if bind.dialect.name == "postgresql":
        for index_name in ("ix_items_tamil_name_trgm", "ix_items_name_trgm"):
            if index_name in _index_names(bind, "items"):
                op.drop_index(index_name, table_name="items")

    for column_name in ("updated_at", "category", "sort_order"):
        if column_name in _column_names(bind, "items"):
            op.drop_column("items", column_name)

    for column_name in ("item_base_unit", "item_unit_type", "item_tamil_name", "item_name"):
        if column_name in _column_names(bind, "bill_items"):
            op.drop_column("bill_items", column_name)

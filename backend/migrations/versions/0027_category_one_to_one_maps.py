"""category-aware one-to-one inventory billing mappings

Revision ID: 0027_category_one_to_one_maps
Revises: 0026_drop_use_category_ck
Create Date: 2026-06-10 00:00:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0027_category_one_to_one_maps"
down_revision: str | None = "0026_drop_use_category_ck"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

MAPPING_TABLE = "inventory_item_billing_mappings"
CATEGORY_COLUMN = "inventory_category_id"
CATEGORY_FK = "fk_inventory_item_billing_mappings_category"
OLD_UNIQUE_CONSTRAINT = "uq_inventory_item_billing_mappings"
BILLING_UNIQUE_CONSTRAINT = "uq_inventory_item_billing_map_billing"
OLD_ITEM_LEVEL_INDEX = "ux_inventory_item_billing_mappings_item_billing"
CATEGORY_INDEX = "ux_inventory_item_billing_map_item_category"
UNCATEGORIZED_INDEX = "ux_inventory_item_billing_map_item_uncategorized"


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


def _foreign_key_names(bind, table_name: str) -> set[str]:
    if table_name not in _table_names(bind):
        return set()
    return {
        foreign_key["name"]
        for foreign_key in sa.inspect(bind).get_foreign_keys(table_name)
        if foreign_key.get("name")
    }


def _unique_constraints(bind, table_name: str) -> dict[str, tuple[str, ...]]:
    if table_name not in _table_names(bind):
        return {}
    return {
        constraint["name"]: tuple(constraint.get("column_names") or ())
        for constraint in sa.inspect(bind).get_unique_constraints(table_name)
        if constraint.get("name")
    }


def _add_category_column_if_missing(bind) -> None:
    if CATEGORY_COLUMN in _column_names(bind, MAPPING_TABLE):
        return
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table(MAPPING_TABLE) as batch_op:
            batch_op.add_column(sa.Column(CATEGORY_COLUMN, sa.Uuid(as_uuid=True), nullable=True))
            batch_op.create_foreign_key(
                CATEGORY_FK,
                "inventory_categories",
                [CATEGORY_COLUMN],
                ["id"],
                ondelete="CASCADE",
            )
        return
    op.add_column(MAPPING_TABLE, sa.Column(CATEGORY_COLUMN, sa.Uuid(as_uuid=True), nullable=True))
    op.create_foreign_key(
        CATEGORY_FK,
        MAPPING_TABLE,
        "inventory_categories",
        [CATEGORY_COLUMN],
        ["id"],
        ondelete="CASCADE",
    )


def _drop_unique_if_exists(bind, constraint_name: str) -> None:
    if constraint_name not in _unique_constraints(bind, MAPPING_TABLE):
        return
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table(MAPPING_TABLE) as batch_op:
            batch_op.drop_constraint(constraint_name, type_="unique")
        return
    op.drop_constraint(constraint_name, MAPPING_TABLE, type_="unique")


def _create_unique_if_missing(bind, constraint_name: str, columns: list[str]) -> None:
    if constraint_name in _unique_constraints(bind, MAPPING_TABLE):
        return
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table(MAPPING_TABLE) as batch_op:
            batch_op.create_unique_constraint(constraint_name, columns)
        return
    op.create_unique_constraint(constraint_name, MAPPING_TABLE, columns)


def _drop_foreign_key_if_exists(bind, constraint_name: str) -> None:
    if constraint_name not in _foreign_key_names(bind, MAPPING_TABLE):
        return
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table(MAPPING_TABLE) as batch_op:
            batch_op.drop_constraint(constraint_name, type_="foreignkey")
        return
    op.drop_constraint(constraint_name, MAPPING_TABLE, type_="foreignkey")


def _drop_index_if_exists(bind, index_name: str) -> None:
    if index_name in _index_names(bind, MAPPING_TABLE):
        op.drop_index(index_name, table_name=MAPPING_TABLE)


def _create_partial_indexes_if_missing(bind) -> None:
    indexes = _index_names(bind, MAPPING_TABLE)
    if CATEGORY_INDEX not in indexes:
        op.create_index(
            CATEGORY_INDEX,
            MAPPING_TABLE,
            ["inventory_item_id", CATEGORY_COLUMN],
            unique=True,
            postgresql_where=sa.text(f"{CATEGORY_COLUMN} IS NOT NULL"),
            sqlite_where=sa.text(f"{CATEGORY_COLUMN} IS NOT NULL"),
        )
    if UNCATEGORIZED_INDEX not in indexes:
        op.create_index(
            UNCATEGORIZED_INDEX,
            MAPPING_TABLE,
            ["inventory_item_id"],
            unique=True,
            postgresql_where=sa.text(f"{CATEGORY_COLUMN} IS NULL"),
            sqlite_where=sa.text(f"{CATEGORY_COLUMN} IS NULL"),
        )


def _backfill_single_category_mappings(bind) -> None:
    bind.execute(
        sa.text(
            f"""
            UPDATE {MAPPING_TABLE}
            SET {CATEGORY_COLUMN} = (
                SELECT inventory_item_categories.category_id
                FROM inventory_item_categories
                WHERE inventory_item_categories.inventory_item_id =
                    {MAPPING_TABLE}.inventory_item_id
                ORDER BY inventory_item_categories.created_at, inventory_item_categories.id
                LIMIT 1
            )
            WHERE {CATEGORY_COLUMN} IS NULL
                AND (
                    SELECT count(*)
                    FROM inventory_item_categories
                    WHERE inventory_item_categories.inventory_item_id =
                        {MAPPING_TABLE}.inventory_item_id
                ) = 1
            """
        )
    )


def _dedupe_source_mappings(bind) -> None:
    bind.execute(
        sa.text(
            f"""
            WITH ranked AS (
                SELECT
                    id,
                    row_number() OVER (
                        PARTITION BY inventory_item_id, {CATEGORY_COLUMN}
                        ORDER BY created_at, id
                    ) AS rn
                FROM {MAPPING_TABLE}
            )
            DELETE FROM {MAPPING_TABLE}
            WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
            """
        )
    )


def _dedupe_billing_items(bind) -> None:
    bind.execute(
        sa.text(
            f"""
            WITH ranked AS (
                SELECT
                    id,
                    row_number() OVER (
                        PARTITION BY billing_item_id
                        ORDER BY created_at, id
                    ) AS rn
                FROM {MAPPING_TABLE}
            )
            DELETE FROM {MAPPING_TABLE}
            WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
            """
        )
    )


def upgrade() -> None:
    bind = op.get_bind()
    required_tables = {
        MAPPING_TABLE,
        "inventory_categories",
        "inventory_item_categories",
        "items",
    }
    if not required_tables.issubset(_table_names(bind)):
        return

    _add_category_column_if_missing(bind)
    _backfill_single_category_mappings(bind)
    _drop_index_if_exists(bind, OLD_ITEM_LEVEL_INDEX)
    _drop_unique_if_exists(bind, OLD_UNIQUE_CONSTRAINT)
    _dedupe_source_mappings(bind)
    _dedupe_billing_items(bind)
    _create_unique_if_missing(bind, BILLING_UNIQUE_CONSTRAINT, ["billing_item_id"])
    _create_partial_indexes_if_missing(bind)


def downgrade() -> None:
    bind = op.get_bind()
    if MAPPING_TABLE not in _table_names(bind):
        return

    _drop_index_if_exists(bind, CATEGORY_INDEX)
    _drop_index_if_exists(bind, UNCATEGORIZED_INDEX)
    _drop_unique_if_exists(bind, BILLING_UNIQUE_CONSTRAINT)
    if CATEGORY_COLUMN in _column_names(bind, MAPPING_TABLE):
        _drop_foreign_key_if_exists(bind, CATEGORY_FK)
        if bind.dialect.name == "sqlite":
            with op.batch_alter_table(MAPPING_TABLE) as batch_op:
                batch_op.drop_column(CATEGORY_COLUMN)
        else:
            op.drop_column(MAPPING_TABLE, CATEGORY_COLUMN)
    _create_unique_if_missing(
        bind,
        OLD_UNIQUE_CONSTRAINT,
        ["inventory_item_id", "billing_item_id"],
    )

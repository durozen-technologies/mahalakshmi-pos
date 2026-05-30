"""drop legacy item image byte column

Revision ID: 0002_drop_legacy_item_image_data
Revises: 0001_current_schema
Create Date: 2026-05-29 00:00:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_drop_legacy_item_image_data"
down_revision: str | None = "0001_current_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _column_names(bind, table_name: str) -> set[str]:
    table_names = set(sa.inspect(bind).get_table_names())
    if table_name not in table_names:
        return set()
    return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    if "image_data" not in _column_names(bind, "items"):
        return

    remaining_rows = bind.execute(
        sa.text("SELECT COUNT(*) FROM items WHERE image_data IS NOT NULL")
    ).scalar_one()
    if remaining_rows:
        raise RuntimeError(
            "Cannot drop items.image_data because legacy image bytes still exist. "
            "Configure RustFS and run `python migrate.py` again so images are migrated first."
        )

    op.drop_column("items", "image_data")


def downgrade() -> None:
    if "image_data" in _column_names(op.get_bind(), "items"):
        return
    op.add_column("items", sa.Column("image_data", sa.LargeBinary(), nullable=True))

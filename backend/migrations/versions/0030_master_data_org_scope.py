"""compatibility marker for removed master data org scope revision

Revision ID: 0030_master_data_org_scope
Revises: b4c5d6e7f8a9
Create Date: 2026-07-15 08:20:00
"""

from __future__ import annotations

from collections.abc import Sequence

revision: str = "0030_master_data_org_scope"
down_revision: str | None = "b4c5d6e7f8a9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ponytail: compatibility marker only; old DBs stamped here already have current schema.
    pass


def downgrade() -> None:
    pass

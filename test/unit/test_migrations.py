from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

MIGRATION_VERSION_LIMIT = 32
MIGRATION_VERSIONS_DIR = Path(__file__).resolve().parents[2] / "backend" / "migrations" / "versions"


def _load_migration_module(path: Path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    if spec is None or spec.loader is None:
        raise AssertionError(f"Unable to load migration module {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class MigrationTests(unittest.TestCase):
    def test_revision_ids_fit_default_alembic_version_column(self) -> None:
        for path in sorted(MIGRATION_VERSIONS_DIR.glob("*.py")):
            module = _load_migration_module(path)
            revision = getattr(module, "revision", "")
            self.assertLessEqual(
                len(revision),
                MIGRATION_VERSION_LIMIT,
                f"{path.name} revision id is too long for alembic_version.version_num",
            )

    def test_removed_master_data_revision_remains_as_compatibility_head(self) -> None:
        revisions = {}
        for path in sorted(MIGRATION_VERSIONS_DIR.glob("*.py")):
            module = _load_migration_module(path)
            revisions[getattr(module, "revision", "")] = getattr(module, "down_revision", None)

        self.assertEqual(
            revisions["0030_master_data_org_scope"],
            "b4c5d6e7f8a9",
        )

    def test_driver_vehicle_migration_does_not_repeat_de470_index_churn(self) -> None:
        migration = MIGRATION_VERSIONS_DIR / "1fb8087fddba_add_driver_and_vehicle_to_inventory_.py"
        source = migration.read_text(encoding="utf-8")

        self.assertNotIn("ix_expense_entries_created_at", source)

    def test_quantity_constraint_migration_guards_removed_shop_tamil_name(self) -> None:
        migration = MIGRATION_VERSIONS_DIR / "d199bf838d3f_drop_inventory_movement_quantity_.py"
        source = migration.read_text(encoding="utf-8")

        self.assertIn('"tamil_name" in _column_names("shops")', source)
        self.assertIn("ck_inventory_movements_quantity_positive", source)


if __name__ == "__main__":
    unittest.main()

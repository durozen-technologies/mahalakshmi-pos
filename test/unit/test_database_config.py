from __future__ import annotations

# ruff: noqa: I001 - test.support must run before importing app modules.

from pathlib import Path
import unittest

import test.support  # noqa: F401 - adds backend/ to sys.path
from app.db.database import _build_engine_config


class DatabaseConfigTests(unittest.TestCase):
    def test_ssl_query_becomes_asyncpg_connect_arg(self) -> None:
        url, connect_args = _build_engine_config(
            "postgresql+asyncpg://postgres:secret@postgres:5432/meat_billing"
            "?ssl=prefer&application_name=mlb-pos"
        )

        self.assertEqual(connect_args, {"ssl": "prefer"})
        self.assertEqual(url.query, {"application_name": "mlb-pos"})

    def test_libpq_sslmode_query_becomes_asyncpg_connect_arg(self) -> None:
        url, connect_args = _build_engine_config(
            "postgresql://postgres:secret@postgres:5432/meat_billing?sslmode=require"
        )

        self.assertEqual(url.drivername, "postgresql+asyncpg")
        self.assertEqual(connect_args, {"ssl": "require"})
        self.assertNotIn("sslmode", url.query)

    def test_prod_compose_default_uses_internal_postgres_url(self) -> None:
        compose_path = Path(__file__).resolve().parents[2] / "docker-compose.prod.yml"

        self.assertIn(
            "DATABASE_URL: ${BACKEND_DATABASE_URL:-postgresql+asyncpg://",
            compose_path.read_text(encoding="utf-8"),
        )
        self.assertNotIn("?ssl=", compose_path.read_text(encoding="utf-8"))

    def test_prod_compose_requires_non_default_shop_password_secret(self) -> None:
        compose_path = Path(__file__).resolve().parents[2] / "docker-compose.prod.yml"

        self.assertIn(
            "SHOP_DEFAULT_PASSWORD: ${BACKEND_SHOP_DEFAULT_PASSWORD:?Set BACKEND_SHOP_DEFAULT_PASSWORD}",
            compose_path.read_text(encoding="utf-8"),
        )

    def test_deploy_workflow_writes_shop_password_secret(self) -> None:
        workflow_path = (
            Path(__file__).resolve().parents[2] / ".github" / "workflows" / "deploy-prod.yml"
        )
        workflow = workflow_path.read_text(encoding="utf-8")

        self.assertIn(
            "BACKEND_SHOP_DEFAULT_PASSWORD: ${{ secrets.BACKEND_SHOP_DEFAULT_PASSWORD }}",
            workflow,
        )
        self.assertIn('"BACKEND_SHOP_DEFAULT_PASSWORD": os.environ["BACKEND_SHOP_DEFAULT_PASSWORD"]', workflow)

    def test_deploy_script_allows_internal_postgres_network(self) -> None:
        script_path = Path(__file__).resolve().parents[2] / "scripts" / "deploy-prod.sh"
        script = script_path.read_text(encoding="utf-8")

        self.assertIn("ensure_postgres_internal_hba", script)
        self.assertIn("host all all samenet scram-sha-256", script)
        self.assertIn("SELECT pg_reload_conf()", script)


if __name__ == "__main__":
    unittest.main()

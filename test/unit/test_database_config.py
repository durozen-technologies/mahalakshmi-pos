from __future__ import annotations

import unittest
from pathlib import Path

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

    def test_prod_compose_default_requests_ssl_with_fallback(self) -> None:
        compose_path = Path(__file__).resolve().parents[2] / "docker-compose.prod.yml"

        self.assertIn("?ssl=prefer}", compose_path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()

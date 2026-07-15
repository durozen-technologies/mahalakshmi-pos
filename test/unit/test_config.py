from __future__ import annotations

import unittest

from pydantic import ValidationError

import test.support  # noqa: F401 - adds backend/ to sys.path
from app.core.config import Settings


def _production_settings_kwargs() -> dict[str, object]:
    return {
        "production": True,
        "secret_key": "x" * 32,
        "database_url": "postgresql+asyncpg://postgres:secret@postgres:5432/meat_billing?ssl=require",
        "allowed_hosts_raw": '["example.com","backend"]',
        "rustfs_endpoint_url": "http://rustfs:9000",
        "rustfs_access_key_id": "access-key",
        "rustfs_secret_access_key": "secret-key",
        "shop_default_password": "changed-shop-password",
    }


class ConfigTests(unittest.TestCase):
    def test_production_settings_accept_non_default_shop_password(self) -> None:
        settings = Settings(**_production_settings_kwargs())

        self.assertEqual(settings.shop_default_password, "changed-shop-password")

    def test_production_settings_reject_default_shop_password(self) -> None:
        kwargs = _production_settings_kwargs()
        kwargs["shop_default_password"] = "ml123"

        with self.assertRaisesRegex(
            ValidationError,
            "SHOP_DEFAULT_PASSWORD must be changed from the default in production",
        ):
            Settings(**kwargs)


if __name__ == "__main__":
    unittest.main()

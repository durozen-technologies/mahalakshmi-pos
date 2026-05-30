from __future__ import annotations

from datetime import date
from decimal import Decimal
from unittest.mock import patch

from test.support import AsyncSessionAdapter, BackendTestCase

from fastapi import HTTPException
from sqlalchemy import select, text

from app.db import storage as item_storage
from app.models import BaseUnit, Bill, DailyPrice, Item, Shop, UnitType, User
from app.schemas.admin import ItemCreate, ShopCreate
from app.schemas.auth import RegisterRequest
from app.schemas.billing import (
    BillCheckoutCommitRequest,
    BillCheckoutRequest,
    BillItemInput,
    CheckoutPaymentInput,
)
from app.schemas.pricing import DailyPriceCreate, DailyPriceEntry
from app.services.admin import create_shop_account
from app.services.auth import register_admin
from app.services.billing import create_bill, preview_bill
from app.services.pricing import create_daily_prices, create_global_daily_prices, get_global_bootstrap


class ServiceUnitTests(BackendTestCase):
    def test_register_admin_rejects_second_admin(self) -> None:
        self.run_async(self.harness.create_admin_user())

        async def scenario() -> None:
            with self.harness.session_factory() as session:
                db = AsyncSessionAdapter(session)
                with self.assertRaises(HTTPException) as ctx:
                    await register_admin(
                        db,
                        RegisterRequest(
                            username="second-admin",
                            password="password123",
                            confirm_password="password123",
                        ),
                    )
                self.assertEqual(ctx.exception.status_code, 409)
                self.assertEqual(
                    ctx.exception.detail, "Admin registration is already completed"
                )

        self.run_async(scenario())

    def test_create_shop_account_returns_created_shop(self) -> None:
        actor = self.run_async(self.harness.create_admin_user())
        self.run_async(
            self.harness.create_shop_user(username="ml7", shop_name="Existing Shop")
        )

        async def scenario() -> None:
            with self.harness.session_factory() as session:
                created = await create_shop_account(
                    AsyncSessionAdapter(session),
                    ShopCreate(
                        name="Fresh Shop", username="ml8", password="password123"
                    ),
                    actor,
                )
                self.assertEqual(created.username, "ml8")
                self.assertEqual(created.name, "Fresh Shop")

        self.run_async(scenario())

    def test_seeded_default_items_do_not_store_database_images(self) -> None:
        async def scenario() -> None:
            with self.harness.session_factory() as session:
                chicken = session.scalar(select(Item).where(Item.name == "Chicken"))
                self.assertIsNotNone(chicken)
                self.assertIsNone(chicken.image_object_key)
                self.assertIsNone(chicken.image_content_type)

        self.run_async(scenario())

    def test_item_image_upload_requires_rustfs(self) -> None:
        async def scenario() -> None:
            with self.harness.session_factory() as session:
                chicken = session.scalar(select(Item).where(Item.name == "Chicken"))
                self.assertIsNotNone(chicken)
                with self.assertRaises(HTTPException) as ctx:
                    await item_storage.save_item_image_content(
                        AsyncSessionAdapter(session),
                        chicken,
                        filename="chicken.jpg",
                        content=b"image-bytes",
                        content_type="image/jpeg",
                    )
                self.assertEqual(ctx.exception.status_code, 503)
                self.assertIsNone(chicken.image_object_key)
                self.assertIsNone(chicken.image_content_type)

        self.run_async(scenario())

    def test_legacy_database_images_migrate_to_rustfs_and_clear_bytes(self) -> None:
        upload_calls = []

        async def fake_upload_bytes(**kwargs):
            upload_calls.append(kwargs)
            return f"items/{kwargs['item_id']}/migrated.jpg", kwargs["content_type"]

        async def scenario() -> None:
            original_values = (
                item_storage.settings.rustfs_endpoint_url,
                item_storage.settings.rustfs_access_key_id,
                item_storage.settings.rustfs_secret_access_key,
            )
            item_storage.settings.rustfs_endpoint_url = "http://rustfs.test"
            item_storage.settings.rustfs_access_key_id = "access"
            item_storage.settings.rustfs_secret_access_key = "secret"
            try:
                with self.harness.session_factory() as session:
                    session.execute(text("ALTER TABLE items ADD COLUMN image_data BLOB"))
                    chicken = session.scalar(select(Item).where(Item.name == "Chicken"))
                    duck = session.scalar(select(Item).where(Item.name == "Duck"))
                    chicken_raw_id = session.execute(
                        text("SELECT id FROM items WHERE name = :name"), {"name": chicken.name}
                    ).scalar_one()
                    duck_raw_id = session.execute(
                        text("SELECT id FROM items WHERE name = :name"), {"name": duck.name}
                    ).scalar_one()
                    session.execute(
                        text(
                            """
                            UPDATE items
                            SET image_data = :image_data,
                                image_content_type = :content_type
                            WHERE id = :item_id
                            """
                        ),
                        {
                            "image_data": b"legacy-chicken",
                            "content_type": "image/jpeg",
                            "item_id": chicken_raw_id,
                        },
                    )
                    session.execute(
                        text(
                            """
                            UPDATE items
                            SET image_data = :image_data,
                                image_object_key = :image_object_key,
                                image_content_type = :content_type
                            WHERE id = :item_id
                            """
                        ),
                        {
                            "image_data": b"legacy-duck",
                            "image_object_key": f"items/{duck_raw_id}/existing.jpg",
                            "content_type": "image/jpeg",
                            "item_id": duck_raw_id,
                        },
                    )
                    session.commit()

                    with patch.object(item_storage, "_upload_bytes", fake_upload_bytes):
                        migrated_count = await item_storage.migrate_item_image_data_to_rustfs(
                            AsyncSessionAdapter(session)
                        )
                    self.assertEqual(migrated_count, 2)
                    self.assertEqual(len(upload_calls), 1)

                    rows = (
                        session.execute(
                            text(
                                """
                                SELECT id, image_data, image_object_key, image_content_type
                                FROM items
                                WHERE id IN (:chicken_id, :duck_id)
                                """
                            ),
                            {"chicken_id": chicken_raw_id, "duck_id": duck_raw_id},
                        )
                        .mappings()
                        .all()
                    )
                    rows_by_id = {str(row["id"]): row for row in rows}
                    self.assertIsNone(rows_by_id[str(chicken_raw_id)]["image_data"])
                    self.assertEqual(
                        rows_by_id[str(chicken_raw_id)]["image_object_key"],
                        f"items/{chicken_raw_id}/migrated.jpg",
                    )
                    self.assertIsNone(rows_by_id[str(duck_raw_id)]["image_data"])
                    self.assertEqual(
                        rows_by_id[str(duck_raw_id)]["image_object_key"],
                        f"items/{duck_raw_id}/existing.jpg",
                    )
            finally:
                (
                    item_storage.settings.rustfs_endpoint_url,
                    item_storage.settings.rustfs_access_key_id,
                    item_storage.settings.rustfs_secret_access_key,
                ) = original_values

        self.run_async(scenario())

    def test_create_daily_prices_requires_all_active_items(self) -> None:
        _actor, shop = self.run_async(self.harness.create_shop_user())
        self.run_async(self.harness.create_items_for_shop(shop.id, ("Chicken", "Duck")))

        async def scenario() -> None:
            with self.harness.session_factory() as session:
                items = session.scalars(
                    select(Item)
                    .where(Item.is_active.is_(True), Item.shop_id == shop.id)
                    .order_by(Item.id)
                ).all()
                db = AsyncSessionAdapter(session)
                payload = DailyPriceCreate(
                    entries=[
                        DailyPriceEntry(
                            item_id=items[0].id, price_per_unit=Decimal("120.00")
                        )
                    ]
                )
                with self.assertRaises(HTTPException) as ctx:
                    await create_daily_prices(db, shop, payload)
                self.assertEqual(ctx.exception.status_code, 422)
                self.assertEqual(
                    ctx.exception.detail,
                    "Prices must be provided for every active item",
                )

        self.run_async(scenario())

    def test_item_schema_rejects_invalid_unit_pair(self) -> None:
        with self.assertRaises(ValueError):
            ItemCreate(
                name="Egg",
                tamil_name="முட்டை",
                unit_type=UnitType.COUNT,
                base_unit=BaseUnit.KG,
            )

    def test_global_bootstrap_requires_every_item_priced_today(self) -> None:
        _actor, shop = self.run_async(self.harness.create_shop_user())

        async def scenario() -> None:
            with self.harness.session_factory() as session:
                item = session.scalar(select(Item).where(Item.shop_id.is_(None), Item.is_active.is_(True)))
                session.add(
                    DailyPrice(
                        shop_id=shop.id,
                        item_id=item.id,
                        price_per_unit=Decimal("120.00"),
                        unit=item.base_unit,
                        price_date=date.today(),
                    )
                )
                session.commit()

                bootstrap = await get_global_bootstrap(AsyncSessionAdapter(session))
                self.assertFalse(bootstrap.prices_set)

        self.run_async(scenario())

    def test_create_global_daily_prices_requires_active_shops(self) -> None:
        self.run_async(self.harness.create_admin_user())

        async def scenario() -> None:
            with self.harness.session_factory() as session:
                items = session.scalars(
                    select(Item).where(Item.is_active.is_(True)).order_by(Item.id)
                ).all()
                db = AsyncSessionAdapter(session)
                payload = DailyPriceCreate(
                    entries=[
                        DailyPriceEntry(
                            item_id=item.id, price_per_unit=Decimal("150.00")
                        )
                        for item in items
                    ]
                )
                with self.assertRaises(HTTPException) as ctx:
                    await create_global_daily_prices(db, payload)
                self.assertEqual(ctx.exception.status_code, 422)
                self.assertEqual(
                    ctx.exception.detail, "No active shops to apply global prices to"
                )

        self.run_async(scenario())

    def test_create_global_daily_prices_rejects_duplicate_items(self) -> None:
        self.run_async(self.harness.create_shop_user())

        async def scenario() -> None:
            with self.harness.session_factory() as session:
                items = session.scalars(
                    select(Item).where(Item.is_active.is_(True)).order_by(Item.id)
                ).all()
                db = AsyncSessionAdapter(session)
                payload = DailyPriceCreate(
                    entries=[
                        DailyPriceEntry(
                            item_id=items[0].id, price_per_unit=Decimal("150.00")
                        ),
                        DailyPriceEntry(
                            item_id=items[0].id, price_per_unit=Decimal("175.00")
                        ),
                    ]
                )
                with self.assertRaises(HTTPException) as ctx:
                    await create_global_daily_prices(db, payload)
                self.assertEqual(ctx.exception.status_code, 422)
                self.assertEqual(
                    ctx.exception.detail,
                    f"Duplicate price entry for item {items[0].id}",
                )

        self.run_async(scenario())

    def test_create_bill_rejects_fractional_count_item_quantities(self) -> None:
        _actor, shop = self.run_async(self.harness.create_shop_user())
        self.run_async(
            self.harness.create_prices_for_shop(
                shop.id,
                date.today(),
                {
                    "Duck": "200.00",
                },
            )
        )

        async def scenario() -> None:
            with self.harness.session_factory() as session:
                duck = session.scalar(select(Item).where(Item.name == "Duck", Item.shop_id == shop.id))
                db = AsyncSessionAdapter(session)
                payload = BillCheckoutRequest(
                    items=[BillItemInput(item_id=duck.id, quantity=Decimal("1.5"))],
                    payment=CheckoutPaymentInput(
                        cash_amount=Decimal("300.00"), upi_amount=Decimal("0.00")
                    ),
                )
                with self.assertRaises(HTTPException) as ctx:
                    await preview_bill(db, shop, payload)
                self.assertEqual(ctx.exception.status_code, 422)
                self.assertEqual(
                    ctx.exception.detail, "Duck only accepts integer unit quantities"
                )

        self.run_async(scenario())

    def test_create_bill_rejects_underpayment(self) -> None:
        _actor, shop = self.run_async(self.harness.create_shop_user())
        self.run_async(
            self.harness.create_prices_for_shop(
                shop.id,
                date.today(),
                {
                    "Chicken": "100.00",
                },
            )
        )

        async def scenario() -> None:
            with self.harness.session_factory() as session:
                chicken = session.scalar(select(Item).where(Item.name == "Chicken", Item.shop_id == shop.id))
                db = AsyncSessionAdapter(session)
                payload = BillCheckoutRequest(
                    items=[BillItemInput(item_id=chicken.id, quantity=Decimal("2"))],
                    payment=CheckoutPaymentInput(
                        cash_amount=Decimal("150.00"), upi_amount=Decimal("0.00")
                    ),
                )
                with self.assertRaises(HTTPException) as ctx:
                    await preview_bill(db, shop, payload)
                self.assertEqual(ctx.exception.status_code, 422)
                self.assertEqual(
                    ctx.exception.detail, "Payment pending. Balance: 50.00"
                )

        self.run_async(scenario())

    def test_create_bill_persists_paid_bill(self) -> None:
        actor, shop = self.run_async(self.harness.create_shop_user())
        self.run_async(
            self.harness.create_prices_for_shop(
                shop.id,
                date.today(),
                {
                    "Chicken": "100.00",
                },
            )
        )

        async def scenario() -> None:
            with self.harness.session_factory() as session:
                chicken = session.scalar(select(Item).where(Item.name == "Chicken", Item.shop_id == shop.id))
                db = AsyncSessionAdapter(session)
                payload = BillCheckoutRequest(
                    items=[BillItemInput(item_id=chicken.id, quantity=Decimal("2"))],
                    payment=CheckoutPaymentInput(
                        cash_amount=Decimal("200.00"), upi_amount=Decimal("0.00")
                    ),
                )
                preview = await preview_bill(db, shop, payload)
                self.assertIsNone(session.scalar(select(Bill).limit(1)))

                created = await create_bill(
                    db,
                    shop,
                    BillCheckoutCommitRequest(
                        items=payload.items,
                        payment=payload.payment,
                        checkout_token=preview.checkout_token,
                    ),
                )
                self.assertEqual(created.status, "paid")
                self.assertEqual(created.total_amount, Decimal("200.00"))
                self.assertEqual(created.payment.total_paid, Decimal("200.00"))

                stored_shop = session.get(Shop, shop.id)
                stored_actor = session.get(User, actor.id)
                self.assertIsNotNone(stored_shop)
                self.assertIsNotNone(stored_actor)

        self.run_async(scenario())

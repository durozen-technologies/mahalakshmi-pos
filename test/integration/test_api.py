from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from test.support import AsyncSessionAdapter, BackendTestCase

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models import BaseUnit, DailyPrice, Item, Shop, UnitType, User
from app.routers.admin import (
    allocate_shop_catalogue_item,
    bills,
    create_admin_item_category,
    create_inventory_item,
    create_shop,
    delete_admin_item_category,
    delete_inventory_item,
    deallocate_shop_catalogue_item,
    delete_inventory_item_image,
    get_catalogue_items,
    get_catalogue_item_detail,
    get_item_categories,
    bill_detail,
    get_shop_item_detail,
    get_shop_items,
    get_shops,
    payment_summary,
    sales_summary,
    shop_daily_prices,
    shop_daily_prices_partial,
    shop_daily_price,
    shop_prices_bootstrap,
    update_shop_catalogue_item_allocation,
    update_shop_status,
    update_inventory_item,
)
from app.routers.auth import login, me, register
from app.routers.health import health_check
from app.routers.shop import bootstrap, checkout, preview_checkout, save_daily_prices, today_prices
from app.schemas.admin import (
    ItemScope,
    ItemCategoryCreate,
    PriceStatus,
    ShopCreate,
    ShopItemAllocationUpdate,
    ShopStatusUpdate,
)
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.billing import (
    BillCheckoutCommitRequest,
    BillCheckoutRequest,
    BillItemInput,
    CheckoutPaymentInput,
)
from app.schemas.pricing import DailyPriceCreate, DailyPriceEntry, DailyPriceUpdate


class BackendApiIntegrationTests(BackendTestCase):
    def test_health_endpoint(self) -> None:
        from fastapi import Request
        from unittest.mock import Mock

        mock_request = Mock(spec=Request)
        mock_request.app.state.database_ready = True
        mock_request.app.state.database_error = None
        import json

        response = health_check(mock_request)
        self.assertEqual(
            json.loads(response.body),
            {"status": "ok", "database": "connected", "error": None},
        )

    def test_auth_endpoints(self) -> None:
        async def scenario() -> None:
            with self.harness.session_factory() as session:
                db = AsyncSessionAdapter(session)
                registered = await register(
                    RegisterRequest(
                        username="admin",
                        password="password123",
                        confirm_password="password123",
                    ),
                    db,
                )
                self.assertEqual(registered.user.role.value, "admin")
                self.assertEqual(registered.user.next_screen, "admin_dashboard")
                self.assertTrue(registered.access_token)

                admin_user = session.scalar(
                    select(User).where(User.id == registered.user.id)
                )
                current_session = await me(current_user=admin_user, db=db)
                self.assertEqual(current_session.username, "admin")

                logged_in = await login(
                    LoginRequest(username="admin", password="password123"), db
                )
                self.assertEqual(logged_in.user.username, "admin")
                self.assertTrue(logged_in.access_token)

        self.run_async(scenario())

    def test_catalogue_item_allocation_controls_shop_visibility(self) -> None:
        _actor, shop = self.run_async(self.harness.create_shop_user())

        async def scenario() -> None:
            with self.harness.session_factory() as session:
                db = AsyncSessionAdapter(session)
                current_shop = session.scalar(select(Shop).where(Shop.id == shop.id))
                catalogue_chicken = session.scalar(
                    select(Item).where(Item.name == "Chicken", Item.shop_id.is_(None))
                )

                listed_items = (await get_shop_items(current_shop, db)).items
                chicken_row = next(item for item in listed_items if item.id == catalogue_chicken.id)
                self.assertFalse(chicken_row.allocated)
                self.assertFalse(chicken_row.available_for_billing)

                before_bootstrap = await shop_prices_bootstrap(current_shop, db)
                self.assertFalse(before_bootstrap.prices_set)
                self.assertNotIn(
                    catalogue_chicken.id,
                    {item.item_id for item in before_bootstrap.items},
                )

                allocated_item = await allocate_shop_catalogue_item(
                    catalogue_chicken.id, current_shop, db
                )
                self.assertTrue(allocated_item.allocated)
                self.assertFalse(allocated_item.can_delete)
                self.assertTrue(allocated_item.can_deallocate)
                customized_item = await update_shop_catalogue_item_allocation(
                    catalogue_chicken.id,
                    ShopItemAllocationUpdate(
                        display_name="Branch Chicken",
                        tamil_name="கிளை கோழி",
                        is_active=True,
                        custom_attributes={"counter": "front"},
                    ),
                    current_shop,
                    db,
                )
                self.assertEqual(customized_item.name, "Branch Chicken")
                self.assertEqual(customized_item.tamil_name, "கிளை கோழி")
                self.assertEqual(customized_item.custom_attributes["counter"], "front")
                listed_items = (await get_shop_items(current_shop, db)).items
                chicken_row = next(item for item in listed_items if item.id == catalogue_chicken.id)
                self.assertTrue(chicken_row.allocated)
                self.assertTrue(chicken_row.available_for_billing)

                await shop_daily_prices(
                    DailyPriceCreate(
                        entries=[
                            DailyPriceEntry(
                                item_id=catalogue_chicken.id,
                                price_per_unit=Decimal("120.00"),
                            )
                        ]
                    ),
                    current_shop,
                    db,
                )
                after_bootstrap = await shop_prices_bootstrap(current_shop, db)
                self.assertIn(
                    catalogue_chicken.id,
                    {item.item_id for item in after_bootstrap.items},
                )
                chicken_price_item = next(
                    item for item in after_bootstrap.items if item.item_id == catalogue_chicken.id
                )
                self.assertEqual(chicken_price_item.item_name, "Branch Chicken")
                self.assertEqual(chicken_price_item.item_tamil_name, "கிளை கோழி")
                self.assertTrue(after_bootstrap.prices_set)

                deallocated_item = await deallocate_shop_catalogue_item(
                    catalogue_chicken.id, current_shop, db
                )
                self.assertFalse(deallocated_item.allocated)
                self.assertFalse(deallocated_item.can_deallocate)
                listed_items = (await get_shop_items(current_shop, db)).items
                chicken_row = next(item for item in listed_items if item.id == catalogue_chicken.id)
                self.assertFalse(chicken_row.allocated)
                self.assertIsNone(chicken_row.current_price)
                final_bootstrap = await shop_prices_bootstrap(current_shop, db)
                self.assertNotIn(
                    catalogue_chicken.id,
                    {item.item_id for item in final_bootstrap.items},
                )

        self.run_async(scenario())

    def test_shop_items_support_pagination_search_and_custom_attributes(self) -> None:
        _actor, shop = self.run_async(self.harness.create_shop_user())

        async def scenario() -> None:
            with self.harness.session_factory() as session:
                db = AsyncSessionAdapter(session)
                current_shop = session.scalar(select(Shop).where(Shop.id == shop.id))

                created_item = await create_inventory_item(
                    name="Special Chicken",
                    unit_type=UnitType.WEIGHT,
                    base_unit=BaseUnit.KG,
                    tamil_name="சிறப்பு கோழி",
                    db=db,
                    is_active=True,
                    custom_attributes='{"grade":"A","cut":"curry"}',
                    image=None,
                )
                self.assertEqual(created_item.custom_attributes["grade"], "A")

                first_page = await get_shop_items(current_shop, db, limit=2)
                self.assertEqual(len(first_page.items), 2)
                self.assertTrue(first_page.has_more)
                self.assertIsNotNone(first_page.next_cursor_id)

                second_page = await get_shop_items(
                    current_shop,
                    db,
                    limit=2,
                    cursor_group=first_page.next_cursor_group,
                    cursor_name=first_page.next_cursor_name,
                    cursor_id=first_page.next_cursor_id,
                )
                self.assertNotEqual(
                    {item.id for item in first_page.items},
                    {item.id for item in second_page.items},
                )

                search_page = await get_shop_items(current_shop, db, q="Special", limit=10)
                self.assertEqual([item.id for item in search_page.items], [created_item.id])
                self.assertEqual(search_page.items[0].custom_attributes["cut"], "curry")

                sorted_alpha = await create_inventory_item(
                    name="Sorted Alpha",
                    unit_type=UnitType.WEIGHT,
                    base_unit=BaseUnit.KG,
                    tamil_name="வரிசை அ",
                    db=db,
                    is_active=True,
                    custom_attributes="{}",
                    sort_order=20,
                    image=None,
                )
                sorted_beta = await create_inventory_item(
                    name="Sorted Beta",
                    unit_type=UnitType.WEIGHT,
                    base_unit=BaseUnit.KG,
                    tamil_name="வரிசை ஆ",
                    db=db,
                    is_active=True,
                    custom_attributes="{}",
                    sort_order=10,
                    image=None,
                )
                sorted_first_page = await get_catalogue_items(db, q="Sorted", limit=1)
                self.assertEqual([item.id for item in sorted_first_page.items], [sorted_beta.id])
                self.assertEqual(sorted_first_page.next_cursor_sort_order, 10)
                sorted_second_page = await get_catalogue_items(
                    db,
                    q="Sorted",
                    limit=1,
                    cursor_sort_order=sorted_first_page.next_cursor_sort_order,
                    cursor_name=sorted_first_page.next_cursor_name,
                    cursor_id=sorted_first_page.next_cursor_id,
                )
                self.assertEqual([item.id for item in sorted_second_page.items], [sorted_alpha.id])

        self.run_async(scenario())

    def test_catalogue_listing_reports_usage_and_image_delete(self) -> None:
        _actor, shop = self.run_async(self.harness.create_shop_user())

        async def scenario() -> None:
            with self.harness.session_factory() as session:
                db = AsyncSessionAdapter(session)
                current_shop = session.scalar(select(Shop).where(Shop.id == shop.id))

                created_item = await create_inventory_item(
                    name="Catalogue Trial",
                    unit_type=UnitType.WEIGHT,
                    base_unit=BaseUnit.KG,
                    tamil_name="பட்டியல் சோதனை",
                    db=db,
                    is_active=True,
                    custom_attributes="{}",
                    image=None,
                )
                item_row = session.scalar(select(Item).where(Item.id == created_item.id))
                item_row.image_object_key = "items/catalogue-trial.jpg"
                item_row.image_content_type = "image/jpeg"
                session.commit()

                catalogue_page = await get_catalogue_items(db, q="Catalogue Trial", limit=10)
                self.assertEqual(catalogue_page.total_count, 1)
                self.assertEqual(catalogue_page.counts.catalogue, 1)
                self.assertEqual(catalogue_page.items[0].id, created_item.id)
                self.assertTrue(catalogue_page.items[0].can_delete)
                self.assertFalse(catalogue_page.items[0].allocated)

                await allocate_shop_catalogue_item(created_item.id, current_shop, db)
                allocated_page = await get_catalogue_items(db, q="Catalogue Trial", allocated=True, limit=10)
                self.assertEqual(allocated_page.total_count, 1)
                self.assertTrue(allocated_page.items[0].allocated)
                self.assertFalse(allocated_page.items[0].can_delete)
                self.assertFalse(allocated_page.items[0].can_deallocate)
                self.assertEqual(allocated_page.items[0].allocated_shop_count, 1)

                shop_page = await get_shop_items(current_shop, db, q="Catalogue Trial", limit=10)
                self.assertEqual(shop_page.total_count, 1)
                self.assertFalse(shop_page.items[0].can_delete)
                self.assertTrue(shop_page.items[0].can_deallocate)

                with self.assertRaises(HTTPException) as delete_context:
                    await delete_inventory_item(created_item.id, db)
                self.assertEqual(delete_context.exception.status_code, 409)
                self.assertEqual(
                    delete_context.exception.detail,
                    "Cannot delete a catalogue item that is allocated to shops",
                )

                image_result = await delete_inventory_item_image(created_item.id, db)
                self.assertIsNone(image_result.image_path)
                self.assertIsNone(image_result.image_content_type)
                session.expire_all()
                refreshed_item = session.scalar(select(Item).where(Item.id == created_item.id))
                self.assertIsNone(refreshed_item.image_object_key)
                self.assertIsNone(refreshed_item.image_content_type)

                item_row.image_object_key = "items/catalogue-trial-replaced.jpg"
                item_row.image_content_type = "image/jpeg"
                session.commit()
                updated_item = await update_inventory_item(
                    item_id=created_item.id,
                    name="Catalogue Trial",
                    unit_type=UnitType.WEIGHT,
                    base_unit=BaseUnit.KG,
                    tamil_name="பட்டியல் சோதனை",
                    db=db,
                    is_active=True,
                    custom_attributes="{}",
                    sort_order=0,
                    category=None,
                    remove_image=True,
                    image=None,
                )
                self.assertIsNone(updated_item.image_path)
                session.expire_all()
                image_removed_item = session.scalar(select(Item).where(Item.id == created_item.id))
                self.assertIsNone(image_removed_item.image_object_key)
                self.assertIsNone(image_removed_item.image_content_type)

        self.run_async(scenario())

    def test_item_categories_can_be_created_and_deleted_from_items(self) -> None:
        async def scenario() -> None:
            with self.harness.session_factory() as session:
                db = AsyncSessionAdapter(session)

                created_category = await create_admin_item_category(
                    ItemCategoryCreate(name="Fresh Cuts"), db
                )
                listed_categories = await get_item_categories(db)
                self.assertIn(created_category.id, {category.id for category in listed_categories})

                created_item = await create_inventory_item(
                    name="Category Trial",
                    unit_type=UnitType.WEIGHT,
                    base_unit=BaseUnit.KG,
                    tamil_name="வகை சோதனை",
                    db=db,
                    is_active=True,
                    custom_attributes="{}",
                    category_id=created_category.id,
                    image=None,
                )
                detail = await get_catalogue_item_detail(created_item.id, db)
                self.assertEqual(detail.category_id, created_category.id)
                self.assertEqual(detail.category, "Fresh Cuts")

                response = await delete_admin_item_category(created_category.id, db)
                self.assertEqual(response.status_code, 204)
                session.expire_all()
                cleared_item = session.scalar(select(Item).where(Item.id == created_item.id))
                self.assertIsNone(cleared_item.category_id)
                self.assertIsNone(cleared_item.category)

        self.run_async(scenario())

    def test_shop_item_price_status_distinguishes_stale_prices(self) -> None:
        _actor, shop = self.run_async(self.harness.create_shop_user())

        async def scenario() -> None:
            yesterday = date.today() - timedelta(days=1)
            await self.harness.create_prices_for_shop(
                shop.id,
                yesterday,
                {"Chicken": "99.00"},
            )

            with self.harness.session_factory() as session:
                db = AsyncSessionAdapter(session)
                current_shop = session.scalar(select(Shop).where(Shop.id == shop.id))
                chicken = session.scalar(select(Item).where(Item.name == "Chicken", Item.shop_id == shop.id))

                shop_items = await get_shop_items(current_shop, db, priced=False, limit=10)
                chicken_row = next(item for item in shop_items.items if item.id == chicken.id)
                self.assertEqual(chicken_row.price_status, PriceStatus.STALE)
                self.assertEqual(chicken_row.latest_price_date, yesterday)
                self.assertFalse(chicken_row.can_delete)

                stale_items = await get_shop_items(
                    current_shop, db, price_status=PriceStatus.STALE, limit=10
                )
                self.assertIn(chicken.id, {item.id for item in stale_items.items})
                missing_items = await get_shop_items(
                    current_shop, db, price_status=PriceStatus.MISSING, limit=10
                )
                self.assertNotIn(chicken.id, {item.id for item in missing_items.items})

                bootstrap_response = await shop_prices_bootstrap(current_shop, db)
                bootstrap_item = next(item for item in bootstrap_response.items if item.item_id == chicken.id)
                self.assertEqual(bootstrap_item.price_status, PriceStatus.STALE)
                self.assertFalse(bootstrap_response.prices_set)

        self.run_async(scenario())

    def test_partial_shop_price_save_and_zero_price_checkout_guard(self) -> None:
        _actor, shop = self.run_async(self.harness.create_shop_user())

        async def scenario() -> None:
            await self.harness.create_items_for_shop(shop.id, ("Chicken", "Duck"))
            with self.harness.session_factory() as session:
                db = AsyncSessionAdapter(session)
                current_shop = session.scalar(select(Shop).where(Shop.id == shop.id))
                items = session.scalars(
                    select(Item).where(Item.shop_id == shop.id).order_by(Item.name)
                ).all()
                chicken = next(item for item in items if item.name == "Chicken")
                duck = next(item for item in items if item.name == "Duck")

                partial_prices = await shop_daily_prices_partial(
                    DailyPriceCreate(
                        entries=[
                            DailyPriceEntry(
                                item_id=chicken.id,
                                price_per_unit=Decimal("111.00"),
                            )
                        ]
                    ),
                    current_shop,
                    db,
                )
                self.assertEqual(len(partial_prices), 1)
                self.assertEqual(
                    session.scalar(select(DailyPrice).where(DailyPrice.item_id == duck.id)),
                    None,
                )

                completed_prices = await shop_daily_prices(
                    DailyPriceCreate(
                        entries=[
                            DailyPriceEntry(
                                item_id=chicken.id,
                                price_per_unit=Decimal("111.00"),
                            ),
                            DailyPriceEntry(
                                item_id=duck.id,
                                price_per_unit=Decimal("0.00"),
                            ),
                        ]
                    ),
                    current_shop,
                    db,
                )
                self.assertEqual(len(completed_prices), 2)
                bootstrap_response = await shop_prices_bootstrap(current_shop, db)
                self.assertTrue(bootstrap_response.prices_set)

                with self.assertRaises(HTTPException) as context:
                    await preview_checkout(
                        BillCheckoutRequest(
                            items=[BillItemInput(item_id=duck.id, quantity=Decimal("1"))],
                            payment=CheckoutPaymentInput(
                                cash_amount=Decimal("0.00"),
                                upi_amount=Decimal("0.00"),
                            ),
                        ),
                        db,
                        current_shop,
                    )
                self.assertEqual(context.exception.status_code, 409)
                self.assertEqual(
                    context.exception.detail,
                    "Today's price for Duck must be greater than 0",
                )

        self.run_async(scenario())

    def test_item_detail_endpoints_and_row_price_save(self) -> None:
        _actor, shop = self.run_async(self.harness.create_shop_user())

        async def scenario() -> None:
            with self.harness.session_factory() as session:
                db = AsyncSessionAdapter(session)
                current_shop = session.scalar(select(Shop).where(Shop.id == shop.id))
                catalogue_chicken = session.scalar(
                    select(Item).where(Item.name == "Chicken", Item.shop_id.is_(None))
                )

                catalogue_detail = await get_catalogue_item_detail(catalogue_chicken.id, db)
                self.assertEqual(catalogue_detail.id, catalogue_chicken.id)
                self.assertEqual(catalogue_detail.scope, ItemScope.GLOBAL)
                self.assertEqual(catalogue_detail.allocated_shop_count, 0)

                await allocate_shop_catalogue_item(catalogue_chicken.id, current_shop, db)
                shop_detail = await get_shop_item_detail(catalogue_chicken.id, current_shop, db)
                self.assertTrue(shop_detail.allocated)
                self.assertEqual(shop_detail.price_status, PriceStatus.MISSING)

                saved_price = await shop_daily_price(
                    catalogue_chicken.id,
                    DailyPriceUpdate(price_per_unit=Decimal("125.50")),
                    current_shop,
                    db,
                )
                self.assertEqual(saved_price.item_id, catalogue_chicken.id)
                self.assertEqual(saved_price.price_per_unit, Decimal("125.50"))

                current_items = await get_shop_items(
                    current_shop, db, price_status=PriceStatus.CURRENT, limit=10
                )
                self.assertIn(catalogue_chicken.id, {item.id for item in current_items.items})
                refreshed_detail = await get_shop_item_detail(catalogue_chicken.id, current_shop, db)
                self.assertEqual(refreshed_detail.price_status, PriceStatus.CURRENT)
                self.assertEqual(refreshed_detail.current_price, Decimal("125.50"))

        self.run_async(scenario())

    def test_bulk_shop_prices_still_require_complete_setup(self) -> None:
        _actor, shop = self.run_async(self.harness.create_shop_user())

        async def scenario() -> None:
            await self.harness.create_items_for_shop(shop.id, ("Chicken", "Duck"))
            with self.harness.session_factory() as session:
                db = AsyncSessionAdapter(session)
                current_shop = session.scalar(select(Shop).where(Shop.id == shop.id))
                items = session.scalars(
                    select(Item).where(Item.shop_id == shop.id).order_by(Item.name)
                ).all()
                self.assertGreaterEqual(len(items), 2)

                with self.assertRaises(HTTPException) as context:
                    await shop_daily_prices(
                        DailyPriceCreate(
                            entries=[
                                DailyPriceEntry(
                                    item_id=items[0].id,
                                    price_per_unit=Decimal("100.00"),
                                )
                            ]
                        ),
                        current_shop,
                        db,
                    )
                self.assertEqual(context.exception.status_code, 422)
                self.assertEqual(context.exception.detail, "Prices must be provided for every active item")

        self.run_async(scenario())

    def test_bill_detail_uses_item_snapshots_after_item_rename(self) -> None:
        _actor, shop = self.run_async(self.harness.create_shop_user())

        async def scenario() -> None:
            await self.harness.create_items_for_shop(shop.id, ("Chicken",))
            with self.harness.session_factory() as session:
                db = AsyncSessionAdapter(session)
                current_shop = session.scalar(select(Shop).where(Shop.id == shop.id))
                chicken = session.scalar(select(Item).where(Item.name == "Chicken", Item.shop_id == shop.id))

                await shop_daily_prices(
                    DailyPriceCreate(
                        entries=[
                            DailyPriceEntry(
                                item_id=chicken.id,
                                price_per_unit=Decimal("120.00"),
                            )
                        ]
                    ),
                    current_shop,
                    db,
                )
                checkout_payload = BillCheckoutRequest(
                    items=[BillItemInput(item_id=chicken.id, quantity=Decimal("1"))],
                    payment=CheckoutPaymentInput(
                        cash_amount=Decimal("120.00"),
                        upi_amount=Decimal("0.00"),
                    ),
                )
                bill_preview = await preview_checkout(checkout_payload, db, current_shop)
                created_bill = await checkout(
                    BillCheckoutCommitRequest(
                        items=checkout_payload.items,
                        payment=checkout_payload.payment,
                        checkout_token=bill_preview.checkout_token,
                    ),
                    db,
                    current_shop,
                )

                chicken.name = "Renamed Chicken"
                chicken.tamil_name = "மாற்றிய பெயர்"
                session.commit()

                historical_bill = await bill_detail(created_bill.id, db)
                self.assertEqual(historical_bill.items[0].item_name, "Chicken")
                self.assertEqual(historical_bill.items[0].item_tamil_name, "தோலுடன்")
                self.assertEqual(historical_bill.items[0].item_unit_type, UnitType.WEIGHT)
                self.assertEqual(historical_bill.items[0].item_base_unit, BaseUnit.KG)

        self.run_async(scenario())

    def test_admin_and_shop_api_flow(self) -> None:
        async def scenario() -> None:
            with self.harness.session_factory() as session:
                db = AsyncSessionAdapter(session)

                registered_admin = await register(
                    RegisterRequest(
                        username="admin",
                        password="password123",
                        confirm_password="password123",
                    ),
                    db,
                )
                admin_user = session.scalar(
                    select(User).where(User.id == registered_admin.user.id)
                )

                created_shop = await create_shop(
                    ShopCreate(name="Main Shop", username="ml1", password="password"),
                    db,
                    admin_user,
                )
                self.assertEqual(created_shop.username, "ml1")
                shop_id = created_shop.id

                listed_shops = await get_shops(db)
                self.assertEqual(len(listed_shops), 1)

                await self.harness.create_items_for_shop(shop_id, ("Chicken", "Duck"))
                items = session.scalars(
                    select(Item)
                    .where(
                        Item.is_active.is_(True),
                        Item.shop_id == shop_id,
                    )
                    .order_by(Item.id)
                ).all()
                price_payload = DailyPriceCreate(
                    entries=[
                        DailyPriceEntry(
                            item_id=item.id,
                            price_per_unit=Decimal("100.00") + Decimal(index),
                        )
                        for index, item in enumerate(items)
                    ]
                )

                current_shop = session.scalar(select(Shop).where(Shop.id == shop_id))

                admin_shop_bootstrap = await shop_prices_bootstrap(current_shop, db)
                self.assertFalse(admin_shop_bootstrap.prices_set)

                admin_shop_prices = await shop_daily_prices(
                    price_payload, current_shop, db
                )
                self.assertEqual(len(admin_shop_prices), len(items))

                admin_shop_bootstrap = await shop_prices_bootstrap(current_shop, db)
                self.assertTrue(admin_shop_bootstrap.prices_set)

                shop_login = await login(
                    LoginRequest(username="ml1", password="password"), db
                )
                self.assertEqual(shop_login.user.next_screen, "billing")

                shop_user = await db.scalar(
                    select(User)
                    .options(selectinload(User.shop))
                    .where(User.id == shop_login.user.id)
                )
                shop_session = await me(current_user=shop_user, db=db)
                self.assertEqual(shop_session.shop_id, shop_id)

                shop_bootstrap_response = await bootstrap(current_shop, db)
                self.assertTrue(shop_bootstrap_response.prices_set)
                chicken_bootstrap_item = next(
                    item
                    for item in shop_bootstrap_response.items
                    if item.item_name == "Chicken"
                )
                self.assertIsNone(chicken_bootstrap_item.image_path)

                today_price_rows = await today_prices(current_shop, db)
                self.assertEqual(len(today_price_rows), len(items))

                saved_shop_prices = await save_daily_prices(
                    price_payload, db, current_shop
                )
                self.assertEqual(len(saved_shop_prices), len(items))

                refreshed_bootstrap = await bootstrap(current_shop, db)
                self.assertEqual(refreshed_bootstrap.next_screen, "billing")

                duck_item = next(
                    item
                    for item in refreshed_bootstrap.items
                    if item.item_name == "Duck"
                )
                chicken_item = next(
                    item
                    for item in refreshed_bootstrap.items
                    if item.item_name == "Chicken"
                )
                total_amount = (
                    duck_item.current_price + chicken_item.current_price * Decimal("2")
                )

                checkout_payload = BillCheckoutRequest(
                    items=[
                        BillItemInput(
                            item_id=duck_item.item_id, quantity=Decimal("1")
                        ),
                        BillItemInput(
                            item_id=chicken_item.item_id, quantity=Decimal("2")
                        ),
                    ],
                    payment=CheckoutPaymentInput(
                        cash_amount=total_amount,
                        upi_amount=Decimal("0.00"),
                    ),
                )
                bill_preview = await preview_checkout(
                    checkout_payload,
                    db,
                    current_shop,
                )
                created_bill = await checkout(
                    BillCheckoutCommitRequest(
                        items=checkout_payload.items,
                        payment=checkout_payload.payment,
                        checkout_token=bill_preview.checkout_token,
                    ),
                    db,
                    current_shop,
                )
                self.assertEqual(created_bill.status, "paid")
                self.assertTrue(created_bill.payment.is_settled)

                sales_rows = await sales_summary(
                    period="date", reference_date=None, shop_id=None, db=db
                )
                self.assertEqual(sales_rows[0].shop_name, current_shop.name)

                weekly_sales_rows = await sales_summary(
                    period="week", reference_date=None, shop_id=None, db=db
                )
                self.assertEqual(weekly_sales_rows[0].shop_name, current_shop.name)

                yearly_sales_rows = await sales_summary(
                    period="year", reference_date=None, shop_id=None, db=db
                )
                self.assertEqual(yearly_sales_rows[0].shop_name, current_shop.name)

                payment_rows = await payment_summary(
                    period="date", reference_date=None, shop_id=None, db=db
                )
                self.assertEqual(payment_rows[0].cash_total, total_amount)

                weekly_payment_rows = await payment_summary(
                    period="week", reference_date=None, shop_id=None, db=db
                )
                self.assertEqual(weekly_payment_rows[0].cash_total, total_amount)

                yearly_payment_rows = await payment_summary(
                    period="year", reference_date=None, shop_id=None, db=db
                )
                self.assertEqual(yearly_payment_rows[0].cash_total, total_amount)

                bill_rows = await bills(
                    period="date",
                    reference_date=None,
                    shop_id=None,
                    limit=50,
                    cursor_created_at=None,
                    cursor_id=None,
                    db=db,
                )
                self.assertEqual(len(bill_rows.items), 1)

                weekly_bill_rows = await bills(
                    period="week",
                    reference_date=None,
                    shop_id=None,
                    limit=50,
                    cursor_created_at=None,
                    cursor_id=None,
                    db=db,
                )
                self.assertEqual(len(weekly_bill_rows.items), 1)

                yearly_bill_rows = await bills(
                    period="year",
                    reference_date=None,
                    shop_id=None,
                    limit=50,
                    cursor_created_at=None,
                    cursor_id=None,
                    db=db,
                )
                self.assertEqual(len(yearly_bill_rows.items), 1)

                disabled_shop = await update_shop_status(
                    shop_id, ShopStatusUpdate(is_active=False), db
                )
                self.assertFalse(disabled_shop.is_active)

        self.run_async(scenario())

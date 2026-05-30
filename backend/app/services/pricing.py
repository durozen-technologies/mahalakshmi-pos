from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.storage import build_item_image_path
from app.models import DailyPrice, Item, Shop, ShopItemAllocation
from app.schemas.admin import PriceStatus
from app.schemas.pricing import (
    DailyPriceCreate,
    DailyPriceEntry,
    DailyPriceRead,
    DailyPriceUpdate,
    ItemPriceRead,
    ShopBootstrapResponse,
)


def _shop_visible_item_filter(shop_id: UUID):
    return or_(
        Item.shop_id == shop_id,
        and_(
            Item.shop_id.is_(None),
            select(ShopItemAllocation.id)
            .where(
                ShopItemAllocation.shop_id == shop_id,
                ShopItemAllocation.item_id == Item.id,
            )
            .exists(),
        ),
    )


def _shop_billing_item_filter(shop_id: UUID):
    return or_(
        Item.shop_id == shop_id,
        and_(
            Item.shop_id.is_(None),
            ShopItemAllocation.id.is_not(None),
            ShopItemAllocation.is_active.is_(True),
        ),
    )


def _price_status_for(price_date: date | None) -> PriceStatus:
    if price_date is None:
        return PriceStatus.MISSING
    return PriceStatus.CURRENT if price_date == date.today() else PriceStatus.STALE


def _validate_daily_price_entries(
    entries: list[DailyPriceEntry], active_item_ids: set[UUID]
) -> None:
    submitted_item_ids: set[UUID] = set()
    for entry in entries:
        if entry.item_id in submitted_item_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Duplicate price entry for item {entry.item_id}",
            )
        submitted_item_ids.add(entry.item_id)

    unknown_item_ids = submitted_item_ids - active_item_ids
    if unknown_item_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Prices can only be submitted for active items",
        )

    missing_item_ids = active_item_ids - submitted_item_ids
    if missing_item_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Prices must be provided for every active item",
        )


async def get_shop_bootstrap(db: AsyncSession, shop: Shop) -> ShopBootstrapResponse:
    """Return active allocated catalogue and shop items with current prices.

    Uses one query with a window-function subquery to fetch active items plus
    the latest price row per item for this shop. This avoids the previous
    two-query bootstrap path and also avoids concurrent use of one
    ``AsyncSession``.
    """
    today = date.today()
    latest_prices = (
        select(
            DailyPrice.item_id.label("item_id"),
            DailyPrice.price_per_unit.label("price_per_unit"),
            DailyPrice.price_date.label("price_date"),
            func.row_number()
            .over(
                partition_by=DailyPrice.item_id,
                order_by=(
                    DailyPrice.price_date.desc(),
                    DailyPrice.created_at.desc(),
                    DailyPrice.id.desc(),
                ),
            )
            .label("rn"),
        )
        .where(DailyPrice.shop_id == shop.id)
        .subquery()
    )
    rows = (
        await db.execute(
            select(
                Item.id,
                Item.name,
                Item.tamil_name,
                Item.unit_type,
                Item.base_unit,
                Item.sort_order,
                Item.category_id,
                Item.category,
                Item.image_object_key,
                Item.image_content_type,
                ShopItemAllocation.display_name,
                ShopItemAllocation.tamil_name.label("allocation_tamil_name"),
                ShopItemAllocation.sort_order.label("allocation_sort_order"),
                latest_prices.c.price_per_unit,
                latest_prices.c.price_date,
            )
            .outerjoin(
                ShopItemAllocation,
                and_(
                    ShopItemAllocation.item_id == Item.id,
                    ShopItemAllocation.shop_id == shop.id,
                ),
            )
            .outerjoin(
                latest_prices,
                and_(latest_prices.c.item_id == Item.id, latest_prices.c.rn == 1),
            )
            .where(Item.is_active.is_(True), _shop_billing_item_filter(shop.id))
            .order_by(
                func.coalesce(ShopItemAllocation.sort_order, Item.sort_order, 0),
                func.coalesce(ShopItemAllocation.display_name, Item.name),
            )
        )
    ).all()
    has_today_prices = bool(rows) and all(row.price_date == today for row in rows)

    return ShopBootstrapResponse(
        shop_id=shop.id,
        shop_name=shop.name,
        price_date=today,
        prices_set=has_today_prices,
        next_screen="billing" if has_today_prices else "daily_price_setup",
        items=[
            ItemPriceRead(
                item_id=row.id,
                item_name=(row.display_name or row.name).strip(),
                item_tamil_name=(row.allocation_tamil_name or row.tamil_name),
                unit_type=row.unit_type,
                base_unit=row.base_unit,
                current_price=row.price_per_unit,
                latest_price_date=row.price_date,
                price_status=_price_status_for(row.price_date),
                sort_order=row.allocation_sort_order
                if row.allocation_sort_order is not None
                else row.sort_order,
                category_id=row.category_id,
                category=row.category,
                image_path=build_item_image_path(
                    row.id, row.image_object_key, row.image_content_type
                ),
            )
            for row in rows
        ],
    )


async def get_today_prices(db: AsyncSession, shop: Shop) -> list[DailyPriceRead]:
    """Return today's prices for active items currently allocated to the shop."""
    rows = await db.execute(
        select(
            DailyPrice.id,
            DailyPrice.item_id,
            DailyPrice.price_per_unit,
            DailyPrice.unit,
            DailyPrice.price_date,
            DailyPrice.created_at,
        )
        .join(Item, Item.id == DailyPrice.item_id)
        .outerjoin(
            ShopItemAllocation,
            and_(
                ShopItemAllocation.item_id == Item.id,
                ShopItemAllocation.shop_id == shop.id,
            ),
        )
        .where(
            DailyPrice.shop_id == shop.id,
            DailyPrice.price_date == date.today(),
            Item.is_active.is_(True),
            _shop_billing_item_filter(shop.id),
        )
        .order_by(DailyPrice.item_id.asc())
    )
    return [DailyPriceRead(**row) for row in rows.mappings()]


async def create_daily_prices(
    db: AsyncSession,
    shop: Shop,
    payload: DailyPriceCreate,
) -> list[DailyPriceRead]:
    """Create or update daily prices for every active item allocated to the shop.

    - Uses a narrow item projection instead of loading full ``Item`` ORM rows.
    - Avoids concurrent use of one ``AsyncSession``.
    - Rejects duplicate and unknown item IDs before mutating ORM state.
    - ``db.flush()`` assigns PKs without expiring the session, so a
      per-object ``db.refresh()`` loop (N extra SELECTs) is not needed.
    """
    target_date = date.today()
    entries = payload.entries

    item_rows = (
        await db.execute(
            select(Item.id, Item.base_unit)
            .where(
                Item.is_active.is_(True),
                _shop_billing_item_filter(shop.id),
            )
            .outerjoin(
                ShopItemAllocation,
                and_(
                    ShopItemAllocation.item_id == Item.id,
                    ShopItemAllocation.shop_id == shop.id,
                ),
            )
        )
    ).all()
    items_by_id = {row.id: row.base_unit for row in item_rows}
    active_item_ids = set(items_by_id)
    _validate_daily_price_entries(entries, active_item_ids)

    existing_result = await db.scalars(
        select(DailyPrice).where(
            DailyPrice.shop_id == shop.id,
            DailyPrice.price_date == target_date,
        )
    )
    existing_prices_by_item_id = {price.item_id: price for price in existing_result.all()}

    saved_prices: list[DailyPrice] = []
    for entry in entries:
        item_id = entry.item_id
        daily_price = existing_prices_by_item_id.get(item_id)
        if daily_price is None:
            daily_price = DailyPrice(
                shop_id=shop.id,
                item_id=item_id,
                price_per_unit=entry.price_per_unit,
                unit=items_by_id[item_id],
                price_date=target_date,
            )
            db.add(daily_price)
        else:
            daily_price.price_per_unit = entry.price_per_unit
            daily_price.unit = items_by_id[item_id]
        saved_prices.append(daily_price)

    # flush assigns auto-generated PKs; commit persists without expiring objects.
    await db.flush()
    await db.commit()
    return [DailyPriceRead.model_validate(price) for price in saved_prices]


def _validate_partial_daily_price_entries(
    entries: list[DailyPriceEntry], active_item_ids: set[UUID]
) -> None:
    submitted_item_ids: set[UUID] = set()
    for entry in entries:
        if entry.item_id in submitted_item_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Duplicate price entry for item {entry.item_id}",
            )
        submitted_item_ids.add(entry.item_id)

    unknown_item_ids = submitted_item_ids - active_item_ids
    if unknown_item_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Prices can only be submitted for active items",
        )


async def create_partial_daily_prices(
    db: AsyncSession,
    shop: Shop,
    payload: DailyPriceCreate,
) -> list[DailyPriceRead]:
    target_date = date.today()
    entries = payload.entries
    if not entries:
        return []

    item_rows = (
        await db.execute(
            select(Item.id, Item.base_unit)
            .where(
                Item.is_active.is_(True),
                _shop_billing_item_filter(shop.id),
            )
            .outerjoin(
                ShopItemAllocation,
                and_(
                    ShopItemAllocation.item_id == Item.id,
                    ShopItemAllocation.shop_id == shop.id,
                ),
            )
        )
    ).all()
    items_by_id = {row.id: row.base_unit for row in item_rows}
    _validate_partial_daily_price_entries(entries, set(items_by_id))

    submitted_item_ids = [entry.item_id for entry in entries]
    existing_result = await db.scalars(
        select(DailyPrice).where(
            DailyPrice.shop_id == shop.id,
            DailyPrice.price_date == target_date,
            DailyPrice.item_id.in_(submitted_item_ids),
        )
    )
    existing_prices_by_item_id = {price.item_id: price for price in existing_result.all()}

    saved_prices: list[DailyPrice] = []
    for entry in entries:
        daily_price = existing_prices_by_item_id.get(entry.item_id)
        if daily_price is None:
            daily_price = DailyPrice(
                shop_id=shop.id,
                item_id=entry.item_id,
                price_per_unit=entry.price_per_unit,
                unit=items_by_id[entry.item_id],
                price_date=target_date,
            )
            db.add(daily_price)
        else:
            daily_price.price_per_unit = entry.price_per_unit
            daily_price.unit = items_by_id[entry.item_id]
        saved_prices.append(daily_price)

    await db.flush()
    await db.commit()
    return [DailyPriceRead.model_validate(price) for price in saved_prices]


async def upsert_shop_daily_price(
    db: AsyncSession,
    shop: Shop,
    item_id: UUID,
    payload: DailyPriceUpdate,
) -> DailyPriceRead:
    target_date = date.today()
    item_row = await db.execute(
        select(Item.id, Item.base_unit)
        .outerjoin(
            ShopItemAllocation,
            and_(
                ShopItemAllocation.item_id == Item.id,
                ShopItemAllocation.shop_id == shop.id,
            ),
        )
        .where(
            Item.id == item_id,
            Item.is_active.is_(True),
            _shop_billing_item_filter(shop.id),
        )
    )
    item = item_row.one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Price can only be saved for an active allocated item",
        )

    daily_price = await db.scalar(
        select(DailyPrice).where(
            DailyPrice.shop_id == shop.id,
            DailyPrice.item_id == item_id,
            DailyPrice.price_date == target_date,
        )
    )
    if daily_price is None:
        daily_price = DailyPrice(
            shop_id=shop.id,
            item_id=item_id,
            price_per_unit=payload.price_per_unit,
            unit=item.base_unit,
            price_date=target_date,
        )
        db.add(daily_price)
    else:
        daily_price.price_per_unit = payload.price_per_unit
        daily_price.unit = item.base_unit

    await db.flush()
    await db.commit()
    return DailyPriceRead.model_validate(daily_price)


async def get_global_bootstrap(db: AsyncSession) -> ShopBootstrapResponse:
    """Return active items with the latest global price snapshot in one query.

    Instead of loading all today's prices and then scanning the full
    ``daily_prices`` history in Python, this uses a window-function subquery
    to pick the most recent price row per item across active shops.
    """
    today = date.today()
    latest_prices = (
        select(
            DailyPrice.item_id.label("item_id"),
            DailyPrice.price_per_unit.label("price_per_unit"),
            DailyPrice.price_date.label("price_date"),
            func.row_number()
            .over(
                partition_by=DailyPrice.item_id,
                order_by=(
                    DailyPrice.price_date.desc(),
                    DailyPrice.created_at.desc(),
                    DailyPrice.id.desc(),
                ),
            )
            .label("rn"),
        )
        .join(Shop, Shop.id == DailyPrice.shop_id)
        .where(Shop.is_active.is_(True))
        .subquery()
    )

    rows = (
        await db.execute(
            select(
                Item.id,
                Item.name,
                Item.tamil_name,
                Item.unit_type,
                Item.base_unit,
                Item.sort_order,
                Item.category_id,
                Item.category,
                Item.image_object_key,
                Item.image_content_type,
                latest_prices.c.price_per_unit,
                latest_prices.c.price_date,
            )
            .outerjoin(
                latest_prices,
                and_(latest_prices.c.item_id == Item.id, latest_prices.c.rn == 1),
            )
            .where(Item.is_active.is_(True), Item.shop_id.is_(None))
            .order_by(Item.sort_order, Item.name)
        )
    ).all()
    has_today_prices = bool(rows) and all(row.price_date == today for row in rows)

    return ShopBootstrapResponse(
        shop_id=None,  # Global, not shop-specific
        shop_name="Global Prices",
        price_date=today,
        prices_set=has_today_prices,
        next_screen="billing" if has_today_prices else "daily_price_setup",
        items=[
            ItemPriceRead(
                item_id=row.id,
                item_name=row.name,
                item_tamil_name=row.tamil_name,
                unit_type=row.unit_type,
                base_unit=row.base_unit,
                current_price=row.price_per_unit,
                latest_price_date=row.price_date,
                price_status=_price_status_for(row.price_date),
                sort_order=row.sort_order,
                category_id=row.category_id,
                category=row.category,
                image_path=build_item_image_path(
                    row.id, row.image_object_key, row.image_content_type
                ),
            )
            for row in rows
        ],
    )


async def create_global_daily_prices(
    db: AsyncSession,
    payload: DailyPriceCreate,
) -> list[DailyPriceRead]:
    """Create daily prices for all active shops at once (global pricing)."""
    target_date = date.today()

    shops_result = await db.scalars(select(Shop).where(Shop.is_active.is_(True)))
    shops = shops_result.all()

    if not shops:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="No active shops to apply global prices to",
        )

    item_rows = (
        await db.execute(
            select(Item.id, Item.base_unit).where(
                Item.is_active.is_(True),
                Item.shop_id.is_(None),
            )
        )
    ).all()
    items_by_id = {row.id: row.base_unit for row in item_rows}
    active_item_ids = set(items_by_id)
    _validate_daily_price_entries(payload.entries, active_item_ids)

    shop_ids = [shop.id for shop in shops]
    existing_prices_result = await db.scalars(
        select(DailyPrice).where(
            DailyPrice.shop_id.in_(shop_ids),
            DailyPrice.price_date == target_date,
        )
    )
    existing_prices_by_key = {
        (price.shop_id, price.item_id): price for price in existing_prices_result.all()
    }

    saved_prices: list[DailyPrice] = []

    for shop in shops:
        for entry in payload.entries:
            daily_price = existing_prices_by_key.get((shop.id, entry.item_id))
            if daily_price is None:
                daily_price = DailyPrice(
                    shop_id=shop.id,
                    item_id=entry.item_id,
                    price_per_unit=entry.price_per_unit,
                    unit=items_by_id[entry.item_id],
                    price_date=target_date,
                )
                db.add(daily_price)
            else:
                daily_price.price_per_unit = entry.price_per_unit
                daily_price.unit = items_by_id[entry.item_id]

            saved_prices.append(daily_price)

    await db.flush()
    await db.commit()
    return [DailyPriceRead.model_validate(price) for price in saved_prices]

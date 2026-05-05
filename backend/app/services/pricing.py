from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DailyPrice, Item, Shop, User
from app.schemas.pricing import DailyPriceCreate, DailyPriceRead, ItemPriceRead, ShopBootstrapResponse
from app.services.audit import log_action


async def get_shop_bootstrap(db: AsyncSession, shop: Shop) -> ShopBootstrapResponse:
    today = date.today()
    items_result = await db.scalars(select(Item).where(Item.is_active.is_(True)).order_by(Item.name))
    items = items_result.all()
    today_prices_result = await db.scalars(
        select(DailyPrice).where(
            DailyPrice.shop_id == shop.id,
            DailyPrice.price_date == today,
        )
    )
    today_prices = today_prices_result.all()
    price_map = {price.item_id: price for price in today_prices}

    return ShopBootstrapResponse(
        shop_id=shop.id,
        shop_name=shop.name,
        price_date=today,
        prices_set=bool(today_prices),
        next_screen="billing" if today_prices else "daily_price_setup",
        items=[
            ItemPriceRead(
                item_id=item.id,
                item_name=item.name,
                unit_type=item.unit_type,
                base_unit=item.base_unit,
                current_price=price_map.get(item.id).price_per_unit if item.id in price_map else None,
            )
            for item in items
        ],
    )


async def get_today_prices(db: AsyncSession, shop: Shop) -> list[DailyPriceRead]:
    today_prices_result = await db.scalars(
        select(DailyPrice).where(
            DailyPrice.shop_id == shop.id,
            DailyPrice.price_date == date.today(),
        )
    )
    today_prices = today_prices_result.all()
    return [DailyPriceRead.model_validate(price) for price in today_prices]


async def create_daily_prices(
    db: AsyncSession,
    shop: Shop,
    payload: DailyPriceCreate,
    actor: User,
) -> list[DailyPriceRead]:
    today = date.today()
    existing_prices_result = await db.scalars(
        select(DailyPrice).where(DailyPrice.shop_id == shop.id, DailyPrice.price_date == today)
    )
    existing_prices = existing_prices_result.all()
    existing_prices_by_item_id = {price.item_id: price for price in existing_prices}

    items_result = await db.scalars(select(Item).where(Item.is_active.is_(True)))
    items = items_result.all()
    items_by_id = {item.id: item for item in items}
    submitted_item_ids = {entry.item_id for entry in payload.entries}
    missing_item_ids = {item.id for item in items} - submitted_item_ids
    if missing_item_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Prices must be provided for every active item",
        )

    saved_prices: list[DailyPrice] = []
    for entry in payload.entries:
        item = items_by_id.get(entry.item_id)
        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item {entry.item_id} not found",
            )

        daily_price = existing_prices_by_item_id.get(item.id)
        if daily_price is None:
            daily_price = DailyPrice(
                shop_id=shop.id,
                item_id=item.id,
                price_per_unit=entry.price_per_unit,
                unit=item.base_unit,
                price_date=today,
            )
            db.add(daily_price)
        else:
            daily_price.price_per_unit = entry.price_per_unit
            daily_price.unit = item.base_unit

        saved_prices.append(daily_price)

    log_action(
        db,
        actor.id,
        "daily_price_setup",
        f"Saved {len(saved_prices)} daily prices for shop {shop.code} on {today.isoformat()}",
    )
    await db.commit()
    for price in saved_prices:
        await db.refresh(price)
    return [DailyPriceRead.model_validate(price) for price in saved_prices]

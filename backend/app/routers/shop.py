from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_shop, require_roles
from app.db.database import get_db
from app.models import Shop, UserRole
from app.schemas.billing import (
    BillCheckoutCommitRequest,
    BillCheckoutPreviewRead,
    BillCheckoutRequest,
    BillRead,
)
from app.schemas.pricing import DailyPriceCreate, DailyPriceRead, ShopBootstrapResponse
from app.services.billing import create_bill, preview_bill
from app.services.pricing import create_daily_prices, get_shop_bootstrap, get_today_prices

router = APIRouter(tags=["Shop"], dependencies=[Depends(require_roles(UserRole.SHOP_ACCOUNT))])


@router.get(
    "/bootstrap",
    response_model=ShopBootstrapResponse,
    response_model_exclude_unset=True,
    summary="Get Shop Bootstrap",
)
async def bootstrap(
    shop: Shop = Depends(get_current_shop),
    db: AsyncSession = Depends(get_db),
) -> ShopBootstrapResponse:
    """Return the pricing bootstrap payload for the signed-in shop."""
    return await get_shop_bootstrap(db, shop)


@router.get(
    "/daily-prices/today",
    response_model=list[DailyPriceRead],
    response_model_exclude_unset=True,
    summary="Get Today's Prices",
)
async def today_prices(
    shop: Shop = Depends(get_current_shop),
    db: AsyncSession = Depends(get_db),
) -> list[DailyPriceRead]:
    """Return today's saved price rows for the signed-in shop."""
    return await get_today_prices(db, shop)


@router.post(
    "/daily-prices",
    response_model=list[DailyPriceRead],
    status_code=201,
    response_model_exclude_unset=True,
    summary="Save Daily Prices",
)
async def save_daily_prices(
    payload: DailyPriceCreate,
    db: AsyncSession = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
) -> list[DailyPriceRead]:
    """Create or update today's price book for the signed-in shop."""
    return await create_daily_prices(db, shop, payload)


@router.post(
    "/bills/preview",
    response_model=BillCheckoutPreviewRead,
    status_code=200,
    response_model_exclude_unset=True,
    summary="Preview Bill",
)
async def preview_checkout(
    payload: BillCheckoutRequest,
    db: AsyncSession = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
) -> BillCheckoutPreviewRead:
    """Validate and build a printable bill without saving billing data."""
    return await preview_bill(db, shop, payload)


@router.post(
    "/bills",
    response_model=BillRead,
    status_code=201,
    response_model_exclude_unset=True,
    summary="Checkout Bill",
)
async def checkout(
    payload: BillCheckoutCommitRequest,
    db: AsyncSession = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
) -> BillRead:
    """Save a paid bill after the signed-in shop has printed its receipt."""
    return await create_bill(db, shop, payload)

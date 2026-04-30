from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_active_user, get_current_shop, require_roles
from app.core.database import get_db
from app.models import Shop, User, UserRole
from app.schemas.billing import BillCheckoutRequest, BillRead
from app.schemas.pricing import DailyPriceCreate, DailyPriceRead, ShopBootstrapResponse
from app.services.billing import create_bill
from app.services.pricing import create_daily_prices, get_shop_bootstrap, get_today_prices

router = APIRouter(dependencies=[Depends(require_roles(UserRole.SHOP_ACCOUNT))])


@router.get("/bootstrap", response_model=ShopBootstrapResponse)
async def bootstrap(
    shop: Shop = Depends(get_current_shop),
    db: AsyncSession = Depends(get_db),
) -> ShopBootstrapResponse:
    return await get_shop_bootstrap(db, shop)


@router.get("/daily-prices/today", response_model=list[DailyPriceRead])
async def today_prices(
    shop: Shop = Depends(get_current_shop),
    db: AsyncSession = Depends(get_db),
) -> list[DailyPriceRead]:
    return await get_today_prices(db, shop)


@router.post("/daily-prices", response_model=list[DailyPriceRead], status_code=201)
async def save_daily_prices(
    payload: DailyPriceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    shop: Shop = Depends(get_current_shop),
) -> list[DailyPriceRead]:
    return await create_daily_prices(db, shop, payload, current_user)


@router.post("/bills", response_model=BillRead, status_code=201)
async def checkout(
    payload: BillCheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    shop: Shop = Depends(get_current_shop),
) -> BillRead:
    return await create_bill(db, shop, payload, current_user)

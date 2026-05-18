from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_roles
from app.core.database import get_db
from app.models import Shop, User, UserRole
from app.schemas.admin import (
    AdminBillPage,
    AnalyticsPeriod,
    ItemSalesSummary,
    PaymentSplitSummary,
    ShopCreate,
    ShopRead,
    ShopSalesSummary,
    ShopStatusUpdate,
    ShopUpdate,
    AdminDashboardBootstrap,
)
from app.schemas.billing import BillRead
from app.schemas.pricing import DailyPriceCreate, DailyPriceRead, ShopBootstrapResponse
from app.services.admin import (
    create_shop_account,
    delete_shop_account,
    get_daily_bills,
    get_dashboard_bootstrap,
    get_bill_by_id,
    get_item_sales_summary,
    get_payment_split_summary,
    get_shop_by_id,
    get_shop_sales_summary,
    list_shops,
    set_shop_active_state,
    update_shop_account,
)
from app.services.pricing import create_daily_prices, create_global_daily_prices, get_shop_bootstrap, get_global_bootstrap

router = APIRouter(dependencies=[Depends(require_roles(UserRole.ADMIN))])


@router.post("/shops", response_model=ShopRead, status_code=201)
async def create_shop(
    payload: ShopCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> ShopRead:
    return await create_shop_account(db, payload, current_user)


@router.get("/shops", response_model=list[ShopRead])
async def get_shops(db: AsyncSession = Depends(get_db)) -> list[ShopRead]:
    return await list_shops(db)


@router.get("/shops/{shop_id}", response_model=ShopRead)
async def get_shop(shop_id: int, db: AsyncSession = Depends(get_db)) -> ShopRead:
    return await get_shop_by_id(db, shop_id)


@router.patch("/shops/{shop_id}", response_model=ShopRead)
async def update_shop(
    shop_id: int,
    payload: ShopUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> ShopRead:
    return await update_shop_account(db, shop_id, payload, current_user)


@router.patch("/shops/{shop_id}/status", response_model=ShopRead)
async def update_shop_status(
    shop_id: int,
    payload: ShopStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> ShopRead:
    return await set_shop_active_state(db, shop_id, payload.is_active, current_user)


@router.delete("/shops/{shop_id}", status_code=204)
async def delete_shop(
    shop_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> Response:
    await delete_shop_account(db, shop_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/sales-summary", response_model=list[ShopSalesSummary])
async def sales_summary(
    period: AnalyticsPeriod = Query("date"),
    reference_date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[ShopSalesSummary]:
    return await get_shop_sales_summary(db, period, reference_date)


@router.get("/payment-summary", response_model=list[PaymentSplitSummary])
async def payment_summary(
    period: AnalyticsPeriod = Query("date"),
    reference_date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[PaymentSplitSummary]:
    return await get_payment_split_summary(db, period, reference_date)


@router.get("/bills", response_model=AdminBillPage)
async def bills(
    period: AnalyticsPeriod = Query("date"),
    reference_date: date | None = Query(default=None),
    shop_id: int | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    cursor_created_at: datetime | None = Query(default=None),
    cursor_id: int | None = Query(default=None, ge=1),
    db: AsyncSession = Depends(get_db),
) -> AdminBillPage:
    return await get_daily_bills(db, period, reference_date, shop_id, limit, cursor_created_at, cursor_id)


@router.get("/bills/{bill_id}", response_model=BillRead)
async def bill_detail(
    bill_id: int,
    db: AsyncSession = Depends(get_db),
) -> BillRead:
    return await get_bill_by_id(db, bill_id)


@router.get("/item-sales", response_model=list[ItemSalesSummary])
async def item_sales(
    period: AnalyticsPeriod = Query("date"),
    reference_date: date | None = Query(default=None),
    shop_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[ItemSalesSummary]:
    return await get_item_sales_summary(db, period, reference_date, shop_id)



@router.get("/shops/{shop_id}/prices/bootstrap", response_model=ShopBootstrapResponse)
async def shop_prices_bootstrap(
    shop_id: int,
    db: AsyncSession = Depends(get_db),
) -> ShopBootstrapResponse:
    shop = await db.get(Shop, shop_id)
    if shop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")
    return await get_shop_bootstrap(db, shop)


@router.post("/shops/{shop_id}/daily-prices", response_model=list[DailyPriceRead], status_code=201)
async def shop_daily_prices(
    shop_id: int,
    payload: DailyPriceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[DailyPriceRead]:
    shop = await db.get(Shop, shop_id)
    if shop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")
    return await create_daily_prices(db, shop, payload, current_user)


@router.get("/prices/bootstrap", response_model=ShopBootstrapResponse)
async def global_prices_bootstrap(
    db: AsyncSession = Depends(get_db),
) -> ShopBootstrapResponse:
    """Get global items with current prices (not shop-specific)."""
    return await get_global_bootstrap(db)


@router.post("/daily-prices", response_model=list[DailyPriceRead], status_code=201)
async def global_daily_prices(
    payload: DailyPriceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[DailyPriceRead]:
    """Set daily prices globally for all active shops."""
    return await create_global_daily_prices(db, payload, current_user)


@router.get("/dashboard/bootstrap", response_model=AdminDashboardBootstrap)
async def dashboard_bootstrap(
    period: AnalyticsPeriod = Query("date"),
    reference_date: date | None = Query(default=None),
    shop_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> AdminDashboardBootstrap:
    return await get_dashboard_bootstrap(db, period, reference_date, shop_id, bills_limit=50)

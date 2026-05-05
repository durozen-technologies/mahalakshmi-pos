from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_roles
from app.core.database import get_db
from app.models import Shop, User, UserRole
from app.schemas.admin import (
    AdminBillSummary,
    AuditLogRead,
    PaymentSplitSummary,
    ShopCreate,
    ShopRead,
    ShopSalesSummary,
    ShopStatusUpdate,
)
from app.schemas.pricing import DailyPriceCreate, DailyPriceRead, ShopBootstrapResponse
from app.services.admin import (
    create_shop_account,
    get_audit_logs,
    get_daily_bills,
    get_payment_split_summary,
    get_shop_sales_summary,
    list_shops,
    set_shop_active_state,
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


@router.patch("/shops/{shop_id}/status", response_model=ShopRead)
async def update_shop_status(
    shop_id: int,
    payload: ShopStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> ShopRead:
    return await set_shop_active_state(db, shop_id, payload.is_active, current_user)


@router.get("/sales-summary", response_model=list[ShopSalesSummary])
async def sales_summary(db: AsyncSession = Depends(get_db)) -> list[ShopSalesSummary]:
    return await get_shop_sales_summary(db)


@router.get("/payment-summary", response_model=list[PaymentSplitSummary])
async def payment_summary(db: AsyncSession = Depends(get_db)) -> list[PaymentSplitSummary]:
    return await get_payment_split_summary(db)


@router.get("/bills", response_model=list[AdminBillSummary])
async def bills(db: AsyncSession = Depends(get_db)) -> list[AdminBillSummary]:
    return await get_daily_bills(db)


@router.get("/audit-logs", response_model=list[AuditLogRead])
async def audit_logs(db: AsyncSession = Depends(get_db)) -> list[AuditLogRead]:
    return [AuditLogRead.model_validate(log) for log in await get_audit_logs(db)]


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

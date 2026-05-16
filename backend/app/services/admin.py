import re
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import and_, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_password_hash
from app.models import AuditLog, Bill, BillItem, Item, Payment, Shop, User, UserRole
from app.schemas.admin import (
    AdminBillSummary,
    AnalyticsPeriod,
    ItemSalesSummary,
    PaymentSplitSummary,
    ShopCreate,
    ShopRead,
    ShopSalesSummary,
)
from app.services.audit import log_action

SHOP_CODE_PATTERN = re.compile(r"^ML(\d+)$", re.IGNORECASE)


def _get_period_bounds(period: AnalyticsPeriod, reference_date: date | None = None) -> tuple[datetime, datetime]:
    base_date = reference_date or datetime.now(UTC).date()
    now = datetime(base_date.year, base_date.month, base_date.day, tzinfo=UTC)

    if period == "date":
        start = datetime(now.year, now.month, now.day, tzinfo=UTC)
        end = start + timedelta(days=1)
        return start, end

    if period == "month":
        start = datetime(now.year, now.month, 1, tzinfo=UTC)
        end = datetime(
            now.year + (1 if now.month == 12 else 0),
            1 if now.month == 12 else now.month + 1,
            1,
            tzinfo=UTC,
        )
        return start, end

    start = datetime(now.year, 1, 1, tzinfo=UTC)
    end = datetime(now.year + 1, 1, 1, tzinfo=UTC)
    return start, end


async def _next_shop_number(db: AsyncSession) -> int:
    result = await db.scalars(select(Shop.code))
    shop_codes = result.all()
    max_number = 0
    for code in shop_codes:
        match = SHOP_CODE_PATTERN.match(code)
        if match:
            max_number = max(max_number, int(match.group(1)))
    return max_number + 1


async def create_shop_account(db: AsyncSession, payload: ShopCreate, actor: User) -> ShopRead:
    shop_number = await _next_shop_number(db)
    username = payload.username.strip()
    shop_name = payload.name.strip()
    code = payload.code.strip().upper() if payload.code and payload.code.strip() else f"ML{shop_number}"

    if len(shop_name) < 2:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Shop name is required")
    if len(username) < 3:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Username is required")

    existing_user = await db.scalar(select(User.id).where(User.username == username))
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    existing_code = await db.scalar(select(Shop).where(Shop.code == code))
    if existing_code is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Shop code already exists")

    user = User(
        username=username,
        password_hash=get_password_hash(payload.password),
        role=UserRole.SHOP_ACCOUNT,
        is_active=True,
    )
    shop = Shop(name=shop_name, code=code, owner=user, is_active=True)
    db.add_all([user, shop])
    await db.flush()
    log_action(
        db,
        actor.id,
        "create_shop",
        f"Created shop {shop.name} ({shop.code}) with login {username}",
    )
    await db.commit()
    await db.refresh(shop)
    return ShopRead(
        id=shop.id,
        name=shop.name,
        code=shop.code,
        is_active=shop.is_active,
        created_at=shop.created_at,
        username=user.username,
    )


async def list_shops(db: AsyncSession) -> list[ShopRead]:
    result = await db.scalars(select(Shop).options(selectinload(Shop.owner)).order_by(Shop.created_at.desc()))
    shops = result.all()
    return [
        ShopRead(
            id=shop.id,
            name=shop.name,
            code=shop.code,
            is_active=shop.is_active,
            created_at=shop.created_at,
            username=shop.owner.username,
        )
        for shop in shops
    ]


async def set_shop_active_state(db: AsyncSession, shop_id: int, is_active: bool, actor: User) -> ShopRead:
    shop = await db.get(Shop, shop_id, options=(selectinload(Shop.owner),))
    if shop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")
    shop.is_active = is_active
    shop.owner.is_active = is_active
    log_action(
        db,
        actor.id,
        "update_shop_status",
        f"Set shop {shop.code} active={is_active}",
    )
    await db.commit()
    await db.refresh(shop)
    return ShopRead(
        id=shop.id,
        name=shop.name,
        code=shop.code,
        is_active=shop.is_active,
        created_at=shop.created_at,
        username=shop.owner.username,
    )


async def get_shop_sales_summary(
    db: AsyncSession,
    period: AnalyticsPeriod = "date",
    reference_date: date | None = None,
) -> list[ShopSalesSummary]:
    start, end = _get_period_bounds(period, reference_date)
    rows = (
        await db.execute(
        select(
            Shop.id,
            Shop.name,
            Shop.code,
            func.coalesce(func.sum(Bill.total_amount), 0).label("total_sales"),
        )
        .outerjoin(
            Bill,
            and_(
                Bill.shop_id == Shop.id,
                Bill.created_at >= start,
                Bill.created_at < end,
            ),
        )
        .group_by(Shop.id)
        .order_by(Shop.name)
        )
    ).all()
    return [
        ShopSalesSummary(
            shop_id=row.id,
            shop_name=row.name,
            shop_code=row.code,
            total_sales=Decimal(row.total_sales),
        )
        for row in rows
    ]


async def get_payment_split_summary(
    db: AsyncSession,
    period: AnalyticsPeriod = "date",
    reference_date: date | None = None,
) -> list[PaymentSplitSummary]:
    start, end = _get_period_bounds(period, reference_date)
    rows = (
        await db.execute(
        select(
            Shop.id,
            Shop.name,
            func.coalesce(func.sum(Payment.cash_amount), 0).label("cash_total"),
            func.coalesce(func.sum(Payment.upi_amount), 0).label("upi_total"),
        )
        .outerjoin(
            Bill,
            and_(
                Bill.shop_id == Shop.id,
                Bill.created_at >= start,
                Bill.created_at < end,
            ),
        )
        .outerjoin(Payment, Payment.bill_id == Bill.id)
        .group_by(Shop.id)
        .order_by(Shop.name)
        )
    ).all()
    return [
        PaymentSplitSummary(
            shop_id=row.id,
            shop_name=row.name,
            cash_total=Decimal(row.cash_total),
            upi_total=Decimal(row.upi_total),
        )
        for row in rows
    ]


async def get_daily_bills(
    db: AsyncSession,
    period: AnalyticsPeriod = "date",
    reference_date: date | None = None,
) -> list[AdminBillSummary]:
    start, end = _get_period_bounds(period, reference_date)
    rows = (
        await db.execute(
        select(Bill, Shop.name)
        .join(Shop, Shop.id == Bill.shop_id)
        .where(
            Bill.created_at >= start,
            Bill.created_at < end,
        )
        .order_by(Bill.created_at.desc())
        )
    ).all()
    return [
        AdminBillSummary(
            bill_id=bill.id,
            bill_no=bill.bill_no,
            shop_id=bill.shop_id,
            shop_name=shop_name,
            total_amount=bill.total_amount,
            status=bill.status.value,
            created_at=bill.created_at,
        )
        for bill, shop_name in rows
    ]


async def get_item_sales_summary(
    db: AsyncSession,
    period: AnalyticsPeriod = "date",
    reference_date: date | None = None,
    shop_id: int | None = None,
) -> list[ItemSalesSummary]:
    start, end = _get_period_bounds(period, reference_date)

    query = (
        select(
            Item.id,
            Item.name,
            Item.base_unit,
            func.coalesce(func.sum(BillItem.quantity), 0).label("quantity_sold"),
            func.coalesce(func.sum(BillItem.line_total), 0).label("total_amount"),
            func.count(distinct(Bill.id)).label("bill_count"),
        )
        .join(BillItem, BillItem.item_id == Item.id)
        .join(Bill, Bill.id == BillItem.bill_id)
        .where(
            Bill.created_at >= start,
            Bill.created_at < end,
        )
        .group_by(Item.id, Item.name, Item.base_unit)
        .order_by(func.sum(BillItem.line_total).desc(), Item.name)
    )

    if shop_id is not None:
        query = query.where(Bill.shop_id == shop_id)

    rows = (await db.execute(query)).all()
    return [
        ItemSalesSummary(
            item_id=row.id,
            item_name=row.name,
            base_unit=row.base_unit,
            quantity_sold=Decimal(row.quantity_sold),
            total_amount=Decimal(row.total_amount),
            bill_count=int(row.bill_count),
        )
        for row in rows
    ]


async def get_audit_logs(db: AsyncSession, limit: int = 200) -> list[AuditLog]:
    result = await db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))
    return result.all()

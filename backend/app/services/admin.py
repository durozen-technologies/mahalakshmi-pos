import re
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.models import AuditLog, Bill, Payment, Shop, User, UserRole
from app.schemas.admin import (
    AdminBillSummary,
    PaymentSplitSummary,
    ShopCreate,
    ShopRead,
    ShopSalesSummary,
)
from app.services.audit import log_action

settings = get_settings()
SHOP_USERNAME_PATTERN = re.compile(r"^ml(\d+)$", re.IGNORECASE)


async def _next_shop_number(db: AsyncSession) -> int:
    result = await db.scalars(select(User.username).where(User.role == UserRole.SHOP_ACCOUNT))
    shop_usernames = result.all()
    max_number = 0
    for username in shop_usernames:
        match = SHOP_USERNAME_PATTERN.match(username)
        if match:
            max_number = max(max_number, int(match.group(1)))
    return max_number + 1


async def create_shop_account(db: AsyncSession, payload: ShopCreate, actor: User) -> ShopRead:
    shop_number = await _next_shop_number(db)
    username = f"ml{shop_number}"
    code = payload.code or f"ML{shop_number}"

    existing_code = await db.scalar(select(Shop).where(Shop.code == code))
    if existing_code is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Shop code already exists")

    user = User(
        username=username,
        password_hash=get_password_hash(settings.shop_default_password),
        role=UserRole.SHOP_ACCOUNT,
        is_active=True,
    )
    shop = Shop(name=payload.name, code=code, owner=user, is_active=True)
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


async def get_shop_sales_summary(db: AsyncSession) -> list[ShopSalesSummary]:
    rows = (
        await db.execute(
        select(
            Shop.id,
            Shop.name,
            Shop.code,
            func.coalesce(func.sum(Bill.total_amount), 0).label("total_sales"),
        )
        .outerjoin(Bill, Bill.shop_id == Shop.id)
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


async def get_payment_split_summary(db: AsyncSession) -> list[PaymentSplitSummary]:
    rows = (
        await db.execute(
        select(
            Shop.id,
            Shop.name,
            func.coalesce(func.sum(Payment.cash_amount), 0).label("cash_total"),
            func.coalesce(func.sum(Payment.upi_amount), 0).label("upi_total"),
        )
        .outerjoin(Bill, Bill.shop_id == Shop.id)
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


async def get_daily_bills(db: AsyncSession) -> list[AdminBillSummary]:
    rows = (
        await db.execute(
        select(Bill, Shop.name)
        .join(Shop, Shop.id == Bill.shop_id)
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


async def get_audit_logs(db: AsyncSession, limit: int = 200) -> list[AuditLog]:
    result = await db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))
    return result.all()

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import and_, distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.security import get_password_hash
from app.models import Bill, BillItem, DailyPrice, Item, Payment, Shop, User, UserRole
from app.schemas.admin import (
    AdminBillPage,
    AdminBillSummary,
    AdminBillShopStat,
    AnalyticsPeriod,
    ItemSalesSummary,
    PaymentSplitSummary,
    ShopCreate,
    ShopRead,
    ShopUpdate,
    ShopSalesSummary,
    AdminDashboardBootstrap,
)
from app.schemas.billing import BillLineRead, BillRead, PaymentRead, ReceiptRead
from sqlalchemy.orm import selectinload


def _shop_to_read(shop: Shop) -> ShopRead:
    return ShopRead(
        id=shop.id,
        name=shop.name,
        is_active=shop.is_active,
        created_at=shop.created_at,
        username=shop.owner.username,
    )


def _bill_to_read(bill: Bill) -> BillRead:
    if bill.shop is None or bill.payment is None or bill.receipt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill details are incomplete")

    return BillRead(
        id=bill.id,
        bill_no=bill.bill_no,
        shop_id=bill.shop_id,
        shop_name=bill.shop.name,
        total_amount=bill.total_amount,
        status=bill.status.value,
        created_at=bill.created_at,
        items=[
            BillLineRead(
                item_id=line.item_id,
                item_name=line.item.name if line.item is not None else "Unknown item",
                quantity=line.quantity,
                unit=line.unit,
                price_per_unit=line.price_per_unit,
                line_total=line.line_total,
            )
            for line in sorted(bill.items, key=lambda item: item.id)
        ],
        payment=PaymentRead.model_validate(bill.payment),
        receipt=ReceiptRead.model_validate(bill.receipt),
    )


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


async def create_shop_account(db: AsyncSession, payload: ShopCreate, actor: User) -> ShopRead:
    username = payload.username.strip()
    shop_name = payload.name.strip()

    if len(shop_name) < 2:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Shop name is required")
    if len(username) < 3:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Username is required")

    existing_user = await db.scalar(select(User.id).where(User.username == username))
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    user = User(
        username=username,
        password_hash=get_password_hash(payload.password),
        role=UserRole.SHOP_ACCOUNT,
        is_active=True,
    )
    shop = Shop(name=shop_name, owner=user, is_active=True)
    db.add_all([user, shop])
    await db.flush()
    await db.commit()
    return _shop_to_read(shop)


async def update_shop_account(db: AsyncSession, shop_id: int, payload: ShopUpdate, actor: User) -> ShopRead:
    shop = await db.get(Shop, shop_id, options=(joinedload(Shop.owner),))
    if shop is None or shop.owner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    username = payload.username.strip()
    shop_name = payload.name.strip()
    new_password = payload.password.strip() if payload.password and payload.password.strip() else None

    if len(shop_name) < 2:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Shop name is required")
    if len(username) < 3:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Username is required")

    if shop.owner.username != username:
        existing_user = await db.scalar(select(User.id).where(User.username == username, User.id != shop.owner.id))
        if existing_user is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    has_changes = False
    if shop.name != shop_name:
        shop.name = shop_name
        has_changes = True
    if shop.owner.username != username:
        shop.owner.username = username
        has_changes = True
    if new_password is not None:
        shop.owner.password_hash = get_password_hash(new_password)
        has_changes = True

    if not has_changes:
        return _shop_to_read(shop)

    await db.commit()
    return _shop_to_read(shop)


async def delete_shop_account(db: AsyncSession, shop_id: int, actor: User) -> None:
    shop = await db.get(Shop, shop_id, options=(joinedload(Shop.owner),))
    if shop is None or shop.owner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    has_bills = await db.scalar(select(Bill.id).where(Bill.shop_id == shop.id).limit(1))
    if has_bills is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a shop that already has billing history",
        )

    has_prices = await db.scalar(select(DailyPrice.id).where(DailyPrice.shop_id == shop.id).limit(1))
    if has_prices is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a shop that already has price history",
        )

    await db.flush()
    await db.delete(shop)
    await db.delete(shop.owner)
    await db.commit()


async def list_shops(db: AsyncSession) -> list[ShopRead]:
    result = await db.scalars(select(Shop).options(joinedload(Shop.owner)).order_by(Shop.id.asc()))
    shops = result.all()
    return [_shop_to_read(shop) for shop in shops]


async def get_shop_by_id(db: AsyncSession, shop_id: int) -> ShopRead:
    shop = await db.get(Shop, shop_id, options=(joinedload(Shop.owner),))
    if shop is None or shop.owner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    return _shop_to_read(shop)


async def set_shop_active_state(db: AsyncSession, shop_id: int, is_active: bool, actor: User) -> ShopRead:
    shop = await db.get(Shop, shop_id, options=(joinedload(Shop.owner),))
    if shop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")
    shop.is_active = is_active
    shop.owner.is_active = is_active
    await db.commit()
    return _shop_to_read(shop)


async def get_bill_by_id(db: AsyncSession, bill_id: int) -> BillRead:
    result = await db.scalar(
        select(Bill)
        .where(Bill.id == bill_id)
        .options(
            joinedload(Bill.shop),
            joinedload(Bill.payment),
            joinedload(Bill.receipt),
            selectinload(Bill.items).joinedload(BillItem.item),
        )
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")

    return _bill_to_read(result)


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
    shop_id: int | None = None,
    limit: int = 100,
    cursor_created_at: datetime | None = None,
    cursor_id: int | None = None,
    # Inject stats if precalculated to avoid redundant queries
    precalculated_stats: list[AdminBillShopStat] | None = None,
    precalculated_largest_bill: AdminBillSummary | None = None,
) -> AdminBillPage:
    start, end = _get_period_bounds(period, reference_date)
    base_filters = [
        Bill.created_at >= start,
        Bill.created_at < end,
    ]
    if shop_id is not None:
        base_filters.append(Bill.shop_id == shop_id)

    page_filters = list(base_filters)
    if cursor_created_at is not None and cursor_id is not None:
        page_filters.append(
            or_(
                Bill.created_at < cursor_created_at,
                and_(Bill.created_at == cursor_created_at, Bill.id < cursor_id),
            )
        )

    if precalculated_stats is not None:
        shop_stats = precalculated_stats
    else:
        stats_rows = (
            await db.execute(
                select(
                    Bill.shop_id,
                    func.count(Bill.id).label("bill_count"),
                    func.max(Bill.created_at).label("last_bill_at"),
                )
                .where(*base_filters)
                .group_by(Bill.shop_id)
            )
        ).all()
        shop_stats = [
            AdminBillShopStat(
                shop_id=row.shop_id,
                bill_count=int(row.bill_count),
                last_bill_at=row.last_bill_at,
            )
            for row in stats_rows
        ]
    total_count = sum(stat.bill_count for stat in shop_stats)

    bill_rows = (
        await db.execute(
            select(Bill, Shop.name)
            .join(Shop, Shop.id == Bill.shop_id)
            .where(*page_filters)
            .order_by(Bill.created_at.desc(), Bill.id.desc())
            .limit(limit + 1)
        )
    ).all()
    has_more = len(bill_rows) > limit
    paged_rows = bill_rows[:limit]

    items = [
        AdminBillSummary(
            bill_id=bill.id,
            bill_no=bill.bill_no,
            shop_id=bill.shop_id,
            shop_name=shop_name,
            total_amount=bill.total_amount,
            status=bill.status.value,
            created_at=bill.created_at,
        )
        for bill, shop_name in paged_rows
    ]
    if precalculated_largest_bill is not None:
        largest_bill = precalculated_largest_bill
    else:
        largest_row = (
            await db.execute(
                select(Bill, Shop.name)
                .join(Shop, Shop.id == Bill.shop_id)
                .where(*base_filters)
                .order_by(Bill.total_amount.desc(), Bill.created_at.desc(), Bill.id.desc())
                .limit(1)
            )
        ).first()
        largest_bill = None
        if largest_row is not None:
            bill, shop_name = largest_row
            largest_bill = AdminBillSummary(
                bill_id=bill.id,
                bill_no=bill.bill_no,
                shop_id=bill.shop_id,
                shop_name=shop_name,
                total_amount=bill.total_amount,
                status=bill.status.value,
                created_at=bill.created_at,
            )

    next_cursor_created_at = None
    next_cursor_id = None
    if has_more and paged_rows:
        last_bill, _ = paged_rows[-1]
        next_cursor_created_at = last_bill.created_at
        next_cursor_id = last_bill.id

    return AdminBillPage(
        items=items,
        limit=limit,
        has_more=has_more,
        total_count=total_count,
        largest_bill=largest_bill,
        shop_stats=shop_stats,
        next_cursor_created_at=next_cursor_created_at,
        next_cursor_id=next_cursor_id,
    )


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


async def get_dashboard_bootstrap(
    db: AsyncSession,
    period: AnalyticsPeriod = "date",
    reference_date: date | None = None,
    shop_id: int | None = None,
    bills_limit: int = 50,
) -> AdminDashboardBootstrap:
    start, end = _get_period_bounds(period, reference_date)

    # 1. Fetch shops list
    shops = await list_shops(db)
    
    # 2. Combined single query for sales, payment splits, and bill stats
    base_filters = [
        Bill.created_at >= start,
        Bill.created_at < end,
    ]
    if shop_id is not None:
        base_filters.append(Bill.shop_id == shop_id)

    # Since sqlite and some DBs have issues with multiple SUMs from different joined tables due to cartesian product
    # The safest performant way is to join Payment to Bill (1-to-1) and then group by Shop
    combined_query = (
        select(
            Shop.id,
            Shop.name,
            func.coalesce(func.sum(Bill.total_amount), 0).label("total_sales"),
            func.coalesce(func.sum(Payment.cash_amount), 0).label("cash_total"),
            func.coalesce(func.sum(Payment.upi_amount), 0).label("upi_total"),
            func.count(distinct(Bill.id)).label("bill_count"),
            func.max(Bill.created_at).label("last_bill_at"),
            # Also find the largest bill ID if possible? No, we can just do a fast limit 1 query.
        )
        .outerjoin(Bill, and_(Bill.shop_id == Shop.id, *base_filters))
        .outerjoin(Payment, Payment.bill_id == Bill.id)
    )
    if shop_id is not None:
        combined_query = combined_query.where(Shop.id == shop_id)
        
    combined_query = combined_query.group_by(Shop.id).order_by(Shop.name)
    combined_rows = (await db.execute(combined_query)).all()

    sales_summary = []
    payment_summary = []
    shop_stats = []
    
    for row in combined_rows:
        if row.bill_count > 0:
            sales_summary.append(ShopSalesSummary(
                shop_id=row.id, shop_name=row.name, total_sales=Decimal(row.total_sales)
            ))
            payment_summary.append(PaymentSplitSummary(
                shop_id=row.id, shop_name=row.name, cash_total=Decimal(row.cash_total), upi_total=Decimal(row.upi_total)
            ))
        shop_stats.append(AdminBillShopStat(
            shop_id=row.id, bill_count=int(row.bill_count), last_bill_at=row.last_bill_at
        ))

    # 3. Fast largest bill query using index
    largest_row = (
        await db.execute(
            select(Bill, Shop.name)
            .join(Shop, Shop.id == Bill.shop_id)
            .where(*base_filters)
            .order_by(Bill.total_amount.desc())
            .limit(1)
        )
    ).first()
    largest_bill = None
    if largest_row is not None:
        bill, shop_name = largest_row
        largest_bill = AdminBillSummary(
            bill_id=bill.id,
            bill_no=bill.bill_no,
            shop_id=bill.shop_id,
            shop_name=shop_name,
            total_amount=bill.total_amount,
            status=bill.status.value,
            created_at=bill.created_at,
        )

    # 4. Fetch daily bills using precalculated stats
    bills_page = await get_daily_bills(
        db, period, reference_date, shop_id, bills_limit,
        precalculated_stats=shop_stats,
        precalculated_largest_bill=largest_bill,
    )

    # 5. Fetch item sales
    item_sales = await get_item_sales_summary(db, period, reference_date, shop_id)

    return AdminDashboardBootstrap(
        shops=shops,
        sales_summary=sales_summary,
        payment_summary=payment_summary,
        bills=bills_page,
        item_sales=item_sales,
    )

from datetime import UTC, date, datetime
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Bill, BillItem, BillStatus, DailyPrice, Item, Payment, Receipt, Shop, User
from app.schemas.billing import BillCheckoutRequest, BillLineRead, BillRead
from app.services.audit import log_action

TWOPLACES = Decimal("0.01")


def _round_money(value: Decimal) -> Decimal:
    return value.quantize(TWOPLACES, rounding=ROUND_HALF_UP)


async def _generate_bill_no(db: AsyncSession, shop: Shop) -> str:
    today = date.today().strftime("%Y%m%d")
    bill_count = await db.scalar(
        select(func.count(Bill.id)).where(
            Bill.shop_id == shop.id,
            func.date(Bill.created_at) == date.today(),
        )
    )
    sequence = int(bill_count or 0) + 1
    return f"{shop.code}-{today}-{sequence:04d}"


async def create_bill(db: AsyncSession, shop: Shop, payload: BillCheckoutRequest, actor: User) -> BillRead:
    today = date.today()
    prices_result = await db.scalars(
        select(DailyPrice).where(
            DailyPrice.shop_id == shop.id,
            DailyPrice.price_date == today,
        )
    )
    prices = prices_result.all()
    if not prices:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Today's prices must be configured before billing",
        )

    price_map = {price.item_id: price for price in prices}
    item_ids = [line.item_id for line in payload.items]
    items_result = await db.scalars(select(Item).where(Item.id.in_(item_ids), Item.is_active.is_(True)))
    items = items_result.all()
    items_by_id = {item.id: item for item in items}
    missing_ids = [item_id for item_id in item_ids if item_id not in items_by_id]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Items not found or inactive: {missing_ids}",
        )

    bill_items: list[BillItem] = []
    bill_lines: list[BillLineRead] = []
    total_amount = Decimal("0.00")

    for line in payload.items:
        item = items_by_id[line.item_id]
        if item.base_unit.value == "unit" and line.quantity != line.quantity.to_integral_value():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{item.name} only accepts integer unit quantities",
            )

        price = price_map.get(item.id)
        if price is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Missing today's price for {item.name}",
            )

        line_total = _round_money(price.price_per_unit * line.quantity)
        total_amount += line_total
        bill_items.append(
            BillItem(
                item_id=item.id,
                quantity=line.quantity,
                unit=item.base_unit,
                price_per_unit=price.price_per_unit,
                line_total=line_total,
            )
        )
        bill_lines.append(
            BillLineRead(
                item_id=item.id,
                item_name=item.name,
                quantity=line.quantity,
                unit=item.base_unit,
                price_per_unit=price.price_per_unit,
                line_total=line_total,
            )
        )

    total_amount = _round_money(total_amount)
    cash_amount = _round_money(payload.payment.cash_amount)
    upi_amount = _round_money(payload.payment.upi_amount)
    total_paid = _round_money(cash_amount + upi_amount)
    balance = _round_money(total_amount - total_paid)

    if total_paid < total_amount:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Payment pending. Balance: {balance}",
        )
    if total_paid > total_amount:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Payment exceeds total amount. Receipt remains blocked until corrected",
        )

    bill = Bill(
        bill_no=await _generate_bill_no(db, shop),
        shop_id=shop.id,
        total_amount=total_amount,
        status=BillStatus.PAID,
        items=bill_items,
    )
    db.add(bill)
    await db.flush()

    payment = Payment(
        bill_id=bill.id,
        cash_amount=cash_amount,
        upi_amount=upi_amount,
        total_paid=total_paid,
        balance=Decimal("0.00"),
        is_settled=True,
    )
    receipt = Receipt(
        bill_id=bill.id,
        receipt_number=f"RCT-{bill.bill_no}",
        printed_at=datetime.now(UTC),
    )
    db.add_all([payment, receipt])

    log_action(
        db,
        actor.id,
        "create_bill",
        f"Created bill {bill.bill_no} for shop {shop.code} amount {total_amount}",
    )
    await db.commit()
    await db.refresh(bill)
    await db.refresh(payment)
    await db.refresh(receipt)

    return BillRead(
        id=bill.id,
        bill_no=bill.bill_no,
        shop_id=shop.id,
        shop_name=shop.name,
        total_amount=bill.total_amount,
        status=bill.status.value,
        created_at=bill.created_at,
        items=bill_lines,
        payment=payment,
        receipt=receipt,
    )

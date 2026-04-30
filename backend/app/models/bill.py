from enum import Enum
from decimal import Decimal

from sqlalchemy import Enum as SqlEnum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import BaseModelMixin
from app.models.enums import BaseUnit


class BillStatus(str, Enum):
    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"


class Bill(Base, BaseModelMixin):
    __tablename__ = "bills"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    bill_no: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[BillStatus] = mapped_column(SqlEnum(BillStatus), nullable=False)

    shop = relationship("Shop", back_populates="bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="bill", uselist=False, cascade="all, delete-orphan")
    receipt = relationship("Receipt", back_populates="bill", uselist=False, cascade="all, delete-orphan")


class BillItem(Base):
    __tablename__ = "bill_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    bill_id: Mapped[int] = mapped_column(ForeignKey("bills.id"), nullable=False)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    unit: Mapped[BaseUnit] = mapped_column(SqlEnum(BaseUnit), nullable=False)
    price_per_unit: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    bill = relationship("Bill", back_populates="items")
    item = relationship("Item", back_populates="bill_items")

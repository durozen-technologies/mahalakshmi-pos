from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Enum, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import BaseModelMixin
from app.models.enums import BaseUnit


class DailyPrice(Base, BaseModelMixin):
    __tablename__ = "daily_prices"
    __table_args__ = (
        UniqueConstraint("shop_id", "item_id", "price_date", name="uq_daily_price_shop_item_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id"), nullable=False)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), nullable=False)
    price_per_unit: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[BaseUnit] = mapped_column(Enum(BaseUnit), nullable=False)
    price_date: Mapped[date] = mapped_column(Date, nullable=False)

    shop = relationship("Shop", back_populates="daily_prices")
    item = relationship("Item", back_populates="daily_prices")

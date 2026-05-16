from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from app.models import BaseUnit
from app.schemas.common import ORMModel


AnalyticsPeriod = Literal["date", "month", "year"]


class ShopCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)
    code: str | None = Field(default=None, min_length=2, max_length=20)


class ShopStatusUpdate(BaseModel):
    is_active: bool


class ShopRead(ORMModel):
    id: int
    name: str
    code: str
    is_active: bool
    created_at: datetime
    username: str


class ShopSalesSummary(BaseModel):
    shop_id: int
    shop_name: str
    shop_code: str
    total_sales: Decimal


class PaymentSplitSummary(BaseModel):
    shop_id: int
    shop_name: str
    cash_total: Decimal
    upi_total: Decimal


class ItemSalesSummary(BaseModel):
    item_id: int
    item_name: str
    base_unit: BaseUnit
    quantity_sold: Decimal
    total_amount: Decimal
    bill_count: int


class AdminBillSummary(BaseModel):
    bill_id: int
    bill_no: str
    shop_id: int
    shop_name: str
    total_amount: Decimal
    status: str
    created_at: datetime


class AuditLogRead(ORMModel):
    id: int
    user_id: int | None
    action: str
    details: str
    created_at: datetime

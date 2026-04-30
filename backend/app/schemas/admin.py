from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class ShopCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
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

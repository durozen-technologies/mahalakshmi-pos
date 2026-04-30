from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from app.models import BaseUnit
from app.schemas.common import ORMModel


class BillItemInput(BaseModel):
    item_id: int
    quantity: Decimal = Field(gt=0)


class CheckoutPaymentInput(BaseModel):
    cash_amount: Decimal = Field(ge=0)
    upi_amount: Decimal = Field(ge=0)


class BillCheckoutRequest(BaseModel):
    items: list[BillItemInput]
    payment: CheckoutPaymentInput

    @model_validator(mode="after")
    def validate_items(self) -> "BillCheckoutRequest":
        if not self.items:
            raise ValueError("At least one cart item is required")
        return self


class BillLineRead(BaseModel):
    item_id: int
    item_name: str
    quantity: Decimal
    unit: BaseUnit
    price_per_unit: Decimal
    line_total: Decimal


class PaymentRead(ORMModel):
    id: int
    cash_amount: Decimal
    upi_amount: Decimal
    total_paid: Decimal
    balance: Decimal
    is_settled: bool


class ReceiptRead(ORMModel):
    id: int
    receipt_number: str
    printed_at: datetime


class BillRead(BaseModel):
    id: int
    bill_no: str
    shop_id: int
    shop_name: str
    total_amount: Decimal
    status: str
    created_at: datetime
    items: list[BillLineRead]
    payment: PaymentRead
    receipt: ReceiptRead

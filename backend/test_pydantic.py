import asyncio
from decimal import Decimal
from datetime import datetime
from app.models import Payment, Receipt
from app.schemas.billing import BillRead, PaymentRead, ReceiptRead, BillLineRead

def test():
    payment = Payment(id=1, cash_amount=Decimal(10), upi_amount=Decimal(0), total_paid=Decimal(10), balance=Decimal(0), is_settled=True)
    receipt = Receipt(id=1, receipt_number="123", printed_at=datetime.now())
    
    b = BillRead(
        id=1,
        bill_no="SMB-1",
        shop_id=1,
        shop_name="Shop",
        total_amount=Decimal(10),
        status="paid",
        created_at=datetime.now(),
        items=[],
        payment=payment,
        receipt=receipt
    )
    print("SUCCESS")

test()

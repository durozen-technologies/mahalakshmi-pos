import { BillRead } from "@/types/api";
import { formatCurrency, formatDateTime, formatUnit } from "@/utils/format";

export function buildReceiptText(bill: BillRead) {
  const lines = [
    bill.shop_name,
    `Bill: ${bill.bill_no}`,
    `Date: ${formatDateTime(bill.created_at)}`,
    "",
    ...bill.items.map(
      (item) =>
        `${item.item_name}  ${item.quantity}${formatUnit(item.unit)} x ${formatCurrency(item.price_per_unit)} = ${formatCurrency(item.line_total)}`,
    ),
    "",
    `Total: ${formatCurrency(bill.total_amount)}`,
    `Cash: ${formatCurrency(bill.payment.cash_amount)}`,
    `UPI: ${formatCurrency(bill.payment.upi_amount)}`,
    `Status: ${bill.status.toUpperCase()}`,
  ];

  return lines.join("\n");
}

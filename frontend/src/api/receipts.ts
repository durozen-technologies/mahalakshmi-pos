import { BillRead } from "@/types/api";
import { formatCurrency, formatDateTime, formatUnit } from "@/utils/format";

export function buildReceiptText(bill: BillRead) {
  const lines = [
    `Mahalakshmi Broilers`,
    `${bill.shop_name.toUpperCase()}`,
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildReceiptHtml(bill: BillRead) {
  const itemRows = bill.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.item_name)}</td>
          <td class="align-right">${escapeHtml(`${item.quantity} ${formatUnit(item.unit)}`)}</td>
          <td class="align-right">${escapeHtml(formatCurrency(item.line_total))}</td>
        </tr>`,
    )
    .join("");

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <style>
          body {
            font-family: "Courier New", monospace;
            color: #111111;
            padding: 12px;
            font-size: 12px;
            line-height: 1.45;
          }
          .receipt {
            max-width: 280px;
            margin: 0 auto;
          }
          .center {
            text-align: center;
          }
          .spacer {
            margin-top: 10px;
          }
          .rule {
            border-top: 1px dashed #111111;
            margin: 10px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td {
            padding: 3px 0;
            vertical-align: top;
          }
          .align-right {
            text-align: right;
          }
          .totals td {
            padding: 2px 0;
          }
          .strong {
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="center strong"><bold>Mahalakshmi Broilers </bold></div>
          <div class="center strong">${escapeHtml(bill.shop_name)}</div>
          <div class="center">Receipt No: ${escapeHtml(bill.receipt.receipt_number)}</div>
          <div class="center">Bill No: ${escapeHtml(bill.bill_no)}</div>
          <div class="center">${escapeHtml(formatDateTime(bill.created_at))}</div>

          <div class="rule"></div>

          <table>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <div class="rule"></div>

          <table class="totals">
            <tbody>
              <tr>
                <td>Total</td>
                <td class="align-right strong">${escapeHtml(formatCurrency(bill.total_amount))}</td>
              </tr>
              <tr>
                <td>Cash</td>
                <td class="align-right">${escapeHtml(formatCurrency(bill.payment.cash_amount))}</td>
              </tr>
              <tr>
                <td>UPI</td>
                <td class="align-right">${escapeHtml(formatCurrency(bill.payment.upi_amount))}</td>
              </tr>
              <tr>
                <td>Status</td>
                <td class="align-right">${escapeHtml(bill.status.toUpperCase())}</td>
              </tr>
            </tbody>
          </table>

          <div class="rule"></div>

          <div class="center spacer">Thank you</div>
        </div>
      </body>
    </html>`;
}

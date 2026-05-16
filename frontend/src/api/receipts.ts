import { BillRead } from "@/types/api";
import { translateShopItemName } from "@/hooks/use-shop-translation";
import { ShopLanguage } from "@/store/shop-language-store";
import { formatCurrency, formatDateTime, formatUnit } from "@/utils/format";

function formatReceiptCurrency(value?: string | number | null) {
  return formatCurrency(value).replace(/^Rs\.\s*/, "");
}

const RECEIPT_COPY = {
  en: {
    companyName: "SRI MAHALAKSHMI BROILERS",
    receipt: "Receipt",
    bill: "Bill",
    date: "Date",
    items: "ITEMS",
    item: "ITEM",
    quantityUnit: "QTY/UNIT",
    total: "TOTAL",
    rate: "Rate",
    cash: "Cash",
    upi: "UPI",
    thankYou: "Thank you. Visit again.",
    poweredBy: "Software provided by",
    provider: "Durozen Technologies pvt. Ltd.",
  },
  ta: {
    companyName: "ஸ்ரீ மகாலட்சுமி பிராய்லர்ஸ்",
    receipt: "ரசீது",
    bill: "பில்",
    date: "தேதி",
    items: "பொருட்கள்",
    item: "பொருள்",
    quantityUnit: "அளவு",
    total: "மொத்தம்",
    rate: "விலை",
    cash: "பணம்",
    upi: "யூபிஐ",
    thankYou: "நன்றி. மீண்டும் வருக.",
    poweredBy: "மென்பொருள் வழங்கியது",
    provider: "Durozen Technologies pvt. Ltd.",
  },
} as const;

const RECEIPT_LANGUAGE: ShopLanguage = "ta";

function getReceiptLanguage(_: ShopLanguage | undefined = undefined) {
  return RECEIPT_LANGUAGE;
}

function getReceiptCopy(language?: ShopLanguage) {
  const resolvedLanguage = getReceiptLanguage(language);
  return RECEIPT_COPY[resolvedLanguage];
}

function formatReceiptShopName(shopName: string, language?: ShopLanguage) {
  return getReceiptLanguage(language) === "ta" ? shopName : shopName.toUpperCase();
}

export function buildReceiptText(bill: BillRead, language?: ShopLanguage) {
  const copy = getReceiptCopy(language);
  const lines = [
    copy.companyName,
    formatReceiptShopName(bill.shop_name, language),
    `${copy.receipt}: ${bill.receipt.receipt_number}`,
    `${copy.bill}: ${bill.bill_no}`,
    `${copy.date}: ${formatDateTime(bill.created_at)}`,
    `----------------------------------------`,
    copy.items,
    "",
    ...bill.items.map(
      (item) =>
        `${translateShopItemName(getReceiptLanguage(language), item.item_name).padEnd(15)} ${item.quantity}${formatUnit(item.unit).padEnd(5)} x ${formatReceiptCurrency(item.price_per_unit)} = ${formatReceiptCurrency(item.line_total)}`,
    ),
    "",
    `----------------------------------------`,
    `${copy.cash}: ${formatReceiptCurrency(bill.payment.cash_amount)}`,
    `${copy.upi}: ${formatReceiptCurrency(bill.payment.upi_amount)}`,
    `${copy.total}: ${formatReceiptCurrency(bill.total_amount)}`,
    `----------------------------------------`,
    copy.thankYou,
    "", // Note: leave some blank lines at the end so the printer rolls the paper up!
    "",
    "",
    "",
  ];

  return lines.join("\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "'");
}

// If rate is needed in the future, we can add it as a hidden column in the HTML and use CSS to show it only when needed. This way we can avoid breaking existing printer templates that might rely on the current structure of the receipt.
// <tr>
//           <td colspan="3" class="item-calc-row">
//              ${copy.rate}: ${formatReceiptCurrency(item.price_per_unit)} / ${formatUnit(item.unit)}
//           </td>
//         </tr>

export function buildReceiptHtml(bill: BillRead) {
  const language = getReceiptLanguage();
  const copy = getReceiptCopy(language);
  const itemRows = bill.items
    .map(
      (item) => `
        <tr class="item-row">
          <td class="item-name strong">${escapeHtml(translateShopItemName(language, item.item_name))}</td>
          <td class="align-right item-qty">${item.quantity} ${formatUnit(item.unit)}</td>
          <td class="align-right item-total strong">${formatReceiptCurrency(item.line_total)}</td>
        </tr>
        `,
    )
    .join("");

  return `
    <html lang="ta">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <meta charset="utf-8" />
        <style>
          @page {
            margin: 0;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            text-shadow: none !important;
            box-shadow: none !important;
          }

          html {
            background: #fff;
          }

          body {
            font-family: "Noto Sans Tamil", "Nirmala UI", "Latha", Arial, Helvetica, sans-serif;
            color: #000000;
            margin: 0;
            padding: 12px;
            font-size: 14px;
            line-height: 1.1;
            background: #fff;
            font-weight: 600;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -webkit-text-size-adjust: 100%;
            text-size-adjust: 100%;
            font-kerning: none;
            letter-spacing: 0;
          }

          .receipt-container {
            width: 100%;
            max-width: 380px;
            margin: 0 auto;
          }

          .center { text-align: center; }
          .align-right { text-align: right; }
          .strong { font-weight: 700; }
          
          .header-main {
            font-size: 26px;
            letter-spacing: -0.4px;
            line-height: 1;
            margin-bottom: 3px;
            white-space: nowrap;
            color: #000000;
            font-weight: 800;
          }
          .header-sub {
            font-size: 21px;
            line-height: 1.02;
            margin-bottom: 10px;
            border-bottom: 2.5px solid #000000;
            padding-bottom: 7px;
            color: #000000;
            font-weight: 800;
          }
          .bill-meta {
            font-size: 16px;
            line-height: 1.1;
            margin-bottom: 10px;
            color: #000000;
            text-align: center;
          }
          .bill-meta span {
            display: block;
            margin-bottom: 4px;
          }
          .bill-meta span:last-child {
            margin-bottom: 0;
          }

          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .col-item-name { width: 58%; }
          .col-item-qty { width: 18%; }
          .col-item-total { width: 24%; }
          .items-header { border-bottom: 2.5px solid #000000; border-top: 2.5px solid #000000; }
          .items-header th {
            padding: 7px 0;
            font-size: 15px;
            font-weight: 800;
            text-transform: uppercase;
            line-height: 1;
            color: #000000;
            white-space: nowrap;
          }
          
          .item-row td { padding-top: 8px; padding-bottom: 10px; vertical-align: top; line-height: 1.05; }
          .item-name {
            width: 58%;
            max-width: 58%;
            font-size: 19px;
            padding-right: 8px;
            line-height: 1.1;
            color: #000000;
            font-weight: 800;
            white-space: normal;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .item-qty {
            width: 82px;
            font-size: 16px;
            white-space: nowrap;
            color: #000000;
            font-weight: 700;
          }
          .item-total {
            width: 92px;
            font-size: 20px;
            white-space: nowrap;
            color: #000000;
            font-weight: 800;
          }
          .item-calc-row { 
            font-size: 15px; 
            font-weight: 700;
            line-height: 1;
            color: #000000; 
            padding: 2px 0 8px; 
          }

          .payment-divider {
            border-top: 2.5px solid #000000;
            margin-top: 10px;
          }
          
          .upi-bottom-divider {
            border-bottom: 1.5px solid #000000;
            padding-bottom: 4px;
            margin-bottom: 4px;
          }

          .totals-section { margin-top: 4px; }
          .total-row td {
            padding: 4px 0;
            font-size: 19px;
            font-weight: 700;
            line-height: 1;
            color: #000000;
          }
          .grand-total td {
            font-size: 30px;
            font-weight: 800;
            padding-top: 8px;
            color: #000000;
          }

          .footer {
            margin-top: 18px;
            border-top: 1.5px dashed #7f7f7f;
            padding-top: 14px;
          }
          .thank-you {
            font-size: 21px;
            font-weight: 800;
            line-height: 1.15;
            color: #000000;
          }
          .footer-note {
            font-size: 14px;
            font-weight: 700;
            color: #000000;
            margin: 8px 0 6px;
          }
          .total-divider { border-top: 2.5px solid #000000; margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="center">
            <div class="strong header-main">${copy.companyName}</div>
            <div class="strong header-sub">${escapeHtml(formatReceiptShopName(bill.shop_name, language))}</div>
          </div>

          <div class="bill-meta">
            <span><strong>${copy.bill}:</strong> ${escapeHtml(bill.bill_no)}</span>
            <span><strong>${copy.date}:</strong> ${escapeHtml(formatDateTime(bill.created_at))}</span>
          </div>

          <table>
            <colgroup>
              <col class="col-item-name" />
              <col class="col-item-qty" />
              <col class="col-item-total" />
            </colgroup>
            <thead>
              <tr class="items-header">
                <th align="left">${copy.item}</th>
                <th align="right">${copy.quantityUnit}</th>
                <th align="right">${copy.total}</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <!-- Line before payment -->
          <div class="payment-divider"></div>

          <table class="totals-section">
            <tr class="total-row">
              <td>${copy.cash}</td>
              <td class="align-right">${formatReceiptCurrency(bill.payment.cash_amount)}</td>
            </tr>
            <tr class="total-row">
              <td class="upi-bottom-divider">${copy.upi}</td>
              <td class="align-right upi-bottom-divider">${formatReceiptCurrency(bill.payment.upi_amount)}</td>
            </tr>
            <tr class="total-row grand-total">
              <td class="strong">${copy.total}</td>
              <td class="align-right strong">Rs. ${formatReceiptCurrency(bill.total_amount)}</td>
            </tr>
          </table>

          <!-- Line after totals -->
          <div class="total-divider"></div>

          <div class="center footer">
            <div class="strong thank-you">${copy.thankYou}</div>
            <div class="footer-note">${copy.poweredBy}</div>
            <div class="strong thank-you">${copy.provider}</div>
          </div>
        </div>
      </body>
    </html>`;
}

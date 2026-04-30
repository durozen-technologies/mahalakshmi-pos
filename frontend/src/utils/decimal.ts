import { Decimal } from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function money(value?: string | number | null) {
  try {
    return new Decimal(value ?? 0);
  } catch {
    return new Decimal(0);
  }
}

export function toMoneyString(value?: string | number | null) {
  return money(value).toFixed(2);
}

export function toQuantityString(value?: string | number | null, isUnit = false) {
  const decimal = money(value);
  return isUnit ? decimal.toFixed(0) : decimal.toFixed(3);
}

export function sumMoney(values: (string | number | null | undefined)[]) {
  return values.reduce((total, value) => total.plus(money(value)), new Decimal(0));
}

export function isPositiveNumber(value: string) {
  return money(value).greaterThan(0);
}

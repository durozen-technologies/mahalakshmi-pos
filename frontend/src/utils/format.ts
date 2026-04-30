import { BaseUnit } from "@/types/api";
import { money } from "@/utils/decimal";

export function formatCurrency(value?: string | number | null) {
  return `Rs. ${money(value).toFixed(2)}`;
}

export function formatUnit(unit: BaseUnit) {
  return unit === "kg" ? "kg" : "unit";
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
}

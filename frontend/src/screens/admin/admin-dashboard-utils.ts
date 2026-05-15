import * as Haptics from "expo-haptics";

import type { AnalyticsPeriod, AuditLogRead, BaseUnit, ShopRead } from "@/types/api";
import { money } from "@/utils/decimal";
import { formatDate } from "@/utils/format";

import type { ThemePalette } from "./admin-dashboard-theme";

export type AdminNavTab = "dashboard" | "billing" | "inventory" | "reports" | "settings";
export type SectionKey = AdminNavTab;
export type AnalyticsSectionKey = "inventory" | "reports" | "billing" | "settings";
export type LogSeverity = "info" | "warning" | "error" | "critical";
export type ShopOperationalState = "ACTIVE" | "IDLE" | "OFFLINE" | "DISABLED";
export type ToastTone = "success" | "error";
export type AuditFilter = "all" | LogSeverity;

export type SeverityMeta = {
  tone: ToastTone | "warning" | "neutral";
  label: LogSeverity;
  icon: string;
  chipBackground: string;
  chipText: string;
};

export const NAV_ITEMS: { key: AdminNavTab; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "view-dashboard-outline" },
  { key: "inventory", label: "Inventory", icon: "food-drumstick-outline" },
  { key: "reports", label: "Reports", icon: "chart-box-outline" },
  { key: "billing", label: "Billing", icon: "receipt-text-outline" },
  { key: "settings", label: "Settings", icon: "cog-outline" },
];

export const AUDIT_FILTER_OPTIONS: { key: AuditFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "info", label: "Info" },
  { key: "warning", label: "Warning" },
  { key: "error", label: "Error" },
  { key: "critical", label: "Critical" },
];

export function triggerHaptic(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  void Haptics.impactAsync(style).catch(() => undefined);
}

export function formatCompactCurrency(value: string | number) {
  const numericValue = Number(money(value).toFixed(2));
  const compact = new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: numericValue >= 100000 ? 1 : 0,
  }).format(numericValue);

  return `Rs. ${compact}`;
}

export function formatRelativeTime(value?: string | null) {
  if (!value) {
    return "No recent sync";
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function getShopStatus(shop: ShopRead, lastActivityAt?: string | null): ShopOperationalState {
  if (!shop.is_active) {
    return "DISABLED";
  }

  if (!lastActivityAt) {
    return "OFFLINE";
  }

  const diffHours = (Date.now() - new Date(lastActivityAt).getTime()) / 3600000;
  if (diffHours <= 1) {
    return "ACTIVE";
  }

  if (diffHours <= 6) {
    return "IDLE";
  }

  return "OFFLINE";
}

export function getSeverityMeta(log: AuditLogRead, palette: ThemePalette): SeverityMeta {
  const text = `${log.action} ${log.details}`.toLowerCase();

  if (text.includes("failed") || text.includes("error") || text.includes("denied")) {
    return {
      tone: "error",
      label: "error",
      icon: "alert-circle-outline",
      chipBackground: palette.dangerSoft,
      chipText: palette.danger,
    };
  }

  if (text.includes("disabled") || text.includes("invalid") || text.includes("warning")) {
    return {
      tone: "warning",
      label: "warning",
      icon: "alert-outline",
      chipBackground: palette.goldSoft,
      chipText: palette.cash,
    };
  }

  if (text.includes("deleted") || text.includes("critical")) {
    return {
      tone: "error",
      label: "critical",
      icon: "alert-decagram-outline",
      chipBackground: palette.dangerSoft,
      chipText: palette.danger,
    };
  }

  return {
    tone: "success",
    label: "info",
    icon: "information-outline",
    chipBackground: palette.successSoft,
    chipText: palette.success,
  };
}

export function buildDateOptions() {
  const today = new Date();
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const iso = date.toISOString().slice(0, 10);

    return {
      value: iso,
      label:
        index === 0
          ? "Today"
          : index === 1
            ? "Yesterday"
            : new Intl.DateTimeFormat("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              }).format(date),
    };
  });
}

export function buildMonthOptions() {
  const today = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
    const value = date.toISOString().slice(0, 10);

    return {
      value,
      label: new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
      }).format(date),
    };
  });
}

export function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, index) => {
    const year = currentYear - index;
    return {
      value: `${year}-01-01`,
      label: `${year}`,
    };
  });
}

export function formatAnalyticsReference(period: AnalyticsPeriod, value: string) {
  const date = new Date(value);

  if (period === "date") {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  if (period === "month") {
    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
  }).format(date);
}

export function getUnitLabel(unit: BaseUnit, quantity: string) {
  const numericQuantity = money(quantity).toNumber();
  const normalizedQuantity = Number.isInteger(numericQuantity) ? `${numericQuantity}` : `${numericQuantity.toFixed(2)}`;
  return `${normalizedQuantity} ${unit === "kg" ? "Kg" : numericQuantity === 1 ? "Unit" : "Units"}`;
}

export function groupBillsByDate<T extends { created_at: string }>(items: T[]) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = formatDate(item.created_at);
    const current = groups.get(key) ?? [];
    current.push(item);
    groups.set(key, current);
  }

  return Array.from(groups.entries()).map(([label, entries]) => ({
    label,
    entries,
  }));
}

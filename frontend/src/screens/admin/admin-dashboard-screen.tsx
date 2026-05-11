import { ComponentProps, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Alert,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  UIManager,
  View,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  createShop,
  fetchAuditLogs,
  fetchDailyBills,
  fetchGlobalPriceBootstrap,
  fetchPaymentSummary,
  fetchSalesSummary,
  fetchShops,
  saveGlobalDailyPrices,
  updateShopStatus,
} from "@/api/admin";
import { toApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Screen } from "@/components/ui/screen";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusPill } from "@/components/ui/status-pill";
import { TextField } from "@/components/ui/text-field";
import type {
  AdminBillSummary,
  AuditLogRead,
  PaymentSplitSummary,
  ShopBootstrapResponse,
  ShopRead,
  ShopSalesSummary,
} from "@/types/api";
import { cn } from "@/utils/cn";
import { isPositiveNumber, money, toMoneyString } from "@/utils/decimal";
import { formatCurrency, formatDateTime } from "@/utils/format";

const createShopSchema = z.object({
  name: z.string().min(2, "Shop name is required"),
  code: z.string().optional(),
});

type CreateShopFormValues = z.infer<typeof createShopSchema>;
type PriceFormValues = Record<string, string>;
type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];
type ShopFilter = "all" | "active" | "inactive";
type ShopSort = "revenue" | "name" | "activity";
type LogSeverity = "info" | "warning" | "error" | "critical";
type ExpandableSection = "shops" | "pricing" | "analytics" | "activity";
type ShopOperationalState = "ACTIVE" | "IDLE" | "OFFLINE" | "DISABLED";

type ShopDashboardRow = {
  shop: ShopRead;
  totalSales: string;
  cashTotal: string;
  upiTotal: string;
  billCount: number;
  lastActivityAt: string;
  status: ShopOperationalState;
};

type ActionChipProps = {
  label: string;
  icon: IconName;
  onPress: () => void;
  tone?: "primary" | "secondary";
};

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: IconName;
};

type OverviewCardProps = {
  label: string;
  value: string;
  icon: IconName;
  note: string;
  tone?: "primary" | "success" | "warning" | "neutral";
};

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
};

type SectionCardProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
};

type AnalyticsCardProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
};

type SeverityMeta = {
  tone: "success" | "warning" | "danger" | "neutral";
  label: LogSeverity;
  icon: IconName;
  accentClassName: string;
};

function formatCompactCurrency(value: string | number) {
  const numericValue = Number(money(value).toFixed(2));
  const compact = new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: numericValue >= 100000 ? 1 : 0,
  }).format(numericValue);

  return `Rs. ${compact}`;
}

function formatShortTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-IN", { timeStyle: "short" }).format(date);
}

function formatRelativeTime(value?: string | null) {
  if (!value) {
    return "No recent activity";
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Updated just now";
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

function getShopStatus(shop: ShopRead, lastActivityAt?: string | null): ShopOperationalState {
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

function getSeverityMeta(log: AuditLogRead): SeverityMeta {
  const text = `${log.action} ${log.details}`.toLowerCase();

  if (text.includes("failed") || text.includes("error") || text.includes("denied")) {
    return {
      tone: "danger",
      label: "error",
      icon: "alert-circle-outline",
      accentClassName: "bg-dangerSoft border-red-200",
    };
  }

  if (text.includes("disabled") || text.includes("invalid") || text.includes("warning")) {
    return {
      tone: "warning",
      label: "warning",
      icon: "alert-outline",
      accentClassName: "bg-warningSoft border-amber-200",
    };
  }

  if (text.includes("deleted") || text.includes("critical")) {
    return {
      tone: "danger",
      label: "critical",
      icon: "alert-decagram-outline",
      accentClassName: "bg-dangerSoft border-red-300",
    };
  }

  return {
    tone: "success",
    label: "info",
    icon: "information-outline",
    accentClassName: "bg-successSoft border-green-200",
  };
}

function ActionChip({ label, icon, onPress, tone = "secondary" }: ActionChipProps) {
  const palette =
    tone === "primary"
      ? "border-accent bg-accent"
      : "border-border bg-card";
  const textColor = tone === "primary" ? "text-white" : "text-ink";
  const iconColor = tone === "primary" ? "#FFFFFF" : "#244734";

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "mr-3 flex-row items-center gap-2 rounded-full border px-4 py-3 shadow-soft",
        palette,
      )}
    >
      <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      <Text className={cn("text-sm font-semibold", textColor)}>{label}</Text>
    </Pressable>
  );
}

function FilterChip({ label, active, onPress, icon }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-2 rounded-full border px-3 py-2",
        active ? "border-accent bg-accentSoft" : "border-border bg-card",
      )}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={16} color={active ? "#183224" : "#657366"} /> : null}
      <Text className={cn("text-xs font-semibold", active ? "text-accentDeep" : "text-muted")}>{label}</Text>
    </Pressable>
  );
}

function SearchField({ value, onChangeText, placeholder }: SearchFieldProps) {
  return (
    <View className="flex-row items-center rounded-[24px] border border-border bg-surface px-4 py-3">
      <MaterialCommunityIcons name="magnify" size={18} color="#657366" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#95A293"
        className="ml-3 flex-1 text-sm text-ink"
      />
      {value ? (
        <Pressable onPress={() => onChangeText("")}>
          <MaterialCommunityIcons name="close-circle" size={18} color="#95A293" />
        </Pressable>
      ) : null}
    </View>
  );
}

function OverviewCard({ label, value, icon, note, tone = "neutral" }: OverviewCardProps) {
  const toneMap = {
    primary: {
      bg: "bg-accent",
      iconWrap: "bg-white/15",
      label: "text-white/80",
      value: "text-white",
      note: "text-white",
      icon: "#FFFFFF",
    },
    success: {
      bg: "bg-card",
      iconWrap: "bg-successSoft",
      label: "text-muted",
      value: "text-ink",
      note: "text-accentDeep",
      icon: "#244734",
    },
    warning: {
      bg: "bg-card",
      iconWrap: "bg-warningSoft",
      label: "text-muted",
      value: "text-ink",
      note: "text-amber-700",
      icon: "#A36A20",
    },
    neutral: {
      bg: "bg-card",
      iconWrap: "bg-surface",
      label: "text-muted",
      value: "text-ink",
      note: "text-muted",
      icon: "#244734",
    },
  }[tone];

  return (
    <View className={cn("min-w-[156px] flex-1 basis-[160px] rounded-[28px] border border-border px-4 py-4 shadow-soft", toneMap.bg)}>
      <View className="flex-row items-start justify-between gap-3">
        <View className={cn("rounded-2xl p-3", toneMap.iconWrap)}>
          <MaterialCommunityIcons name={icon} size={20} color={toneMap.icon} />
        </View>
      </View>
      <Text className={cn("mt-4 text-xs font-semibold uppercase tracking-[1px]", toneMap.label)}>{label}</Text>
      <Text className={cn("mt-1 text-[24px] font-bold leading-8", toneMap.value)}>{value}</Text>
      <Text className={cn("mt-2 text-xs font-medium", toneMap.note)}>{note}</Text>
    </View>
  );
}

function SectionCard({
  eyebrow,
  title,
  subtitle,
  collapsed,
  onToggle,
  children,
  rightSlot,
}: SectionCardProps) {
  return (
    <Card className="gap-4 overflow-hidden p-0">
      <Pressable onPress={onToggle} className="flex-row items-start justify-between gap-3 px-5 py-5">
        <View className="flex-1 gap-1">
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-accentDeep">{eyebrow}</Text>
          <Text className="text-[24px] font-bold leading-8 text-ink">{title}</Text>
          <Text className="text-sm leading-6 text-muted">{subtitle}</Text>
        </View>
        <View className="items-end gap-3">
          {rightSlot}
          <View className="rounded-full border border-border bg-surface p-2">
            <MaterialCommunityIcons
              name={collapsed ? "chevron-down" : "chevron-up"}
              size={18}
              color="#244734"
            />
          </View>
        </View>
      </Pressable>
      {!collapsed ? <View className="px-5 pb-5">{children}</View> : null}
    </Card>
  );
}

function AnalyticsCard({ title, subtitle, children, className }: AnalyticsCardProps) {
  return (
    <Card className={cn("min-w-[280px] flex-1 gap-4", className)}>
      <View className="gap-1">
        <Text className="text-base font-semibold text-ink">{title}</Text>
        <Text className="text-sm leading-6 text-muted">{subtitle}</Text>
      </View>
      {children}
    </Card>
  );
}

export function AdminDashboardScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 960;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceBootstrap, setPriceBootstrap] = useState<ShopBootstrapResponse | null>(null);
  const [shops, setShops] = useState<ShopRead[]>([]);
  const [salesSummary, setSalesSummary] = useState<ShopSalesSummary[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSplitSummary[]>([]);
  const [dailyBills, setDailyBills] = useState<AdminBillSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRead[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<ExpandableSection, boolean>>({
    shops: true,
    pricing: false,
    analytics: true,
    activity: true,
  });
  const [expandedShopId, setExpandedShopId] = useState<number | null>(null);
  const [expandedBillId, setExpandedBillId] = useState<number | null>(null);
  const [focusedShopId, setFocusedShopId] = useState<number | null>(null);
  const [shopQuery, setShopQuery] = useState("");
  const [shopFilter, setShopFilter] = useState<ShopFilter>("all");
  const [shopSort, setShopSort] = useState<ShopSort>("revenue");
  const [billQuery, setBillQuery] = useState("");
  const [auditQuery, setAuditQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<LogSeverity | "all">("all");
  const [priceSearch, setPriceSearch] = useState("");

  const deferredShopQuery = useDeferredValue(shopQuery.trim().toLowerCase());
  const deferredBillQuery = useDeferredValue(billQuery.trim().toLowerCase());
  const deferredAuditQuery = useDeferredValue(auditQuery.trim().toLowerCase());
  const deferredPriceSearch = useDeferredValue(priceSearch.trim().toLowerCase());

  const form = useForm<CreateShopFormValues>({
    resolver: zodResolver(createShopSchema),
    defaultValues: { name: "", code: "" },
  });
  const priceForm = useForm<PriceFormValues>({ defaultValues: {} });
  const priceValues = priceForm.watch();

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  async function loadDashboard(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [shopsData, salesData, paymentsData, billsData, logsData] = await Promise.all([
        fetchShops(),
        fetchSalesSummary(),
        fetchPaymentSummary(),
        fetchDailyBills(),
        fetchAuditLogs(),
      ]);

      setShops(shopsData);
      setSalesSummary(salesData);
      setPaymentSummary(paymentsData);
      setDailyBills(billsData);
      setAuditLogs(logsData);
      setLastSyncAt(new Date().toISOString());
    } catch (error) {
      Alert.alert("Unable to load dashboard", toApiError(error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function handleCreateShop(values: CreateShopFormValues) {
    setCreating(true);
    try {
      await createShop({
        name: values.name,
        code: values.code?.trim() ? values.code.trim() : null,
      });
      form.reset();
      setModalOpen(false);
      await loadDashboard(true);
      Alert.alert("Shop created", "New shop credentials are ready in the admin list.");
    } catch (error) {
      Alert.alert("Unable to create shop", toApiError(error).message);
    } finally {
      setCreating(false);
    }
  }

  async function loadPriceBootstrap(forceRefresh = false) {
    if (priceBootstrap && !forceRefresh) {
      return;
    }

    setPriceLoading(true);
    try {
      const bootstrap = await fetchGlobalPriceBootstrap();
      setPriceBootstrap(bootstrap);
      setPriceSearch("");
    } catch (error) {
      Alert.alert("Unable to load items", toApiError(error).message);
    } finally {
      setPriceLoading(false);
    }
  }

  async function openPricePanel(forceRefresh = false) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((current) => ({ ...current, pricing: true }));
    await loadPriceBootstrap(forceRefresh);
  }

  useEffect(() => {
    if (!priceBootstrap) {
      return;
    }

    const defaults = Object.fromEntries(
      priceBootstrap.items.map((item) => [`price_${item.item_id}`, item.current_price ?? ""]),
    );
    priceForm.reset(defaults);
  }, [priceBootstrap, priceForm]);

  async function handleSavePrices(values: PriceFormValues) {
    if (!priceBootstrap) {
      return;
    }

    const entries: { item_id: number; price_per_unit: string }[] = [];
    for (const item of priceBootstrap.items) {
      const raw = values[`price_${item.item_id}`]?.trim() ?? "";
      if (!isPositiveNumber(raw)) {
        Alert.alert("Invalid price", `Enter a valid price for ${item.item_name}.`);
        return;
      }

      entries.push({ item_id: item.item_id, price_per_unit: toMoneyString(raw) });
    }

    try {
      await saveGlobalDailyPrices({ entries });
      await loadPriceBootstrap(true);
      await loadDashboard(true);
      Alert.alert("Prices saved", "Global prices have been updated for all shops.");
    } catch (error) {
      Alert.alert("Unable to save prices", toApiError(error).message);
    }
  }

  async function handleToggleShop(shop: ShopRead, isActive: boolean) {
    try {
      await updateShopStatus(shop.id, { is_active: isActive });
      await loadDashboard(true);
    } catch (error) {
      Alert.alert("Unable to update shop", toApiError(error).message);
    }
  }

  function toggleSection(section: ExpandableSection) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function toggleShopRow(shopId: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedShopId((current) => (current === shopId ? null : shopId));
  }

  function toggleBillRow(billId: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBillId((current) => (current === billId ? null : billId));
  }

  function focusShop(shopId: number | null) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFocusedShopId(shopId);
  }

  function applyBulkAdjustment(multiplier: number) {
    if (!priceBootstrap) {
      return;
    }

    for (const item of priceBootstrap.items) {
      const currentValue = priceValues[`price_${item.item_id}`] ?? item.current_price ?? "0";
      const nextValue = money(currentValue || "0").mul(multiplier).toFixed(2);
      priceForm.setValue(`price_${item.item_id}`, nextValue, { shouldDirty: true });
    }
  }

  function resetPriceChanges() {
    if (!priceBootstrap) {
      return;
    }

    const defaults = Object.fromEntries(
      priceBootstrap.items.map((item) => [`price_${item.item_id}`, item.current_price ?? ""]),
    );
    priceForm.reset(defaults);
  }

  const salesByShopId = useMemo(
    () =>
      new Map(
        salesSummary.map((item) => [
          item.shop_id,
          {
            totalSales: item.total_sales,
            shopName: item.shop_name,
            shopCode: item.shop_code,
          },
        ]),
      ),
    [salesSummary],
  );

  const paymentsByShopId = useMemo(
    () =>
      new Map(
        paymentSummary.map((item) => [
          item.shop_id,
          { cashTotal: item.cash_total, upiTotal: item.upi_total },
        ]),
      ),
    [paymentSummary],
  );

  const latestBillByShopId = useMemo(() => {
    const map = new Map<number, AdminBillSummary>();

    for (const bill of dailyBills) {
      const current = map.get(bill.shop_id);
      if (!current || new Date(bill.created_at).getTime() < new Date(bill.created_at).getTime()) {
        map.set(bill.shop_id, bill);
      }
    }

    return map;
  }, [dailyBills]);

  const shopRows = useMemo<ShopDashboardRow[]>(() => {
    return shops.map((shop) => {
      const latestBill = latestBillByShopId.get(shop.id);
      const payment = paymentsByShopId.get(shop.id);
      const sales = salesByShopId.get(shop.id);
      const billCount = dailyBills.filter((bill) => bill.shop_id === shop.id).length;
      const lastActivityAt = latestBill?.created_at ?? shop.created_at;

      return {
        shop,
        totalSales: sales?.totalSales ?? "0",
        cashTotal: payment?.cashTotal ?? "0",
        upiTotal: payment?.upiTotal ?? "0",
        billCount,
        lastActivityAt,
        status: getShopStatus(shop, lastActivityAt),
      };
    });
  }, [dailyBills, latestBillByShopId, paymentsByShopId, salesByShopId, shops]);

  const filteredShopRows = useMemo(() => {
    const rows = shopRows
      .filter((item) => {
        if (shopFilter === "active" && !item.shop.is_active) {
          return false;
        }

        if (shopFilter === "inactive" && item.shop.is_active) {
          return false;
        }

        if (!deferredShopQuery) {
          return true;
        }

        const searchable = `${item.shop.name} ${item.shop.code} ${item.shop.username}`.toLowerCase();
        return searchable.includes(deferredShopQuery);
      })
      .sort((left, right) => {
        if (shopSort === "name") {
          return left.shop.name.localeCompare(right.shop.name);
        }

        if (shopSort === "activity") {
          return new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime();
        }

        return money(right.totalSales).minus(left.totalSales).toNumber();
      });

    if (!focusedShopId) {
      return rows;
    }

    return rows.filter((item) => item.shop.id === focusedShopId);
  }, [deferredShopQuery, focusedShopId, shopFilter, shopRows, shopSort]);

  const focusedShopName = focusedShopId
    ? shops.find((shop) => shop.id === focusedShopId)?.name ?? "Focused Shop"
    : null;

  const totalSales = salesSummary.reduce((sum, item) => sum.plus(money(item.total_sales)), money(0));
  const totalCash = paymentSummary.reduce((sum, item) => sum.plus(money(item.cash_total)), money(0));
  const totalUpi = paymentSummary.reduce((sum, item) => sum.plus(money(item.upi_total)), money(0));
  const totalBillsValue = dailyBills.reduce((sum, item) => sum.plus(money(item.total_amount)), money(0));
  const averageBillValue = dailyBills.length > 0 ? totalBillsValue.div(dailyBills.length) : money(0);
  const topPerformer = [...shopRows].sort((left, right) => money(right.totalSales).minus(left.totalSales).toNumber())[0];
  const paymentTotal = totalCash.plus(totalUpi);
  const cashShare = paymentTotal.greaterThan(0) ? totalCash.div(paymentTotal).mul(100).toNumber() : 0;
  const upiShare = paymentTotal.greaterThan(0) ? totalUpi.div(paymentTotal).mul(100).toNumber() : 0;
  const activeShopsCount = shops.filter((shop) => shop.is_active).length;
  const severeLogsCount = auditLogs.filter((log) => {
    const severity = getSeverityMeta(log).label;
    return severity === "error" || severity === "critical";
  }).length;

  const healthSummary =
    severeLogsCount > 0
      ? { label: "Attention", note: `${severeLogsCount} issue logs`, tone: "warning" as const }
      : activeShopsCount === shops.length && shops.length > 0
        ? { label: "Healthy", note: "All shops are running", tone: "success" as const }
        : { label: "Stable", note: `${shops.length - activeShopsCount} shops disabled`, tone: "neutral" as const };

  const kpiCards = [
    {
      label: "Total Revenue",
      value: formatCompactCurrency(totalSales.toString()),
      icon: "cash-multiple",
      note: `${dailyBills.length} bills today`,
      tone: "primary" as const,
    },
    {
      label: "Active Shops",
      value: `${activeShopsCount}/${shops.length}`,
      icon: "store-check-outline",
      note: focusedShopName ? `Focused on ${focusedShopName}` : "Live shop network",
      tone: "success" as const,
    },
    {
      label: "Cash Collected",
      value: formatCompactCurrency(totalCash.toString()),
      icon: "cash",
      note: `${cashShare.toFixed(0)}% of collections`,
      tone: "neutral" as const,
    },
    {
      label: "UPI Collected",
      value: formatCompactCurrency(totalUpi.toString()),
      icon: "cellphone-nfc",
      note: `${upiShare.toFixed(0)}% digital`,
      tone: "neutral" as const,
    },
    {
      label: "Bills Today",
      value: `${dailyBills.length}`,
      icon: "receipt-text-outline",
      note: `Avg ${formatCompactCurrency(averageBillValue.toString())}`,
      tone: "neutral" as const,
    },
    {
      label: "Operational Health",
      value: healthSummary.label,
      icon: healthSummary.tone === "warning" ? "alert-circle-outline" : "shield-check-outline",
      note: healthSummary.note,
      tone: healthSummary.tone,
    },
  ];

  const filteredBills = useMemo(() => {
    const source = focusedShopId ? dailyBills.filter((bill) => bill.shop_id === focusedShopId) : dailyBills;

    return source.filter((bill) => {
      if (!deferredBillQuery) {
        return true;
      }

      const searchable = `${bill.bill_no} ${bill.shop_name} ${bill.status}`.toLowerCase();
      return searchable.includes(deferredBillQuery);
    });
  }, [dailyBills, deferredBillQuery, focusedShopId]);

  const analyticsRevenueRows = useMemo(() => {
    const source = focusedShopId ? shopRows.filter((row) => row.shop.id === focusedShopId) : shopRows;
    return [...source]
      .sort((left, right) => money(right.totalSales).minus(left.totalSales).toNumber())
      .slice(0, 5);
  }, [focusedShopId, shopRows]);

  const maxRevenue = analyticsRevenueRows.reduce(
    (largest, row) => Math.max(largest, money(row.totalSales).toNumber()),
    0,
  );

  const hourlyTrend = useMemo(() => {
    const buckets = Array.from({ length: 8 }, (_, index) => ({
      label: `${index + 9}:00`,
      total: 0,
      count: 0,
    }));

    for (const bill of filteredBills) {
      const hour = new Date(bill.created_at).getHours();
      if (hour < 9 || hour > 16) {
        continue;
      }

      const bucket = buckets[hour - 9];
      bucket.total += money(bill.total_amount).toNumber();
      bucket.count += 1;
    }

    return buckets;
  }, [filteredBills]);

  const maxHourlyTotal = hourlyTrend.reduce((largest, item) => Math.max(largest, item.total), 0);

  const filteredAuditLogs = useMemo(() => {
    const source = focusedShopId && focusedShopName
      ? auditLogs.filter((log) => `${log.action} ${log.details}`.toLowerCase().includes(focusedShopName.toLowerCase()))
      : auditLogs;

    return source.filter((log) => {
      const severity = getSeverityMeta(log);
      const matchesSeverity = severityFilter === "all" || severity.label === severityFilter;
      const matchesQuery =
        !deferredAuditQuery ||
        `${log.action} ${log.details}`.toLowerCase().includes(deferredAuditQuery);

      return matchesSeverity && matchesQuery;
    });
  }, [auditLogs, deferredAuditQuery, focusedShopId, focusedShopName, severityFilter]);

  const priceItems = useMemo(() => {
    if (!priceBootstrap) {
      return [];
    }

    return priceBootstrap.items.filter((item) => {
      if (!deferredPriceSearch) {
        return true;
      }

      return `${item.item_name} ${item.base_unit}`.toLowerCase().includes(deferredPriceSearch);
    });
  }, [deferredPriceSearch, priceBootstrap]);

  const modifiedPriceCount = useMemo(() => {
    if (!priceBootstrap) {
      return 0;
    }

    return priceBootstrap.items.filter((item) => {
      const current = item.current_price ?? "";
      const next = priceValues[`price_${item.item_id}`] ?? "";
      return next.trim() !== current.trim();
    }).length;
  }, [priceBootstrap, priceValues]);

  const topSlot = (
    <View className="w-full max-w-[768px] self-center gap-3">
      <View className="rounded-[28px] border border-border bg-card px-4 py-4 shadow-soft">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-accentDeep">Admin Console</Text>
            <Text className="mt-1 text-base font-semibold text-ink">Operations command center</Text>
            <Text className="mt-1 text-xs text-muted">
              {lastSyncAt ? `Last sync ${formatRelativeTime(lastSyncAt)}` : "Syncing business data..."}
            </Text>
          </View>
          <View className="flex-row items-center gap-2 rounded-full bg-successSoft px-3 py-2">
            <View className="h-2.5 w-2.5 rounded-full bg-green-700" />
            <Text className="text-xs font-semibold text-green-900">LIVE</Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ paddingRight: 8 }}
        >
          <ActionChip label="Create Shop" icon="store-plus-outline" onPress={() => setModalOpen(true)} tone="primary" />
          <ActionChip label="Update Prices" icon="cash-edit" onPress={() => void openPricePanel()} />
          <ActionChip label="Refresh" icon="refresh" onPress={() => void loadDashboard(true)} />
          {focusedShopId ? (
            <ActionChip label="Clear Focus" icon="target-remove" onPress={() => focusShop(null)} />
          ) : null}
        </ScrollView>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingState fullscreen label="Loading admin dashboard..." />;
  }

  return (
    <>
      <Screen refreshing={refreshing} onRefresh={() => void loadDashboard(true)} topSlot={topSlot}>
        <View className="gap-4">
          <Card className="gap-5 overflow-hidden bg-card p-0">
            <View className="rounded-[30px] bg-accent px-5 py-5">
              <View className="flex-row flex-wrap items-start justify-between gap-3">
                <View className="min-w-[220px] flex-1 gap-3">
                  <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-white/75">Today&apos;s Operations</Text>
                  <Text className="text-[30px] font-bold leading-[38px] text-white">
                    One place to watch revenue, shop availability, payments, and critical activity.
                  </Text>
                  <Text className="text-sm leading-6 text-white/85">
                    Designed for quick decisions during live business hours with compact signals and faster scanning.
                  </Text>
                </View>
                <Card className="min-w-[220px] gap-3 border-white/10 bg-white/95 shadow-none">
                  <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted">Command Summary</Text>
                  <View className="flex-row flex-wrap gap-3">
                    <View className="min-w-[96px] flex-1 gap-1">
                      <Text className="text-xs text-muted">Top performer</Text>
                      <Text className="text-base font-semibold text-ink">
                        {topPerformer ? topPerformer.shop.name : "No sales yet"}
                      </Text>
                    </View>
                    <View className="min-w-[96px] flex-1 gap-1">
                      <Text className="text-xs text-muted">Largest bill</Text>
                      <Text className="text-base font-semibold text-ink">
                        {dailyBills[0] ? formatCompactCurrency(dailyBills[0].total_amount) : "Rs. 0"}
                      </Text>
                    </View>
                  </View>
                </Card>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-3 px-5 pb-5">
              {kpiCards.map((item) => (
                <OverviewCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                  note={item.note}
                  tone={item.tone}
                />
              ))}
            </View>
          </Card>

          <SectionCard
            eyebrow="Shop Management Center"
            title="Operational shop control"
            subtitle="Search, filter, sort, and manage shops without losing context."
            collapsed={!expandedSections.shops}
            onToggle={() => toggleSection("shops")}
            rightSlot={
              focusedShopName ? (
                <StatusPill label={`Focused: ${focusedShopName}`} tone="neutral" />
              ) : (
                <StatusPill label={`${filteredShopRows.length} visible shops`} tone="neutral" />
              )
            }
          >
            <View className="gap-4">
              <SearchField
                value={shopQuery}
                onChangeText={setShopQuery}
                placeholder="Search by shop name, code, or username"
              />

              <View className="gap-3">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2 pr-4">
                    <FilterChip label="All shops" active={shopFilter === "all"} onPress={() => setShopFilter("all")} icon="view-grid-outline" />
                    <FilterChip label="Active" active={shopFilter === "active"} onPress={() => setShopFilter("active")} icon="check-decagram-outline" />
                    <FilterChip label="Inactive" active={shopFilter === "inactive"} onPress={() => setShopFilter("inactive")} icon="pause-circle-outline" />
                  </View>
                </ScrollView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2 pr-4">
                    <FilterChip label="Sort: Revenue" active={shopSort === "revenue"} onPress={() => setShopSort("revenue")} icon="finance" />
                    <FilterChip label="Sort: Name" active={shopSort === "name"} onPress={() => setShopSort("name")} icon="sort-alphabetical-ascending" />
                    <FilterChip label="Sort: Activity" active={shopSort === "activity"} onPress={() => setShopSort("activity")} icon="history" />
                  </View>
                </ScrollView>
              </View>

              {filteredShopRows.length === 0 ? (
                <EmptyState
                  title="No shops match these filters"
                  description="Try another search, clear the focus state, or create a new shop account."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setShopQuery("");
                    setShopFilter("all");
                    setShopSort("revenue");
                    focusShop(null);
                  }}
                />
              ) : (
                filteredShopRows.map((item) => {
                  const statusTone =
                    item.status === "ACTIVE"
                      ? "success"
                      : item.status === "IDLE"
                        ? "warning"
                        : item.status === "DISABLED"
                          ? "danger"
                          : "neutral";
                  const isExpanded = expandedShopId === item.shop.id;

                  return (
                    <Card key={item.shop.id} className="gap-4">
                      <Pressable onPress={() => toggleShopRow(item.shop.id)} className="gap-4">
                        <View className="flex-row flex-wrap items-start justify-between gap-3">
                          <View className="min-w-[180px] flex-1 gap-2">
                            <View className="flex-row flex-wrap items-center gap-2">
                              <Text className="text-lg font-semibold text-ink">{item.shop.name}</Text>
                              <StatusPill label={item.status} tone={statusTone} />
                            </View>
                            <View className="flex-row flex-wrap gap-2">
                              <View className="rounded-full bg-surface px-3 py-1">
                                <Text className="text-xs font-semibold text-muted">{item.shop.code}</Text>
                              </View>
                              <View className="rounded-full bg-surface px-3 py-1">
                                <Text className="text-xs font-semibold text-muted">{item.shop.username}</Text>
                              </View>
                            </View>
                          </View>
                          <View className="items-end gap-1">
                            <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">Today Sales</Text>
                            <Text className="text-xl font-bold text-ink">{formatCurrency(item.totalSales)}</Text>
                            <Text className="text-xs text-muted">{formatRelativeTime(item.lastActivityAt)}</Text>
                          </View>
                        </View>

                        <View className={cn("flex-row flex-wrap gap-3", isTablet ? "" : "")}>
                          <View className="min-w-[120px] flex-1 rounded-[22px] bg-surface px-4 py-3">
                            <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">Bills</Text>
                            <Text className="mt-1 text-lg font-semibold text-ink">{item.billCount}</Text>
                          </View>
                          <View className="min-w-[120px] flex-1 rounded-[22px] bg-surface px-4 py-3">
                            <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">Cash</Text>
                            <Text className="mt-1 text-lg font-semibold text-ink">{formatCompactCurrency(item.cashTotal)}</Text>
                          </View>
                          <View className="min-w-[120px] flex-1 rounded-[22px] bg-surface px-4 py-3">
                            <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">UPI</Text>
                            <Text className="mt-1 text-lg font-semibold text-ink">{formatCompactCurrency(item.upiTotal)}</Text>
                          </View>
                        </View>
                      </Pressable>

                      <View className="flex-row items-center justify-between gap-3 rounded-[22px] border border-border bg-surface px-4 py-3">
                        <View className="flex-1 gap-1">
                          <Text className="text-sm font-semibold text-ink">Shop access</Text>
                          <Text className="text-xs text-muted">Keep operations live or temporarily disable this login.</Text>
                        </View>
                        <View>
                          <Switch
                            value={item.shop.is_active}
                            onValueChange={(value) => void handleToggleShop(item.shop, value)}
                            trackColor={{ false: "#D6E5D8", true: "#86EFAC" }}
                            thumbColor={item.shop.is_active ? "#166534" : "#FFFFFF"}
                          />
                        </View>
                      </View>

                      {isExpanded ? (
                        <View className="gap-3 rounded-[24px] border border-border bg-surface px-4 py-4">
                          <View className="flex-row flex-wrap gap-2">
                            <FilterChip
                              label="Focus Analytics"
                              active={focusedShopId === item.shop.id}
                              onPress={() => focusShop(focusedShopId === item.shop.id ? null : item.shop.id)}
                              icon="chart-box-outline"
                            />
                            <FilterChip
                              label="Open Bills Feed"
                              active={focusedShopId === item.shop.id}
                              onPress={() => focusShop(item.shop.id)}
                              icon="receipt-text-search-outline"
                            />
                            <FilterChip
                              label={item.shop.is_active ? "Disable Shop" : "Enable Shop"}
                              active={false}
                              onPress={() => void handleToggleShop(item.shop, !item.shop.is_active)}
                              icon={item.shop.is_active ? "pause-circle-outline" : "play-circle-outline"}
                            />
                          </View>
                          <View className="flex-row flex-wrap gap-3">
                            <View className="min-w-[150px] flex-1">
                              <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">Last Activity</Text>
                              <Text className="mt-1 text-sm font-semibold text-ink">{formatDateTime(item.lastActivityAt)}</Text>
                            </View>
                            <View className="min-w-[150px] flex-1">
                              <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">Created</Text>
                              <Text className="mt-1 text-sm font-semibold text-ink">{formatDateTime(item.shop.created_at)}</Text>
                            </View>
                          </View>
                        </View>
                      ) : null}
                    </Card>
                  );
                })
              )}
            </View>
          </SectionCard>

          <SectionCard
            eyebrow="Price Management"
            title="Global price update"
            subtitle="Update today's prices for all shops directly from the dashboard."
            collapsed={!expandedSections.pricing}
            onToggle={() => {
              if (expandedSections.pricing) {
                toggleSection("pricing");
                return;
              }

              void openPricePanel();
            }}
            rightSlot={
              <StatusPill
                label={
                  priceLoading
                    ? "Loading prices"
                    : priceBootstrap
                      ? `${modifiedPriceCount} modified`
                      : "Ready to load"
                }
                tone={priceLoading ? "warning" : "neutral"}
              />
            }
          >
            {priceLoading ? (
              <LoadingState fullscreen={false} label="Loading price controls..." />
            ) : priceBootstrap ? (
              <View className="gap-4">
                <View className="flex-row flex-wrap gap-3">
                  <View className="min-w-[180px] flex-1 rounded-[24px] bg-surface px-4 py-4">
                    <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">Items Priced</Text>
                    <Text className="mt-1 text-2xl font-bold text-ink">{priceBootstrap.items.length}</Text>
                    <Text className="mt-1 text-xs text-muted">Global list for all shops</Text>
                  </View>
                  <View className="min-w-[180px] flex-1 rounded-[24px] bg-surface px-4 py-4">
                    <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">Modified Rows</Text>
                    <Text className="mt-1 text-2xl font-bold text-ink">{modifiedPriceCount}</Text>
                    <Text className="mt-1 text-xs text-muted">Unsaved changes in progress</Text>
                  </View>
                </View>

                <SearchField
                  value={priceSearch}
                  onChangeText={setPriceSearch}
                  placeholder="Search items by name or unit"
                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2 pr-4">
                    <FilterChip label="+5%" active={false} onPress={() => applyBulkAdjustment(1.05)} icon="trending-up" />
                    <FilterChip label="+10%" active={false} onPress={() => applyBulkAdjustment(1.1)} icon="trending-up" />
                    <FilterChip label="-5%" active={false} onPress={() => applyBulkAdjustment(0.95)} icon="trending-down" />
                    <FilterChip label="Reset" active={false} onPress={resetPriceChanges} icon="restore" />
                    <FilterChip label="Reload" active={false} onPress={() => void openPricePanel(true)} icon="refresh" />
                  </View>
                </ScrollView>

                {priceItems.length === 0 ? (
                  <EmptyState
                    title="No items match this search"
                    description="Try another keyword to find the price entry you want to change."
                    actionLabel="Clear Search"
                    onAction={() => setPriceSearch("")}
                  />
                ) : (
                  <View className="gap-3">
                    {priceItems.map((item) => {
                      const fieldName = `price_${item.item_id}`;
                      const inputValue = priceValues[fieldName] ?? item.current_price ?? "";
                      const originalValue = item.current_price ?? "";
                      const isModified = inputValue.trim() !== originalValue.trim();
                      const originalAmount = originalValue ? money(originalValue) : money(0);
                      const nextAmount = inputValue ? money(inputValue) : money(0);
                      const difference = nextAmount.minus(originalAmount);
                      const hasDifference = isModified && !difference.isZero();

                      return (
                        <Card
                          key={item.item_id}
                          className={cn("gap-3", isModified ? "border-accent bg-accentSoft/40" : "")}
                        >
                          <View className="flex-row flex-wrap items-start justify-between gap-3">
                            <View className="min-w-[160px] flex-1 gap-1">
                              <Text className="text-base font-semibold text-ink">{item.item_name}</Text>
                              <Text className="text-sm text-muted">Unit: {item.base_unit}</Text>
                            </View>
                            {isModified ? (
                              <StatusPill
                                label={hasDifference ? `${difference.greaterThan(0) ? "+" : ""}${difference.toFixed(2)}` : "Modified"}
                                tone={hasDifference ? (difference.greaterThan(0) ? "success" : "warning") : "neutral"}
                              />
                            ) : (
                              <StatusPill label="Current" tone="neutral" />
                            )}
                          </View>

                          <View className="flex-row flex-wrap gap-3">
                            <View className="min-w-[120px] flex-1 rounded-[20px] bg-surface px-4 py-3">
                              <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">Previous</Text>
                              <Text className="mt-1 text-sm font-semibold text-ink">
                                {originalValue ? formatCurrency(originalValue) : "Not set"}
                              </Text>
                            </View>
                            <View className="min-w-[180px] flex-[1.2]">
                              <Controller
                                control={priceForm.control}
                                name={fieldName}
                                render={({ field }) => (
                                  <TextField
                                    label="Current price"
                                    keyboardType="decimal-pad"
                                    value={field.value}
                                    onChangeText={field.onChange}
                                    suffix={item.base_unit}
                                  />
                                )}
                              />
                            </View>
                          </View>
                        </Card>
                      );
                    })}
                  </View>
                )}

                <View className="rounded-[26px] border border-border bg-white px-4 py-4 shadow-pos">
                  <View className="mb-3 flex-row flex-wrap items-center justify-between gap-3">
                    <View>
                      <Text className="text-sm font-semibold text-ink">Ready to save</Text>
                      <Text className="text-xs text-muted">
                        {modifiedPriceCount} modified {modifiedPriceCount === 1 ? "item" : "items"}
                      </Text>
                    </View>
                    <StatusPill
                      label={priceBootstrap.items.length ? `${priceBootstrap.items.length} total items` : "No items"}
                      tone="neutral"
                    />
                  </View>
                  <Button label="Save Prices" onPress={priceForm.handleSubmit(handleSavePrices)} />
                </View>
              </View>
            ) : (
              <EmptyState
                title="Price controls not loaded"
                description="Load today's global prices to review and update item rates for all shops."
                actionLabel="Load Prices"
                onAction={() => void openPricePanel(true)}
              />
            )}
          </SectionCard>

          <SectionCard
            eyebrow="Revenue & Payment Analytics"
            title="Live financial picture"
            subtitle="Revenue rankings, payment mix, and transaction tempo in one compact view."
            collapsed={!expandedSections.analytics}
            onToggle={() => toggleSection("analytics")}
            rightSlot={<StatusPill label={focusedShopName ? focusedShopName : "All shops"} tone="neutral" />}
          >
            <View className={cn("gap-4", isTablet && "flex-row flex-wrap")}>
              <AnalyticsCard
                title="Revenue leaderboard"
                subtitle="Quick comparison across today's best-performing shops."
                className={isTablet ? "basis-[48%]" : undefined}
              >
                {analyticsRevenueRows.length === 0 ? (
                  <EmptyState
                    title="No sales data"
                    description="Revenue charts will appear here once shops start billing."
                  />
                ) : (
                  analyticsRevenueRows.map((item) => {
                    const widthPercent = maxRevenue > 0 ? (money(item.totalSales).toNumber() / maxRevenue) * 100 : 0;
                    return (
                      <View key={item.shop.id} className="gap-2">
                        <View className="flex-row items-center justify-between gap-3">
                          <Text className="flex-1 text-sm font-semibold text-ink">{item.shop.name}</Text>
                          <Text className="text-sm font-semibold text-ink">{formatCompactCurrency(item.totalSales)}</Text>
                        </View>
                        <View className="h-3 rounded-full bg-surface">
                          <View className="h-3 rounded-full bg-accent" style={{ width: `${Math.max(widthPercent, 8)}%` }} />
                        </View>
                      </View>
                    );
                  })
                )}
              </AnalyticsCard>

              <AnalyticsCard
                title="Payment split"
                subtitle="Cash and UPI distribution across the current billing day."
                className={isTablet ? "basis-[48%]" : undefined}
              >
                <View className="gap-4">
                  <View className="h-4 overflow-hidden rounded-full bg-surface">
                    <View className="h-4 bg-accent" style={{ width: `${cashShare}%` }} />
                    <View className="absolute right-0 top-0 h-4 bg-green-300" style={{ width: `${upiShare}%` }} />
                  </View>
                  <View className="flex-row flex-wrap gap-3">
                    <View className="min-w-[140px] flex-1 rounded-[22px] bg-surface px-4 py-3">
                      <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">Cash</Text>
                      <Text className="mt-1 text-xl font-bold text-ink">{formatCurrency(totalCash.toString())}</Text>
                      <Text className="mt-1 text-xs text-muted">{cashShare.toFixed(0)}% share</Text>
                    </View>
                    <View className="min-w-[140px] flex-1 rounded-[22px] bg-surface px-4 py-3">
                      <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">UPI</Text>
                      <Text className="mt-1 text-xl font-bold text-ink">{formatCurrency(totalUpi.toString())}</Text>
                      <Text className="mt-1 text-xs text-muted">{upiShare.toFixed(0)}% share</Text>
                    </View>
                  </View>
                </View>
              </AnalyticsCard>

              <AnalyticsCard
                title="Hourly billing trend"
                subtitle="A lightweight read on transaction flow through the day."
                className={isTablet ? "basis-[48%]" : undefined}
              >
                <View className="flex-row items-end justify-between gap-2">
                  {hourlyTrend.map((point) => {
                    const heightPercent = maxHourlyTotal > 0 ? (point.total / maxHourlyTotal) * 100 : 0;
                    return (
                      <View key={point.label} className="flex-1 items-center gap-2">
                        <Text className="text-[10px] text-muted">{point.count}</Text>
                        <View className="h-24 w-full items-center justify-end rounded-[18px] bg-surface px-1 pb-2">
                          <View
                            className="w-full rounded-full bg-accent"
                            style={{ height: `${Math.max(heightPercent, point.total > 0 ? 12 : 0)}%` }}
                          />
                        </View>
                        <Text className="text-[10px] text-muted">{point.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </AnalyticsCard>

              <AnalyticsCard
                title="Revenue insights"
                subtitle="Useful business signals for quick decisions."
                className={isTablet ? "basis-[48%]" : undefined}
              >
                <View className="gap-4">
                  <View className="rounded-[22px] bg-surface px-4 py-4">
                    <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">Top shop</Text>
                    <Text className="mt-1 text-lg font-semibold text-ink">
                      {topPerformer ? topPerformer.shop.name : "No sales yet"}
                    </Text>
                    <Text className="mt-1 text-sm text-muted">
                      {topPerformer ? formatCurrency(topPerformer.totalSales) : "Revenue ranking will update once sales arrive."}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-3">
                    <View className="min-w-[140px] flex-1 rounded-[22px] bg-surface px-4 py-4">
                      <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">Average bill</Text>
                      <Text className="mt-1 text-lg font-semibold text-ink">{formatCurrency(averageBillValue.toString())}</Text>
                    </View>
                    <View className="min-w-[140px] flex-1 rounded-[22px] bg-surface px-4 py-4">
                      <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">Last sync</Text>
                      <Text className="mt-1 text-lg font-semibold text-ink">
                        {lastSyncAt ? formatShortTime(lastSyncAt) : "--"}
                      </Text>
                    </View>
                  </View>
                </View>
              </AnalyticsCard>
            </View>
          </SectionCard>

          <SectionCard
            eyebrow="Activity & Monitoring"
            title="Recent bills and audit timeline"
            subtitle="Compact monitoring surfaces for transaction review and admin traceability."
            collapsed={!expandedSections.activity}
            onToggle={() => toggleSection("activity")}
            rightSlot={<StatusPill label={`${filteredBills.length} bills`} tone="neutral" />}
          >
            <View className={cn("gap-4", isTablet && "flex-row items-start")}>
              <View className="min-w-[280px] flex-1 gap-4">
                <AnalyticsCard title="Daily bills feed" subtitle="Filter recent receipts and drill into individual transactions.">
                  <View className="gap-4">
                    <SearchField
                      value={billQuery}
                      onChangeText={setBillQuery}
                      placeholder="Search bills by number, shop, or status"
                    />
                    {filteredBills.length === 0 ? (
                      <EmptyState
                        title="No matching bills"
                        description="Clear the focused shop or search query to view more receipts."
                        actionLabel="Clear Bill Filters"
                        onAction={() => {
                          setBillQuery("");
                          focusShop(null);
                        }}
                      />
                    ) : (
                      filteredBills.slice(0, 12).map((bill) => {
                        const expanded = expandedBillId === bill.bill_id;
                        return (
                          <Pressable key={bill.bill_id} onPress={() => toggleBillRow(bill.bill_id)}>
                            <View className="border-l-2 border-accent pl-4">
                              <View className="rounded-[22px] bg-surface px-4 py-4">
                                <View className="flex-row flex-wrap items-center justify-between gap-3">
                                  <View className="min-w-[140px] flex-1 gap-1">
                                    <Text className="text-base font-semibold text-ink">{bill.bill_no}</Text>
                                    <Text className="text-sm text-muted">{bill.shop_name}</Text>
                                  </View>
                                  <View className="items-end gap-1">
                                    <Text className="text-lg font-bold text-ink">{formatCurrency(bill.total_amount)}</Text>
                                    <StatusPill label={bill.status} tone="success" />
                                  </View>
                                </View>
                                <Text className="mt-2 text-xs text-muted">{formatDateTime(bill.created_at)}</Text>
                                {expanded ? (
                                  <View className="mt-4 gap-3 border-t border-border pt-4">
                                    <View className="flex-row flex-wrap gap-2">
                                      <FilterChip label="Focus Shop" active={focusedShopId === bill.shop_id} onPress={() => focusShop(bill.shop_id)} icon="target-account" />
                                      <FilterChip label="View Revenue Context" active={focusedShopId === bill.shop_id} onPress={() => focusShop(bill.shop_id)} icon="chart-line" />
                                    </View>
                                    <Text className="text-sm leading-6 text-muted">
                                      Recorded at {formatShortTime(bill.created_at)} and currently marked as {bill.status.toLowerCase()}.
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                            </View>
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                </AnalyticsCard>
              </View>

              <View className="min-w-[280px] flex-1 gap-4">
                <AnalyticsCard title="Audit timeline" subtitle="Severity-aware monitoring for admin operations and exceptions.">
                  <View className="gap-4">
                    <SearchField
                      value={auditQuery}
                      onChangeText={setAuditQuery}
                      placeholder="Search actions, events, or keywords"
                    />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row gap-2 pr-4">
                        <FilterChip label="All" active={severityFilter === "all"} onPress={() => setSeverityFilter("all")} icon="tune-variant" />
                        <FilterChip label="Info" active={severityFilter === "info"} onPress={() => setSeverityFilter("info")} icon="information-outline" />
                        <FilterChip label="Warning" active={severityFilter === "warning"} onPress={() => setSeverityFilter("warning")} icon="alert-outline" />
                        <FilterChip label="Error" active={severityFilter === "error"} onPress={() => setSeverityFilter("error")} icon="alert-circle-outline" />
                        <FilterChip label="Critical" active={severityFilter === "critical"} onPress={() => setSeverityFilter("critical")} icon="alert-decagram-outline" />
                      </View>
                    </ScrollView>
                    {filteredAuditLogs.length === 0 ? (
                      <EmptyState
                        title="No audit events found"
                        description="Adjust the search query or severity filter to view more operational history."
                        actionLabel="Reset Audit Filters"
                        onAction={() => {
                          setAuditQuery("");
                          setSeverityFilter("all");
                        }}
                      />
                    ) : (
                      filteredAuditLogs.slice(0, 10).map((log) => {
                        const severity = getSeverityMeta(log);
                        return (
                          <View key={log.id} className="flex-row gap-3">
                            <View className="items-center">
                              <View className={cn("rounded-full border p-2", severity.accentClassName)}>
                                <MaterialCommunityIcons name={severity.icon} size={18} color={severity.tone === "danger" ? "#9F4335" : severity.tone === "warning" ? "#A36A20" : "#244734"} />
                              </View>
                              <View className="mt-2 h-full w-px flex-1 bg-border" />
                            </View>
                            <View className="flex-1 gap-2 rounded-[22px] bg-surface px-4 py-4">
                              <View className="flex-row flex-wrap items-center justify-between gap-2">
                                <Text className="flex-1 text-sm font-semibold uppercase tracking-[1px] text-ink">{log.action}</Text>
                                <StatusPill label={severity.label} tone={severity.tone} />
                              </View>
                              <Text className="text-sm leading-6 text-muted">{log.details}</Text>
                              <Text className="text-xs text-muted">{formatDateTime(log.created_at)}</Text>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                </AnalyticsCard>
              </View>
            </View>
          </SectionCard>
        </View>
      </Screen>

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/30">
          <View className="max-h-[90%] rounded-t-[32px] bg-card p-5">
            <View className="mb-4 flex-row flex-wrap items-start justify-between gap-3">
              <View className="flex-1">
                <SectionHeading
                  eyebrow="New Account"
                  title="Create Shop"
                  subtitle="Launch a new shop account without leaving the dashboard."
                />
              </View>
              <Button label="Close" onPress={() => setModalOpen(false)} variant="secondary" size="sm" />
            </View>
            <View className="gap-4">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Shop name"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="code"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Shop code (optional)"
                    autoCapitalize="characters"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Button
                label="Create Shop Account"
                onPress={form.handleSubmit(handleCreateShop)}
                loading={creating}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

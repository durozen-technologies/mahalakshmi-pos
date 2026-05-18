import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuthStore } from "@/store/auth-store";
import { useAdminThemeStore } from "@/store/admin-theme-store";
import { useCartStore } from "@/store/cart-store";
import { usePriceStore } from "@/store/price-store";
import type { AnalyticsPeriod, BillRead, ShopRead } from "@/types/api";
import { isPositiveNumber, money, toMoneyString } from "@/utils/decimal";
import { formatCurrency, formatDateTime } from "@/utils/format";

import {
  adminShadow,
  getAdminPalette,
} from "./admin-dashboard-theme";
import {
  BottomNav,
  ChipButton,
  DashboardSkeleton,
  EmptyStateCard,
  MetricCard,
  PrimaryButton,
  SearchField,
  SectionCard,
  ToastBanner,
  TopAppBar,
} from "./components/admin-dashboard-primitives";
import {
  BillPreviewSheet,
  PriceUpdateSheet,
  ShopEditorSheet,
} from "./components/admin-dashboard-sheets";
import { useAdminDashboardData } from "./hooks/use-admin-dashboard-data";
import {
  buildDateOptions,
  buildMonthOptions,
  buildYearOptions,
  formatAnalyticsReference,
  formatCompactCurrency,
  formatRelativeTime,
  getUnitLabel,
  groupBillsByDate,
  NAV_ITEMS,
  triggerHaptic,
  type AdminNavTab,
  type AnalyticsSectionKey,
  type SectionKey,
  type ToastTone,
} from "./admin-dashboard-utils";

const createShopSchema = z.object({
  name: z.string().min(2, "Shop name is required"),
  username: z.string().min(3, "Login username is required").max(50, "Username is too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
});

const editShopSchema = z.object({
  name: z.string().min(2, "Shop name is required"),
  username: z.string().min(3, "Login username is required").max(50, "Username is too long"),
  password: z
    .string()
    .max(128, "Password is too long")
    .refine((value) => value.trim() === "" || value.trim().length >= 8, "Password must be at least 8 characters"),
});

type CreateShopFormValues = z.infer<typeof createShopSchema>;
type EditShopFormValues = z.infer<typeof editShopSchema>;

const PERIOD_OPTIONS: { key: AnalyticsPeriod; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

function isNewArchitectureEnabled() {
  return Boolean((globalThis as typeof globalThis & { nativeFabricUIManager?: unknown }).nativeFabricUIManager);
}

export function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme();
  const { width: windowWidth } = useWindowDimensions();
  const themePreference = useAdminThemeStore((state) => state.themePreference);
  const setThemePreference = useAdminThemeStore((state) => state.setThemePreference);
  const colorScheme = themePreference === "system" ? systemColorScheme ?? "light" : themePreference;
  const palette = getAdminPalette(colorScheme);
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const yearOptions = useMemo(() => buildYearOptions(), []);
  const heroPrimaryTextColor = palette.textPrimary;
  const heroSecondaryTextColor = palette.textSecondary;
  const heroLabelTextColor = palette.textMuted;
  const clearSession = useAuthStore((state) => state.clearSession);
  const resetCart = useCartStore((state) => state.resetCart);
  const clearPrices = usePriceStore((state) => state.clear);

  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>("date");
  const [analyticsReferenceDate, setAnalyticsReferenceDate] = useState(
    dateOptions[0]?.value ?? new Date().toISOString().slice(0, 10),
  );
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [shopSelectorOpen, setShopSelectorOpen] = useState(false);
  const [referencePickerOpen, setReferencePickerOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<AdminNavTab>("dashboard");
  const [itemSearch, setItemSearch] = useState("");
  const [billSearch, setBillSearch] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<AnalyticsSectionKey, boolean>>({
    inventory: false,
    billing: true,
    settings: true,
  });
  const [createShopOpen, setCreateShopOpen] = useState(false);
  const [manageShopOpen, setManageShopOpen] = useState(false);
  const [selectedManagedShop, setSelectedManagedShop] = useState<ShopRead | null>(null);
  const [creating, setCreating] = useState(false);
  const [updatingShop, setUpdatingShop] = useState(false);
  const [deletingShopId, setDeletingShopId] = useState<number | null>(null);
  const [statusUpdatingShopId, setStatusUpdatingShopId] = useState<number | null>(null);
  const [priceSheetOpen, setPriceSheetOpen] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [selectedPriceItemId, setSelectedPriceItemId] = useState<number | null>(null);
  const [priceSelectedShopId, setPriceSelectedShopId] = useState<number | null>(null);
  const [priceShopPickerOpen, setPriceShopPickerOpen] = useState(false);
  const [draftPrices, setDraftPrices] = useState<Record<number, string>>({});
  const [effectiveDate, setEffectiveDate] = useState(dateOptions[0]?.value ?? new Date().toISOString().slice(0, 10));
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: ToastTone; message: string } | null>(null);
  const [billPreviewOpen, setBillPreviewOpen] = useState(false);
  const [billPreviewLoading, setBillPreviewLoading] = useState(false);
  const [selectedBillPreview, setSelectedBillPreview] = useState<BillRead | null>(null);
  const [printingAll, setPrintingAll] = useState(false);
  const [sectionOffsets, setSectionOffsets] = useState<Record<SectionKey, number>>({
    dashboard: 0,
    inventory: 0,
    billing: 0,
    settings: 0,
  });

  const debouncedItemSearch = useDebouncedValue(itemSearch.trim().toLowerCase());
  const debouncedBillSearch = useDebouncedValue(billSearch.trim().toLowerCase());
  const toastAnimation = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const latestDashboardError = useRef<string | null>(null);

  const createForm = useForm<CreateShopFormValues>({
    resolver: zodResolver(createShopSchema),
    defaultValues: { name: "", username: "", password: "" },
  });

  const manageForm = useForm<EditShopFormValues>({
    resolver: zodResolver(editShopSchema),
    defaultValues: { name: "", username: "", password: "" },
  });

  const {
    createBranch,
    dailyBills,
    dailyBillsHasMore,
    dailyBillsLoadingMore,
    dailyBillsTotalCount,
    dashboardError,
    isOfflineSnapshot,
    itemSales,
    largestBill,
    lastSyncAt,
    loadBillDetail,
    loadDashboard,
    loadMoreBills,
    loadPriceBootstrap,
    loadShopPriceBootstrap,
    loading,
    priceBootstrap,
    priceLoading,
    refreshing,
    saveGlobalPriceBook,
    saveShopPriceBook,
    selectedShopName,
    setPriceBootstrap,
    shops,
    deleteBranch,
    toggleBranchStatus,
    updateBranch,
    visibleShopRows,
  } = useAdminDashboardData({
    analyticsPeriod,
    analyticsReferenceDate,
    selectedShopId,
  });

  const showToast = useCallback((tone: ToastTone, message: string) => {
    setToast({ tone, message });
  }, []);

  const handleLogout = useCallback(() => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    clearSession();
    resetCart();
    clearPrices();
  }, [clearPrices, clearSession, resetCart]);

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      !isNewArchitectureEnabled() &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (!toast) {
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(toastAnimation, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast, toastAnimation]);

  useEffect(() => {
    if (!dashboardError || latestDashboardError.current === dashboardError) {
      return;
    }

    latestDashboardError.current = dashboardError;
    if (shops.length > 0) {
      showToast("error", dashboardError);
    }
  }, [dashboardError, shops.length, showToast]);

  useEffect(() => {
    if (!priceBootstrap) {
      return;
    }

    const nextItem = priceBootstrap.items.find((item) => item.item_id === selectedPriceItemId) ?? priceBootstrap.items[0];
    if (!nextItem) {
      return;
    }

    setSelectedPriceItemId(nextItem.item_id);
  }, [priceBootstrap, selectedPriceItemId]);

  const currentPriceItem = useMemo(
    () => priceBootstrap?.items.find((item) => item.item_id === selectedPriceItemId) ?? null,
    [priceBootstrap, selectedPriceItemId],
  );

  const resolvePriceDraft = useCallback(
    (itemId: number, currentPrice?: string | null) => draftPrices[itemId] ?? currentPrice ?? "",
    [draftPrices],
  );

  const draftPrice = useMemo(() => {
    if (!currentPriceItem) {
      return "";
    }

    return resolvePriceDraft(currentPriceItem.item_id, currentPriceItem.current_price);
  }, [currentPriceItem, resolvePriceDraft]);

  const unresolvedPriceItems = useMemo(() => {
    if (!priceBootstrap) {
      return [];
    }

    return priceBootstrap.items.filter((item) => !isPositiveNumber(resolvePriceDraft(item.item_id, item.current_price)));
  }, [priceBootstrap, resolvePriceDraft]);

  const saveDisabled = !priceSelectedShopId || !isPositiveNumber(draftPrice.trim()) || unresolvedPriceItems.length > 0;

  const priceHelperText = useMemo(() => {
    if (!priceBootstrap) {
      return null;
    }

    if (unresolvedPriceItems.length === 0) {
      return "Every active item has a valid price. You can save this update now.";
    }

    const itemNames = unresolvedPriceItems.map((item) => item.item_name);
    const preview = itemNames.slice(0, 3).join(", ");
    const suffix = itemNames.length > 3 ? `, +${itemNames.length - 3} more` : "";
    return `Add starting prices for all active items before saving. Remaining: ${preview}${suffix}.`;
  }, [priceBootstrap, unresolvedPriceItems]);

  const filteredItemSales = useMemo(() => {
    return itemSales.filter((item) => {
      if (!debouncedItemSearch) {
        return true;
      }

      return `${item.item_name} ${item.base_unit}`.toLowerCase().includes(debouncedItemSearch);
    });
  }, [debouncedItemSearch, itemSales]);

  const visibleBills = useMemo(() => {
    const scopedBills = selectedShopId ? dailyBills.filter((bill) => bill.shop_id === selectedShopId) : dailyBills;

    return scopedBills.filter((bill) => {
      const matchesQuery =
        !debouncedBillSearch ||
        `${bill.bill_no} ${bill.shop_name} ${bill.status}`.toLowerCase().includes(debouncedBillSearch);

      return matchesQuery;
    });
  }, [dailyBills, debouncedBillSearch, selectedShopId]);


  const totalRevenue = useMemo(
    () => visibleShopRows.reduce((sum, row) => sum.plus(money(row.totalSales)), money(0)),
    [visibleShopRows],
  );
  const totalCash = useMemo(
    () => visibleShopRows.reduce((sum, row) => sum.plus(money(row.cashTotal)), money(0)),
    [visibleShopRows],
  );
  const totalUpi = useMemo(
    () => visibleShopRows.reduce((sum, row) => sum.plus(money(row.upiTotal)), money(0)),
    [visibleShopRows],
  );
  const paymentTotal = useMemo(() => totalCash.plus(totalUpi), [totalCash, totalUpi]);
  const cashShare = paymentTotal.greaterThan(0) ? totalCash.div(paymentTotal).mul(100).toNumber() : 0;
  const topShop = useMemo(
    () => [...visibleShopRows].sort((left, right) => money(right.totalSales).minus(left.totalSales).toNumber())[0],
    [visibleShopRows],
  );
  const visibleBillCount = useMemo(
    () => (debouncedBillSearch ? visibleBills.length : dailyBillsTotalCount),
    [dailyBillsTotalCount, debouncedBillSearch, visibleBills.length],
  );
  const activeBranchCount = useMemo(
    () => visibleShopRows.filter((row) => row.shop.is_active).length,
    [visibleShopRows],
  );
  const itemRevenueAverage = useMemo(
    () =>
      filteredItemSales.length > 0
        ? filteredItemSales.reduce((sum, item) => sum.plus(money(item.total_amount)), money(0)).div(filteredItemSales.length).toNumber()
        : 0,
    [filteredItemSales],
  );
  const branchRanking = useMemo(() => {
    const rankMap = new Map<number, number>();
    [...visibleShopRows]
      .sort((left, right) => money(right.totalSales).minus(left.totalSales).toNumber())
      .forEach((row, index) => rankMap.set(row.shop.id, index + 1));

    return rankMap;
  }, [visibleShopRows]);
  const groupedBills = useMemo(() => groupBillsByDate(visibleBills), [visibleBills]);
  const billingSections = useMemo(
    () => groupedBills.map((group) => ({ title: group.label, data: group.entries })),
    [groupedBills],
  );
  const analyticsReferenceOptions = useMemo(() => {
    if (analyticsPeriod === "date") {
      return dateOptions;
    }

    if (analyticsPeriod === "month") {
      return monthOptions;
    }

    return yearOptions;
  }, [analyticsPeriod, dateOptions, monthOptions, yearOptions]);
  const analyticsReferenceLabel = useMemo(
    () => formatAnalyticsReference(analyticsPeriod, analyticsReferenceDate),
    [analyticsPeriod, analyticsReferenceDate],
  );
  const useCompactMetricCards = windowWidth < 420;
  const metricContextItems = useMemo(
    () => [
      {
        key: "range",
        icon: analyticsPeriod === "date" ? "calendar-today" : analyticsPeriod === "month" ? "calendar-month-outline" : "calendar-range-outline",
        label: "Range",
        value: analyticsReferenceLabel,
      },
      {
        key: "scope",
        icon: selectedShopId ? "storefront-outline" : "domain",
        label: "Scope",
        value: selectedShopName,
      },
      {
        key: "leader",
        icon: topShop ? "trophy-outline" : "chart-box-outline",
        label: topShop ? "Top Branch" : "Coverage",
        value: topShop ? topShop.shop.name : `${activeBranchCount}/${visibleShopRows.length} active branches`,
      },
    ],
    [
      activeBranchCount,
      analyticsPeriod,
      analyticsReferenceLabel,
      selectedShopId,
      selectedShopName,
      topShop,
      visibleShopRows.length,
    ],
  );
  const metricSparklineValues = useMemo(() => {
    const revenue = visibleShopRows
      .map((row) => money(row.totalSales).toNumber())
      .filter((value) => value > 0)
      .sort((left, right) => right - left)
      .slice(0, 6);
    const bills = visibleShopRows
      .map((row) => row.billCount)
      .filter((value) => value > 0)
      .sort((left, right) => right - left)
      .slice(0, 6);
    const cash = visibleShopRows
      .map((row) => money(row.cashTotal).toNumber())
      .filter((value) => value > 0)
      .sort((left, right) => right - left)
      .slice(0, 6);
    const upi = visibleShopRows
      .map((row) => money(row.upiTotal).toNumber())
      .filter((value) => value > 0)
      .sort((left, right) => right - left)
      .slice(0, 6);

    return {
      revenue: revenue.length > 0 ? revenue : [0],
      bills: bills.length > 0 ? bills : [0],
      cash: cash.length > 0 ? cash : [0],
      upi: upi.length > 0 ? upi : [0],
    };
  }, [visibleShopRows]);
  const metricCards = useMemo(
    () => [
      {
        key: "revenue",
        label: "Total Revenue",
        value: totalRevenue.toNumber(),
        formatter: (value: number) => formatCurrency(value),
        note: `${analyticsReferenceLabel} revenue`,
        noteIcon: "calendar-range" as const,
        icon: "cash-multiple" as const,
        accent: palette.emerald,
        accentSoft: palette.emeraldSoft,
        sparklineLabel: "Top branches",
        sparklineValues: metricSparklineValues.revenue,
      },
      {
        key: "bills",
        label: "Number of Bills",
        value: visibleBillCount,
        formatter: (value: number) => `${Math.round(value)} Bills`,
        note: largestBill ? `Largest ${formatCurrency(largestBill.total_amount)}` : `No bills in ${analyticsReferenceLabel}`,
        noteIcon: (largestBill ? "arrow-top-right" : "receipt-text-remove-outline") as React.ComponentProps<
          typeof MaterialCommunityIcons
        >["name"],
        icon: "receipt-text-outline" as const,
        accent: palette.gold,
        accentSoft: palette.goldSoft,
        sparklineLabel: "Branch volume",
        sparklineValues: metricSparklineValues.bills,
      },
      {
        key: "cash",
        label: "Cash Collection",
        value: totalCash.toNumber(),
        formatter: (value: number) => formatCurrency(value),
        note: `${cashShare.toFixed(0)}% of collections`,
        noteIcon: "percent-outline" as const,
        icon: "wallet-outline" as const,
        accent: palette.cash,
        accentSoft: palette.cashSoft,
        sparklineLabel: "Cash share",
        sparklineValues: metricSparklineValues.cash,
      },
      {
        key: "upi",
        label: "UPI Collection",
        value: totalUpi.toNumber(),
        formatter: (value: number) => formatCurrency(value),
        note: `${Math.max(0, 100 - cashShare).toFixed(0)}% digital mix`,
        noteIcon: "qrcode-scan" as const,
        icon: "qrcode-scan" as const,
        accent: palette.upi,
        accentSoft: palette.upiSoft,
        sparklineLabel: "Digital spread",
        sparklineValues: metricSparklineValues.upi,
      },
    ],
    [
      analyticsReferenceLabel,
      cashShare,
      largestBill,
      metricSparklineValues.bills,
      metricSparklineValues.cash,
      metricSparklineValues.revenue,
      metricSparklineValues.upi,
      palette.cash,
      palette.cashSoft,
      palette.emerald,
      palette.emeraldSoft,
      palette.gold,
      palette.goldSoft,
      palette.upi,
      palette.upiSoft,
      totalCash,
      totalRevenue,
      totalUpi,
      visibleBillCount,
    ],
  );

  function updateSectionOffset(section: SectionKey, y: number) {
    setSectionOffsets((current) => {
      if (current[section] === y) {
        return current;
      }

      return { ...current, [section]: y };
    });
  }

  function handleScrollNavigation(scrollY: number) {
    const marker = scrollY + 176;
    const orderedSections = NAV_ITEMS.map((item) => ({
      key: item.key as AdminNavTab,
      offset: sectionOffsets[item.key as SectionKey],
    })).sort((left, right) => left.offset - right.offset);

    let nextActive: AdminNavTab = "dashboard";
    for (const section of orderedSections) {
      if (marker >= section.offset) {
        nextActive = section.key;
      }
    }

    if (nextActive !== activeNav) {
      setActiveNav(nextActive);
    }
  }

  function scrollToSection(section: string) {
    const key = section as SectionKey;
    const target = Math.max(0, (sectionOffsets[key] ?? 0) - 140);
    scrollRef.current?.scrollTo({ y: target, animated: true });
    setActiveNav(section as AdminNavTab);
  }

  function toggleSection(section: AnalyticsSectionKey) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function handleSelectPeriod(period: AnalyticsPeriod) {
    if (period === analyticsPeriod) {
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    triggerHaptic();
    setAnalyticsPeriod(period);
    setReferencePickerOpen(false);

    const nextReferenceDate =
      period === "date"
        ? dateOptions[0]?.value
        : period === "month"
          ? monthOptions[0]?.value
          : yearOptions[0]?.value;

    if (nextReferenceDate) {
      setAnalyticsReferenceDate(nextReferenceDate);
    }
  }

  function toggleReferencePicker() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    triggerHaptic();
    setShopSelectorOpen(false);
    setReferencePickerOpen((current) => !current);
  }

  function handleSelectReferenceDate(value: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAnalyticsReferenceDate(value);
    setReferencePickerOpen(false);
  }

  function toggleShopSelector() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    triggerHaptic();
    setReferencePickerOpen(false);
    setShopSelectorOpen((current) => !current);
  }

  function handleSelectShop(shopId: number | null) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedShopId(shopId);
    setShopSelectorOpen(false);
    showToast("success", shopId ? "Branch focus updated." : "Showing all branches.");
  }

  function openCreateShopSheet() {
    createForm.reset({ name: "", username: "", password: "" });
    setCreateShopOpen(true);
  }

  function openManageShopSheet(shop: ShopRead) {
    setManageShopOpen(true);
    setSelectedManagedShop(shop);
    manageForm.reset({
      name: shop.name,
      username: shop.username,
      password: "",
    });
  }

  function closeManageShopSheet() {
    setManageShopOpen(false);
    setSelectedManagedShop(null);
    manageForm.reset({ name: "", username: "", password: "" });
  }

  async function handleCreateShop(values: CreateShopFormValues) {
    setCreating(true);
    try {
      await createBranch({
        name: values.name.trim(),
        username: values.username.trim(),
        password: values.password,
      });
      createForm.reset();
      setCreateShopOpen(false);
      showToast("success", "New branch created successfully.");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Unable to create branch.");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateShop(values: EditShopFormValues) {
    if (!selectedManagedShop) {
      return;
    }

    setUpdatingShop(true);
    try {
      await updateBranch(selectedManagedShop, {
        name: values.name.trim(),
        username: values.username.trim(),
        password: values.password.trim() ? values.password.trim() : null,
      });
      closeManageShopSheet();
      showToast("success", `${values.name.trim()} updated successfully.`);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Unable to update branch.");
    } finally {
      setUpdatingShop(false);
    }
  }

  function confirmDeleteShop(shop: ShopRead) {
    Alert.alert(
      "Delete Shop",
      `Delete ${shop.name}? This is only allowed for shops without price or billing history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeletingShopId(shop.id);
              try {
                await deleteBranch(shop);
                if (selectedShopId === shop.id) {
                  setSelectedShopId(null);
                }
                closeManageShopSheet();
                showToast("success", `${shop.name} deleted successfully.`);
              } catch (error) {
                showToast("error", error instanceof Error ? error.message : "Unable to delete branch.");
              } finally {
                setDeletingShopId(null);
              }
            })();
          },
        },
      ],
    );
  }

  function handleDeleteShop() {
    if (!selectedManagedShop) {
      return;
    }

    confirmDeleteShop(selectedManagedShop);
  }

  async function handleToggleShop(shopId: number, isActive: boolean) {
    const shop = shops.find((item) => item.id === shopId);
    if (!shop) {
      return;
    }

    try {
      setStatusUpdatingShopId(shopId);
      await toggleBranchStatus(shop, isActive);
      setSelectedManagedShop((current) => (current?.id === shopId ? { ...current, is_active: isActive } : current));
      showToast("success", `${shop.name} ${isActive ? "activated" : "paused"}.`);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Unable to update branch.");
    } finally {
      setStatusUpdatingShopId(null);
    }
  }

  async function openPriceSheet() {
    setPriceSheetOpen(true);
    setEffectiveDate(dateOptions[0]?.value ?? new Date().toISOString().slice(0, 10));
    setDraftPrices({});
    setPriceError(null);
    setPriceBootstrap(null);

    // Pre-select the currently focused shop if one is active
    if (selectedShopId !== null) {
      setPriceSelectedShopId(selectedShopId);
      try {
        const bootstrap = await loadShopPriceBootstrap(selectedShopId);
        const firstItem = bootstrap?.items.find((item) => !isPositiveNumber(item.current_price ?? "")) ?? bootstrap?.items[0];
        if (firstItem) {
          setSelectedPriceItemId(firstItem.item_id);
        }
      } catch (error) {
        showToast("error", error instanceof Error ? error.message : "Unable to load price controls.");
      }
    } else {
      setPriceSelectedShopId(null);
    }
  }

  function closePriceSheet() {
    setPriceSheetOpen(false);
    setItemPickerOpen(false);
    setDatePickerOpen(false);
    setPriceShopPickerOpen(false);
    setPriceSelectedShopId(null);
    setDraftPrices({});
    setPriceError(null);
  }

  async function openBillPreview(billId: number) {
    setBillPreviewOpen(true);
    setBillPreviewLoading(true);
    setSelectedBillPreview(null);

    try {
      const bill = await loadBillDetail(billId);
      setSelectedBillPreview(bill);
    } catch (error) {
      setBillPreviewOpen(false);
      showToast("error", error instanceof Error ? error.message : "Unable to load bill preview.");
    } finally {
      setBillPreviewLoading(false);
    }
  }

  function closeBillPreview() {
    setBillPreviewOpen(false);
    setBillPreviewLoading(false);
    setSelectedBillPreview(null);
  }

  function handleSelectPriceItem(itemId: number, _currentPrice?: string | null) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedPriceItemId(itemId);
    setItemPickerOpen(false);
    setPriceError(null);
  }

  function handleChangeDraftPrice(value: string) {
    if (!selectedPriceItemId) {
      return;
    }

    setDraftPrices((current) => ({
      ...current,
      [selectedPriceItemId]: value.replace(/[^\d.]/g, ""),
    }));
    setPriceError(null);
  }

  function handleSelectDate(value: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEffectiveDate(value);
    setDatePickerOpen(false);
  }

  async function handleSavePrice() {
    if (!priceBootstrap || !selectedPriceItemId || !currentPriceItem || !priceSelectedShopId) {
      return;
    }

    const normalizedValue = draftPrice.trim();
    if (!isPositiveNumber(normalizedValue)) {
      setPriceError("Enter a valid numeric price before saving.");
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    if (unresolvedPriceItems.length > 0) {
      const itemNames = unresolvedPriceItems.map((item) => item.item_name);
      const preview = itemNames.slice(0, 3).join(", ");
      const suffix = itemNames.length > 3 ? `, +${itemNames.length - 3} more` : "";
      setPriceError(`Add valid prices for every active item before saving. Remaining: ${preview}${suffix}.`);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    const entries: { item_id: number; price_per_unit: string }[] = [];
    for (const item of priceBootstrap.items) {
      const rawValue = resolvePriceDraft(item.item_id, item.current_price);

      entries.push({
        item_id: item.item_id,
        price_per_unit: toMoneyString(rawValue),
      });
    }

    const previousBootstrap = priceBootstrap;
    setSavingPrice(true);
    setPriceError(null);
    setPriceBootstrap({
      ...priceBootstrap,
      items: priceBootstrap.items.map((item) => ({
        ...item,
        current_price: toMoneyString(resolvePriceDraft(item.item_id, item.current_price)),
      })),
    });
    setDraftPrices({});

    const shopName = shops.find((s) => s.id === priceSelectedShopId)?.name ?? "shop";
    try {
      await saveShopPriceBook(priceSelectedShopId, {
        entries,
        price_date: effectiveDate,
      });
      closePriceSheet();
      showToast("success", `Prices saved for ${shopName} effective ${effectiveDate}.`);
    } catch (error) {
      setPriceBootstrap(previousBootstrap);
      setDraftPrices(Object.fromEntries(entries.map((entry) => [entry.item_id, entry.price_per_unit])));
      setPriceError(error instanceof Error ? error.message : "Unable to save price update.");
      showToast("error", error instanceof Error ? error.message : "Unable to save price update.");
    } finally {
      setSavingPrice(false);
    }
  }

  async function handleSelectPriceShop(shopId: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPriceSelectedShopId(shopId);
    setPriceShopPickerOpen(false);
    setDraftPrices({});
    setSelectedPriceItemId(null);
    setPriceError(null);
    try {
      const bootstrap = await loadShopPriceBootstrap(shopId);
      const firstItem = bootstrap?.items.find((item) => !isPositiveNumber(item.current_price ?? "")) ?? bootstrap?.items[0];
      if (firstItem) {
        setSelectedPriceItemId(firstItem.item_id);
      }
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Unable to load prices for this shop.");
    }
  }

  function handleQuickRefresh() {
    void loadDashboard(true);
  }

  async function handlePrintAllBills() {
    if (visibleBills.length === 0) return;
    try {
      setPrintingAll(true);
      const { buildReceiptHtml } = await import("@/api/receipts");
      const fullBills = await Promise.all(visibleBills.map((b) => loadBillDetail(b.bill_id)));
      const combinedHtml = fullBills.map((bill) => buildReceiptHtml(bill)).join("");
      await Linking.openURL(`printerapp://print?html=${encodeURIComponent(combinedHtml)}`);
    } catch {
      Alert.alert("Unable to Print", "Make sure the printer app is installed, or try printing bills individually.");
    } finally {
      setPrintingAll(false);
    }
  }

  function handleLoadMoreBills() {
    void loadMoreBills().catch((error) => {
      showToast("error", error instanceof Error ? error.message : "Unable to load more bills.");
    });
  }

  function handleToggleTheme() {
    const nextTheme = colorScheme === "dark" ? "light" : "dark";
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setThemePreference(nextTheme);
    showToast("success", `${nextTheme === "dark" ? "Dark" : "Light"} mode enabled.`);
  }

  const bottomNavOffset = 12 + insets.bottom;
  const fabOffset = 100 + insets.bottom;
  const bottomSpacer = 160 + insets.bottom;

  if (loading && shops.length === 0) {
    return <DashboardSkeleton palette={palette} />;
  }

  if (!loading && shops.length === 0 && dashboardError) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <View style={styles.emptyWrap}>
          <EmptyStateCard
            title="Unable to load admin dashboard"
            subtitle={dashboardError}
            actionLabel="Retry"
            onAction={() => void loadDashboard(true)}
            palette={palette}
            icon="wifi-alert"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]} edges={["left", "right"]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <TopAppBar
        shopName={selectedShopName}
        onShopPress={toggleShopSelector}
        periodLabel={analyticsReferenceLabel}
        onPeriodPress={toggleReferencePicker}
        palette={palette}
        topInset={insets.top}
        isOffline={isOfflineSnapshot}
        isDark={colorScheme === "dark"}
        onThemeToggle={handleToggleTheme}
        onRefresh={handleQuickRefresh}
      />

      <ToastBanner toast={toast} palette={palette} animatedValue={toastAnimation} />

      {/* Shop selector dropdown */}
      {shopSelectorOpen ? (
        <View
          style={[
            styles.floatingDropdown,
            adminShadow(palette.shadow, 0.08, 12, 18),
            { backgroundColor: palette.card, borderColor: palette.border, top: insets.top + 82 },
          ]}
        >
          <ScrollView
            style={styles.floatingDropdownScroll}
            contentContainerStyle={styles.floatingDropdownContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable onPress={() => handleSelectShop(null)} style={styles.selectorOption}>
              <View style={styles.selectorOptionContent}>
                <View style={[styles.selectorOptionIcon, { backgroundColor: palette.surfaceMuted }]}>
                  <MaterialCommunityIcons name="domain" size={16} color={palette.emerald} />
                </View>
                <View style={styles.selectorOptionText}>
                  <Text style={[styles.selectorOptionTitle, { color: palette.textPrimary }]}>All Branches</Text>
                  <Text style={[styles.selectorOptionSubtitle, { color: palette.textMuted }]}>Network-wide analytics</Text>
                </View>
              </View>
              {!selectedShopId ? <MaterialCommunityIcons name="check-circle" size={18} color={palette.emerald} /> : null}
            </Pressable>
            {shops.map((shop) => (
              <Pressable key={shop.id} onPress={() => handleSelectShop(shop.id)} style={styles.selectorOption}>
                <View style={styles.selectorOptionContent}>
                  <View style={[styles.selectorOptionIcon, { backgroundColor: palette.surfaceMuted }]}>
                    <MaterialCommunityIcons name="storefront-outline" size={16} color={palette.emerald} />
                  </View>
                  <View style={styles.selectorOptionText}>
                    <Text style={[styles.selectorOptionTitle, { color: palette.textPrimary }]}>{shop.name}</Text>
                    <Text style={[styles.selectorOptionSubtitle, { color: palette.textMuted }]}>
                      {shop.username} · {shop.is_active ? "Active" : "Disabled"}
                    </Text>
                  </View>
                </View>
                <View style={[styles.selectorOptionStatusChip, { backgroundColor: shop.is_active ? palette.successSoft : palette.dangerSoft }]}>
                  <Text style={[styles.selectorOptionStatusText, { color: shop.is_active ? palette.success : palette.danger }]}>
                    {shop.is_active ? "Active" : "Off"}
                  </Text>
                </View>
                {selectedShopId === shop.id ? <MaterialCommunityIcons name="check-circle" size={18} color={palette.emerald} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Reference period picker dropdown */}
      {referencePickerOpen ? (
        <View
          style={[
            styles.floatingDropdown,
            adminShadow(palette.shadow, 0.08, 12, 18),
            { backgroundColor: palette.card, borderColor: palette.border, top: insets.top + 82 },
          ]}
        >
          <View style={[styles.segmentRow, { padding: 12 }]}>
            {PERIOD_OPTIONS.map((option) => {
              const active = analyticsPeriod === option.key;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => handleSelectPeriod(option.key)}
                  style={[
                    styles.segmentButton,
                    { backgroundColor: active ? palette.emerald : palette.surfaceMuted, borderColor: active ? palette.emerald : palette.border },
                  ]}
                >
                  <Text style={[styles.segmentText, { color: active ? "#FFFFFF" : palette.textSecondary }]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <ScrollView
            style={styles.floatingDropdownScroll}
            contentContainerStyle={styles.floatingDropdownContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {analyticsReferenceOptions.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: option.value === analyticsReferenceDate }}
                onPress={() => handleSelectReferenceDate(option.value)}
                style={[
                  styles.referenceOption,
                  option.value === analyticsReferenceDate && { backgroundColor: palette.emeraldSoft },
                ]}
              >
                <Text style={[styles.referenceOptionText, { color: palette.textPrimary }]}>{option.label}</Text>
                {option.value === analyticsReferenceDate ? (
                  <MaterialCommunityIcons name="check-circle" size={18} color={palette.emerald} />
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {activeNav === "billing" ? (
        <SectionList
          sections={billingSections}
          keyExtractor={(item) => `${item.bill_id}`}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.billGroupTitle, { color: palette.textMuted }]}>{section.title}</Text>
          )}
          renderItem={({ item: bill }) => (
            <Pressable
              onPress={() => void openBillPreview(bill.bill_id)}
              style={({ pressed }) => [
                styles.billCard,
                adminShadow(palette.shadow, 0.06, 3, 10),
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                  opacity: pressed ? 0.82 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
              ]}
            >
              {/* Left accent strip */}
              <View style={[styles.billCardAccent, { backgroundColor: palette.emerald }]} />

              {/* Card body */}
              <View style={styles.billCardBody}>
                <View style={styles.billCardTopRow}>
                  <Text style={[styles.billCardNo, { color: palette.textPrimary }]} numberOfLines={1}>
                    {bill.bill_no}
                  </Text>
                  <Text style={[styles.billCardAmount, { color: palette.emerald }]}>
                    {formatCurrency(bill.total_amount)}
                  </Text>
                </View>
                <View style={styles.billCardBottomRow}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color={palette.textMuted} />
                  <Text style={[styles.billCardDate, { color: palette.textMuted }]}>
                    {formatDateTime(bill.created_at)}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <MaterialCommunityIcons name="chevron-right" size={16} color={palette.textMuted} />
                </View>
              </View>
            </Pressable>
          )}
          ListHeaderComponent={(
            <View style={styles.billingListHeader}>
              {dashboardError && shops.length > 0 ? (
                <View style={[styles.inlineBanner, { backgroundColor: palette.goldSoft, borderColor: palette.gold, marginBottom: 12 }]}>
                  <MaterialCommunityIcons name="wifi-alert" size={18} color={palette.cash} />
                  <Text style={[styles.inlineBannerText, { color: palette.textPrimary }]}>{dashboardError}</Text>
                </View>
              ) : null}
              <View style={styles.tabSectionHeader}>
                <Text style={[styles.tabSectionTitle, { color: palette.textPrimary }]}>Billing Feed</Text>
                <View style={styles.sectionBadge}>
                  <Text style={[styles.sectionBadgeText, { color: palette.emeraldDark, backgroundColor: palette.emeraldSoft }]}>
                    {visibleBillCount} bills
                  </Text>
                </View>
              </View>
              <SearchField value={billSearch} onChangeText={setBillSearch} placeholder="Search bills" palette={palette} />
              {visibleBills.length > 0 ? (
                <Pressable
                  onPress={() => void handlePrintAllBills()}
                  style={[
                    styles.printAllBtn,
                    adminShadow(palette.shadow, 0.04, 4, 8),
                    { backgroundColor: printingAll ? palette.surfaceMuted : palette.emeraldSoft, borderColor: palette.emerald },
                  ]}
                >
                  <MaterialCommunityIcons name="printer-outline" size={16} color={palette.emerald} />
                  <Text style={[styles.printAllBtnText, { color: palette.emeraldDark }]}>
                    {printingAll ? "Opening printer..." : `Print All (${visibleBills.length})`}
                  </Text>
                </Pressable>
              ) : null}
              {visibleBills.length > 0 ? (
                <Text style={[styles.sectionHint, { color: palette.textMuted }]}>Tap a bill to preview · Print icon to print individually.</Text>
              ) : null}
              {dailyBillsHasMore ? (
                <Text style={[styles.sectionHint, { color: palette.textMuted }]}>
                  Showing the latest {dailyBills.length} bills in this range. Scroll to load older entries.
                </Text>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <EmptyStateCard
              title="No bills found"
              subtitle="Try another search or branch focus."
              actionLabel="Clear"
              onAction={() => setBillSearch("")}
              icon="receipt-text-remove-outline"
              palette={palette}
            />
          }
          ListFooterComponent={
            dailyBillsLoadingMore ? (
              <View style={styles.billingListFooter}>
                <ActivityIndicator color={palette.emerald} />
                <Text style={[styles.sectionHint, { color: palette.textMuted }]}>Loading older bills...</Text>
              </View>
            ) : dailyBillsHasMore ? (
              <View style={styles.billingListFooter}>
                <Text style={[styles.sectionHint, { color: palette.textMuted }]}>Scroll to load older bills.</Text>
              </View>
            ) : dailyBills.length > 0 ? (
              <View style={styles.billingListFooter}>
                <Text style={[styles.sectionHint, { color: palette.textMuted }]}>Reached the end of this billing feed.</Text>
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomSpacer }}
          keyboardShouldPersistTaps="handled"
          onEndReached={handleLoadMoreBills}
          onEndReachedThreshold={0.35}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadDashboard(true)}
              tintColor={palette.emerald}
              colors={[palette.emerald]}
            />
          }
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomSpacer }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadDashboard(true)}
              tintColor={palette.emerald}
              colors={[palette.emerald]}
            />
          }
        >
          {dashboardError && shops.length > 0 ? (
            <View style={[styles.inlineBanner, { backgroundColor: palette.goldSoft, borderColor: palette.gold, marginBottom: 12 }]}>
              <MaterialCommunityIcons name="wifi-alert" size={18} color={palette.cash} />
              <Text style={[styles.inlineBannerText, { color: palette.textPrimary }]}>{dashboardError}</Text>
            </View>
          ) : null}

        {/* â”€â”€ DASHBOARD TAB â”€â”€ */}
        {activeNav === "dashboard" ? (
          <View style={{ gap: 14 }}>
            <View style={[styles.sectionCard, adminShadow(palette.shadow, 0.05, 8, 16), { backgroundColor: palette.card, borderColor: palette.border }]}>
              <View style={[styles.sectionHeader, { paddingHorizontal: 0, paddingTop: 0 }]}>
                <View style={styles.sectionHeaderText}>
                  <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Performance Snapshot</Text>
                  <Text style={[styles.sectionSubtitle, { color: palette.textMuted }]}>
                    {selectedShopId ? `${selectedShopName} · ${analyticsReferenceLabel}` : `All branches · ${analyticsReferenceLabel}`}
                  </Text>
                </View>
                <View style={styles.sectionBadge}>
                  <Text style={[styles.sectionBadgeText, { color: palette.emeraldDark, backgroundColor: palette.emeraldSoft }]}>
                    {visibleBillCount} bills
                  </Text>
                </View>
              </View>

              <View style={styles.sectionBody}>
                <View style={styles.metricContextRow}>
                  {metricContextItems.map((item) => (
                    <View
                      key={item.key}
                      style={[styles.metricContextPill, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                        size={14}
                        color={palette.emerald}
                      />
                      <Text style={[styles.metricContextLabel, { color: palette.textMuted }]}>{item.label}</Text>
                      <Text numberOfLines={1} style={[styles.metricContextValue, { color: palette.textPrimary }]}>{item.value}</Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.metricGrid, useCompactMetricCards && styles.metricGridCompact]}>
                  {metricCards.map((metric) => (
                    <MetricCard
                      key={metric.key}
                      label={metric.label}
                      value={metric.value}
                      formatter={metric.formatter}
                      note={metric.note}
                      noteIcon={metric.noteIcon}
                      icon={metric.icon}
                      accent={metric.accent}
                      accentSoft={metric.accentSoft}
                      sparklineLabel={metric.sparklineLabel}
                      sparklineValues={metric.sparklineValues}
                      fullWidth={useCompactMetricCards}
                      palette={palette}
                    />
                  ))}
                </View>
              </View>
            </View>

          </View>
        ) : null}

        {/* â”€â”€ INVENTORY TAB â”€â”€ */}
        {activeNav === "inventory" ? (
          <View style={{ gap: 12 }}>
            <View style={styles.tabSectionHeader}>
              <Text style={[styles.tabSectionTitle, { color: palette.textPrimary }]}>Items Sold</Text>
              <View style={styles.sectionBadge}>
                <Text style={[styles.sectionBadgeText, { color: palette.emeraldDark, backgroundColor: palette.emeraldSoft }]}>
                  {filteredItemSales.length} items
                </Text>
              </View>
            </View>
            <SearchField value={itemSearch} onChangeText={setItemSearch} placeholder="Search items" accessibilityLabel="Search sold items" palette={palette} />
            {filteredItemSales.length === 0 ? (
              <EmptyStateCard title="No item movement found" subtitle="Try a different branch or search term." actionLabel="Clear Search" onAction={() => setItemSearch("")} icon="food-off-outline" palette={palette} />
            ) : (
              <View style={styles.cardStack}>
                {filteredItemSales.map((item) => {
                  const itemTotal = money(item.total_amount).toNumber();
                  const isHot = itemTotal >= itemRevenueAverage;
                  return (
                    <View key={item.item_id} style={[styles.itemCard, adminShadow(palette.shadow, 0.04, 6, 10), { backgroundColor: palette.card, borderColor: palette.border }]}>
                      <View style={[styles.itemIconWrap, { backgroundColor: palette.emeraldSoft }]}>
                        <MaterialCommunityIcons name="food-drumstick-outline" size={18} color={palette.emerald} />
                      </View>
                      <View style={styles.itemContent}>
                        <View style={styles.itemHeader}>
                          <View style={styles.itemTextWrap}>
                            <Text style={[styles.itemTitle, { color: palette.textPrimary }]}>{item.item_name}</Text>
                            <Text style={[styles.itemSubtitle, { color: palette.textMuted }]}>
                              {getUnitLabel(item.base_unit, item.quantity_sold)} · {item.bill_count} bills
                            </Text>
                          </View>
                          <View style={[styles.stateChip, { backgroundColor: isHot ? palette.successSoft : palette.goldSoft }]}>
                            <MaterialCommunityIcons name={isHot ? "trending-up" : "trending-neutral"} size={14} color={isHot ? palette.success : palette.cash} />
                            <Text style={[styles.stateChipText, { color: isHot ? palette.success : palette.cash }]}>{isHot ? "Hot" : "Steady"}</Text>
                          </View>
                        </View>
                        <Text style={[styles.itemAmount, { color: palette.emerald }]}>{formatCurrency(item.total_amount)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}


        {/* â”€â”€ SETTINGS (BRANCH CONTROL) TAB â”€â”€ */}
        {activeNav === "settings" ? (
          <View style={{ gap: 14 }}>
            {/* Settings Tab: Title Row */}
            <View style={styles.tabSectionHeader}>
              <Text style={[styles.tabSectionTitle, { color: palette.textPrimary }]}>Branch Control</Text>
            </View>

            {/* Create Shop — full-width prominent button */}
            <Pressable
              onPress={openCreateShopSheet}
              style={[styles.createShopBtn, adminShadow(palette.shadow, 0.06, 8, 14), { backgroundColor: palette.emerald }]}
            >
              <MaterialCommunityIcons name="store-plus-outline" size={20} color="#FFFFFF" />
              <Text style={styles.createShopBtnText}>+ Create New Branch</Text>
            </Pressable>

            {visibleShopRows.length === 0 ? (
              <EmptyStateCard title="No branches available" subtitle="Create a branch to start tracking sales." actionLabel="Create Branch" onAction={openCreateShopSheet} icon="store-off-outline" palette={palette} />
            ) : (
              <View style={styles.cardStack}>
                {visibleShopRows.map((row, index) => {
                  const statusColor = row.status === "ACTIVE" ? palette.success : row.status === "IDLE" ? palette.cash : row.status === "DISABLED" ? palette.danger : palette.textMuted;
                  const rank = branchRanking.get(row.shop.id) ?? index + 1;
                  return (
                    <View key={row.shop.id} style={[styles.branchCard, adminShadow(palette.shadow, 0.04, 8, 14), { backgroundColor: palette.card, borderColor: palette.border }]}>
                      <View style={styles.branchHeader}>
                        <View style={styles.branchIdentity}>
                          <View style={[styles.branchIconWrap, { backgroundColor: palette.emeraldSoft, borderColor: palette.border }]}>
                            <MaterialCommunityIcons name="storefront-outline" size={20} color={palette.emerald} />
                          </View>
                          <View style={styles.branchTextWrap}>
                            <View style={styles.branchTitleRow}>
                              <View style={[styles.rankBadge, { backgroundColor: palette.emeraldSoft }]}>
                                <Text style={[styles.rankBadgeText, { color: palette.emeraldDark }]}>#{rank}</Text>
                              </View>
                              <Text style={[styles.branchName, { color: palette.textPrimary }]}>{row.shop.name}</Text>
                            </View>
                            <Text style={[styles.branchStatusNote, { color: palette.textSecondary }]}>{row.shop.username}</Text>
                          </View>
                        </View>
                        <View style={[styles.stateChip, { backgroundColor: `${statusColor}18` }]}>
                          <View style={[styles.onlineDot, { backgroundColor: statusColor }]} />
                          <Text style={[styles.stateChipText, { color: statusColor }]}>{row.status}</Text>
                        </View>
                      </View>

                      <View style={styles.branchMetricsRow}>
                        <View style={[styles.branchMetric, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                          <Text style={[styles.branchMetricLabel, { color: palette.textMuted }]}>Revenue</Text>
                          <Text style={[styles.branchMetricValue, { color: palette.emerald }]}>{formatCompactCurrency(row.totalSales)}</Text>
                        </View>
                        <View style={[styles.branchMetric, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                          <Text style={[styles.branchMetricLabel, { color: palette.textMuted }]}>Bills</Text>
                          <Text style={[styles.branchMetricValue, { color: palette.textPrimary }]}>{row.billCount}</Text>
                        </View>
                        <View style={[styles.branchMetric, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                          <Text style={[styles.branchMetricLabel, { color: palette.textMuted }]}>Last Active</Text>
                          <Text style={[styles.branchMetricValue, { color: palette.textPrimary }]}>{formatRelativeTime(row.lastActivityAt)}</Text>
                        </View>
                      </View>

                      <View style={[styles.branchFooter, { borderTopColor: palette.border }]}>
                        <View style={styles.branchActionRow}>
                          <View style={styles.branchActionButton}>
                            <PrimaryButton
                              label="Manage"
                              onPress={() => openManageShopSheet(row.shop)}
                              variant="secondary"
                              icon="pencil-box-outline"
                              fullWidth
                              palette={palette}
                              backgroundColorOverride={palette.upiSoft}
                              borderColorOverride={palette.upi}
                              textColorOverride={palette.upi}
                            />
                          </View>
                          <View style={styles.branchActionButton}>
                            <PrimaryButton
                              label={row.shop.is_active ? "Pause" : "Activate"}
                              onPress={() => void handleToggleShop(row.shop.id, !row.shop.is_active)}
                              loading={statusUpdatingShopId === row.shop.id}
                              variant="secondary"
                              icon={row.shop.is_active ? "pause-circle-outline" : "check-circle-outline"}
                              fullWidth
                              palette={palette}
                              backgroundColorOverride={row.shop.is_active ? palette.cashSoft : palette.emeraldSoft}
                              borderColorOverride={row.shop.is_active ? palette.cash : palette.emerald}
                              textColorOverride={row.shop.is_active ? "#8A5A11" : palette.emeraldDark}
                            />
                          </View>
                          <View style={styles.branchActionButton}>
                            <PrimaryButton
                              label="Delete"
                              onPress={() => confirmDeleteShop(row.shop)}
                              loading={deletingShopId === row.shop.id}
                              disabled={statusUpdatingShopId === row.shop.id}
                              variant="secondary"
                              icon="trash-can-outline"
                              fullWidth
                              palette={palette}
                              backgroundColorOverride={palette.dangerSoft}
                              borderColorOverride={palette.danger}
                              textColorOverride={palette.danger}
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Sign Out — pinned at the BOTTOM of settings tab */}
            <Pressable
              onPress={handleLogout}
              style={[styles.logoutRow, adminShadow(palette.shadow, 0.04, 6, 10), { backgroundColor: palette.dangerSoft, borderColor: palette.danger }]}
            >
              <View style={[styles.logoutIconWrap, { backgroundColor: palette.danger }]}>
                <MaterialCommunityIcons name="logout" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.logoutTextWrap}>
                <Text style={[styles.logoutText, { color: palette.danger }]}>Sign Out Admin</Text>
                <Text style={[styles.logoutHint, { color: palette.textMuted }]}>Clears session and returns to login</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={palette.danger} />
            </Pressable>
          </View>
        ) : null}
        </ScrollView>
      )}


      <BottomNav
        items={NAV_ITEMS.map((item) => ({ ...item, icon: item.icon as never }))}
        activeKey={activeNav}
        onSelect={(key) => setActiveNav(key as AdminNavTab)}
        palette={palette}
        bottomOffset={bottomNavOffset}
      />

      {/* FAB: Update Price — only visible on Dashboard and Settings tabs */}
      {(activeNav === "dashboard" || activeNav === "settings") ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open update price sheet"
          onPress={() => void openPriceSheet()}
          style={[
            styles.fab,
            adminShadow(palette.shadow, 0.12, 14, 20),
            { backgroundColor: palette.emerald, bottom: fabOffset },
          ]}
        >
          <MaterialCommunityIcons name="cash-edit" size={18} color="#FFFFFF" />
          <Text style={styles.fabLabel}>Update Price</Text>
        </Pressable>
      ) : null}

      <PriceUpdateSheet
        visible={priceSheetOpen}
        onClose={closePriceSheet}
        palette={palette}
        bottomInset={insets.bottom}
        priceLoading={priceLoading}
        priceBootstrap={priceBootstrap}
        currentPriceItem={currentPriceItem}
        selectedPriceItemId={selectedPriceItemId}
        resolveItemPrice={resolvePriceDraft}
        onSelectItem={handleSelectPriceItem}
        draftPrice={draftPrice}
        onChangeDraftPrice={handleChangeDraftPrice}
        priceError={priceError}
        priceHelperText={priceHelperText}
        saveDisabled={saveDisabled}
        itemPickerOpen={itemPickerOpen}
        onToggleItemPicker={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setItemPickerOpen((current) => !current);
        }}
        effectiveDate={effectiveDate}
        dateOptions={dateOptions}
        datePickerOpen={datePickerOpen}
        onToggleDatePicker={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setDatePickerOpen((current) => !current);
        }}
        onSelectDate={handleSelectDate}
        savingPrice={savingPrice}
        onSave={() => void handleSavePrice()}
        shops={shops}
        selectedPriceShopId={priceSelectedShopId}
        onSelectShop={handleSelectPriceShop}
        shopPickerOpen={priceShopPickerOpen}
        onToggleShopPicker={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setPriceShopPickerOpen((current) => !current);
        }}
      />

      <BillPreviewSheet
        visible={billPreviewOpen}
        onClose={closeBillPreview}
        palette={palette}
        bottomInset={insets.bottom}
        loading={billPreviewLoading}
        bill={selectedBillPreview}
      />

      <ShopEditorSheet
        visible={createShopOpen}
        onClose={() => setCreateShopOpen(false)}
        palette={palette}
        bottomInset={insets.bottom}
        mode="create"
        loading={creating}
        control={createForm.control}
        onSubmit={createForm.handleSubmit(handleCreateShop)}
      />

      <ShopEditorSheet
        visible={manageShopOpen}
        onClose={closeManageShopSheet}
        palette={palette}
        bottomInset={insets.bottom}
        mode="edit"
        loading={updatingShop}
        deleting={deletingShopId === selectedManagedShop?.id}
        statusLoading={statusUpdatingShopId === selectedManagedShop?.id}
        isActive={selectedManagedShop?.is_active}
        control={manageForm.control}
        onSubmit={manageForm.handleSubmit(handleUpdateShop)}
        onDelete={handleDeleteShop}
        onToggleActive={() => {
          if (!selectedManagedShop) {
            return;
          }
          void handleToggleShop(selectedManagedShop.id, !selectedManagedShop.is_active);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  floatingDropdown: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: 360,
  },
  floatingDropdownScroll: {
    flexGrow: 0,
  },
  floatingDropdownContent: {
    paddingBottom: 8,
  },
  tabSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 4,
  },
  tabSectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    flex: 1,
  },
  sectionHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  logoutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutTextWrap: {
    flex: 1,
    gap: 2,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
  },
  logoutHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  createShopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  createShopBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  // Section card styles (used inline in tab content)
  sectionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 4,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 3,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },


  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
  },
  heroAccentBar: {
    width: 58,
    height: 4,
    borderRadius: 999,
    marginBottom: 18,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  heroBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  heroActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconButton: {
    borderWidth: 1,
  },
  heroTitle: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "800",
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  heroFooter: {
    marginTop: 18,
  },
  heroChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroHighlightRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  heroHighlightCard: {
    flex: 1,
    minWidth: 148,
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
    gap: 4,
  },
  heroHighlightLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroHighlightValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  liveChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  focusChip: {
    alignSelf: "flex-start",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
  },
  focusChipLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  focusChipValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
  },
  selectorStack: {
    marginTop: 16,
    gap: 10,
  },
  selectorCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  selectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  selectorHeaderText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  selectorModeChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectorModeChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  selectorChevronWrap: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorBody: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  selectorIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorBodyText: {
    flex: 1,
    gap: 4,
  },
  selectorValue: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
  },
  selectorHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  selectorDropdown: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: "hidden",
  },
  selectorOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  selectorOptionContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectorOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorOptionText: {
    flex: 1,
  },
  selectorOptionState: {
    alignItems: "flex-end",
    gap: 6,
  },
  selectorOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  selectorOptionSubtitle: {
    marginTop: 4,
    fontSize: 12,
  },
  selectorOptionStatusChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectorOptionStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  inlineBanner: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inlineBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  toolbarWrap: {
    marginTop: 16,
    paddingBottom: 12,
  },
  toolbarCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  toolbarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  toolbarTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  segmentRow: {
    flexDirection: "row",
    gap: 8,
  },
  referenceSelector: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  referenceSelectorText: {
    flex: 1,
    gap: 4,
  },
  referenceSelectorLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  referenceSelectorValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  referenceDropdown: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  referenceOption: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  referenceOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  segmentButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
  },
  metricContextRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricContextPill: {
    minHeight: 36,
    maxWidth: "100%",
    flexShrink: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricContextLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metricContextValue: {
    flexShrink: 1,
    maxWidth: 160,
    fontSize: 12,
    fontWeight: "700",
  },
  metricEmptyState: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  metricEmptyStateText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "stretch",
  },
  metricGridCompact: {
    flexDirection: "column",
    flexWrap: "nowrap",
  },
  sectionBadge: {
    justifyContent: "center",
  },
  sectionBadgeText: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: "600",
  },
  sectionBody: {
    marginTop: 12,
    gap: 10,
  },
  chipRow: {
    flexDirection: "row",
    gap: 6,
    paddingRight: 8,
  },
  cardStack: {
    gap: 10,
  },
  billingListHeader: {
    gap: 12,
    marginBottom: 8,
  },
  billingListFooter: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  printAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  printAllBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  branchOverviewCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  branchOverviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  branchOverviewText: {
    flex: 1,
    gap: 3,
  },
  branchOverviewLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  branchOverviewTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  branchOverviewSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  branchOverviewChip: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  branchOverviewChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  branchOverviewMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  branchOverviewMetric: {
    flex: 1,
    minWidth: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  branchOverviewMetricLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  branchOverviewMetricValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
    gap: 6,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTextWrap: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  stateChip: {
    minHeight: 26,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stateChipText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  reportGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  reportCard: {
    width: "48.2%",
    minWidth: 140,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  reportLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  reportValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  reportHint: {
    fontSize: 11,
    lineHeight: 16,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  reportMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  feedColumns: {
    gap: 10,
  },
  feedColumn: {
    gap: 10,
  },
  feedPanel: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  feedPanelHeader: {
    gap: 3,
  },
  feedPanelTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  feedPanelSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  billGroup: {
    gap: 8,
  },
  billGroupTitle: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  billCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  billCardAccent: {
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  billCardBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  billCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  billCardNo: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
    flex: 1,
  },
  billCardAmount: {
    fontSize: 15,
    fontWeight: "800",
  },
  billCardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  billCardDate: {
    fontSize: 11,
    fontWeight: "400",
  },
  feedCardWrap: {
    marginBottom: 10,
  },
  feedCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  feedTextWrap: {
    flex: 1,
    gap: 4,
  },
  feedTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  feedSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  feedAmount: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "right",
  },
  feedDivider: {
    height: 1,
    marginHorizontal: -2,
  },
  feedMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feedMeta: {
    fontSize: 12,
    fontWeight: "400",
  },
  auditCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 10,
  },
  auditIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  auditContent: {
    flex: 1,
    gap: 5,
  },
  auditHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  auditTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  auditDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  auditMeta: {
    fontSize: 11,
  },
  branchCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  branchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  branchIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  branchIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  branchTextWrap: {
    flex: 1,
    gap: 4,
  },
  branchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  rankBadge: {
    minWidth: 30,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  branchName: {
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
  },
  branchStatusNote: {
    fontSize: 12,
    lineHeight: 17,
  },
  branchStatusPanel: {
    minWidth: 96,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  branchMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  branchMetaPill: {
    minHeight: 30,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  branchMetaPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  branchMetricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  branchMetric: {
    minWidth: 88,
    flex: 1,
    gap: 3,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  branchMetricLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  branchMetricValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  branchFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 10,
  },
  branchFooterText: {
    gap: 3,
  },
  branchActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  branchActionButton: {
    flex: 1,
    minWidth: 110,
    minHeight: 46,
  },
  branchFooterTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  branchFooterSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  fab: {
    position: "absolute",
    right: 16,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 46,
    borderWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  fabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
});

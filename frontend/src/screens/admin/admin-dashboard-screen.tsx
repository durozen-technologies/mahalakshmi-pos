import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { usePriceStore } from "@/store/price-store";
import type { AnalyticsPeriod } from "@/types/api";
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
} from "./components/admin-dashboard-primitives";
import {
  CreateShopSheet,
  PriceUpdateSheet,
} from "./components/admin-dashboard-sheets";
import { useAdminDashboardData } from "./hooks/use-admin-dashboard-data";
import {
  AUDIT_FILTER_OPTIONS,
  buildDateOptions,
  buildMonthOptions,
  buildYearOptions,
  formatAnalyticsReference,
  formatCompactCurrency,
  formatRelativeTime,
  getSeverityMeta,
  getUnitLabel,
  groupBillsByDate,
  NAV_ITEMS,
  triggerHaptic,
  type AdminNavTab,
  type AnalyticsSectionKey,
  type AuditFilter,
  type SectionKey,
  type ToastTone,
} from "./admin-dashboard-utils";

const createShopSchema = z.object({
  name: z.string().min(2, "Shop name is required"),
  username: z.string().min(3, "Login username is required").max(50, "Username is too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
  code: z.string().optional(),
});

type CreateShopFormValues = z.infer<typeof createShopSchema>;

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
  const colorScheme = useColorScheme();
  const palette = getAdminPalette(colorScheme);
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const yearOptions = useMemo(() => buildYearOptions(), []);
  const heroPrimaryTextColor = "#000000";
  const heroSecondaryTextColor = "rgba(0,0,0,0.84)";
  const heroLabelTextColor = "rgba(0,0,0,0.72)";
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
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");
  const [collapsedSections, setCollapsedSections] = useState<Record<AnalyticsSectionKey, boolean>>({
    inventory: false,
    reports: false,
    billing: true,
    settings: true,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [priceSheetOpen, setPriceSheetOpen] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [selectedPriceItemId, setSelectedPriceItemId] = useState<number | null>(null);
  const [draftPrice, setDraftPrice] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(dateOptions[0]?.value ?? new Date().toISOString().slice(0, 10));
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: ToastTone; message: string } | null>(null);
  const [sectionOffsets, setSectionOffsets] = useState<Record<SectionKey, number>>({
    dashboard: 0,
    inventory: 0,
    reports: 0,
    billing: 0,
    settings: 0,
  });

  const debouncedItemSearch = useDebouncedValue(itemSearch.trim().toLowerCase());
  const debouncedBillSearch = useDebouncedValue(billSearch.trim().toLowerCase());
  const debouncedAuditSearch = useDebouncedValue(auditSearch.trim().toLowerCase());
  const toastAnimation = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const latestDashboardError = useRef<string | null>(null);

  const form = useForm<CreateShopFormValues>({
    resolver: zodResolver(createShopSchema),
    defaultValues: { name: "", username: "", password: "", code: "" },
  });

  const {
    auditLogs,
    createBranch,
    dailyBills,
    dashboardError,
    isOfflineSnapshot,
    itemSales,
    lastSyncAt,
    loadDashboard,
    loadPriceBootstrap,
    loading,
    priceBootstrap,
    priceLoading,
    refreshing,
    saveGlobalPriceBook,
    selectedShopName,
    setPriceBootstrap,
    shops,
    toggleBranchStatus,
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
    setDraftPrice(nextItem.current_price ?? "");
  }, [priceBootstrap, selectedPriceItemId]);

  const currentPriceItem = useMemo(
    () => priceBootstrap?.items.find((item) => item.item_id === selectedPriceItemId) ?? null,
    [priceBootstrap, selectedPriceItemId],
  );

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

  const filteredAuditLogs = useMemo(() => {
    const scopedLogs =
      selectedShopId && selectedShopName !== "All Branches"
        ? auditLogs.filter((log) => `${log.action} ${log.details}`.toLowerCase().includes(selectedShopName.toLowerCase()))
        : auditLogs;

    return scopedLogs.filter((log) => {
      const severity = getSeverityMeta(log, palette).label;
      const matchesFilter = auditFilter === "all" || severity === auditFilter;
      const matchesQuery =
        !debouncedAuditSearch ||
        `${log.action} ${log.details}`.toLowerCase().includes(debouncedAuditSearch);

      return matchesFilter && matchesQuery;
    });
  }, [auditFilter, auditLogs, debouncedAuditSearch, palette, selectedShopId, selectedShopName]);

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
  const largestBill = useMemo(
    () => [...visibleBills].sort((left, right) => money(right.total_amount).minus(left.total_amount).toNumber())[0],
    [visibleBills],
  );
  const activeBranchCount = useMemo(
    () => visibleShopRows.filter((row) => row.shop.is_active).length,
    [visibleShopRows],
  );
  const severeLogsCount = useMemo(
    () =>
      filteredAuditLogs.filter((log) => {
        const severity = getSeverityMeta(log, palette).label;
        return severity === "error" || severity === "critical";
      }).length,
    [filteredAuditLogs, palette],
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
    setShopSelectorOpen((current) => !current);
  }

  function handleSelectShop(shopId: number | null) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedShopId(shopId);
    setShopSelectorOpen(false);
    showToast("success", shopId ? "Branch focus updated." : "Showing all branches.");
  }

  async function handleCreateShop(values: CreateShopFormValues) {
    setCreating(true);
    try {
      await createBranch({
        name: values.name.trim(),
        username: values.username.trim(),
        password: values.password,
        code: values.code?.trim() ? values.code.trim() : null,
      });
      form.reset();
      setModalOpen(false);
      showToast("success", "New branch created successfully.");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Unable to create branch.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleShop(shopId: number, isActive: boolean) {
    const row = visibleShopRows.find((item) => item.shop.id === shopId);
    if (!row) {
      return;
    }

    try {
      await toggleBranchStatus(row.shop, isActive);
      showToast("success", `${row.shop.name} ${isActive ? "enabled" : "disabled"}.`);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Unable to update branch.");
    }
  }

  async function openPriceSheet() {
    setPriceSheetOpen(true);
    setEffectiveDate(dateOptions[0]?.value ?? new Date().toISOString().slice(0, 10));

    try {
      const bootstrap = await loadPriceBootstrap();
      const firstItem = bootstrap?.items[0];
      if (firstItem) {
        setSelectedPriceItemId(firstItem.item_id);
        setDraftPrice(firstItem.current_price ?? "");
      }
      setPriceError(null);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Unable to load price controls.");
    }
  }

  function closePriceSheet() {
    setPriceSheetOpen(false);
    setItemPickerOpen(false);
    setDatePickerOpen(false);
    setPriceError(null);
  }

  function handleSelectPriceItem(itemId: number, currentPrice?: string | null) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedPriceItemId(itemId);
    setDraftPrice(currentPrice ?? "");
    setItemPickerOpen(false);
    setPriceError(null);
  }

  function handleChangeDraftPrice(value: string) {
    setDraftPrice(value.replace(/[^\d.]/g, ""));
    setPriceError(null);
  }

  function handleSelectDate(value: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEffectiveDate(value);
    setDatePickerOpen(false);
  }

  async function handleSavePrice() {
    if (!priceBootstrap || !selectedPriceItemId || !currentPriceItem) {
      return;
    }

    const normalizedValue = draftPrice.trim();
    if (!isPositiveNumber(normalizedValue)) {
      setPriceError("Enter a valid numeric price before saving.");
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    const entries: { item_id: number; price_per_unit: string }[] = [];
    for (const item of priceBootstrap.items) {
      const rawValue = item.item_id === selectedPriceItemId ? normalizedValue : item.current_price ?? "";
      if (!isPositiveNumber(rawValue)) {
        setPriceError(`Missing a valid baseline price for ${item.item_name}.`);
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        return;
      }

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
      items: priceBootstrap.items.map((item) =>
        item.item_id === selectedPriceItemId ? { ...item, current_price: toMoneyString(normalizedValue) } : item,
      ),
    });

    try {
      await saveGlobalPriceBook({
        entries,
        price_date: effectiveDate,
      });
      closePriceSheet();
      showToast("success", `Price saved for ${currentPriceItem.item_name} effective ${effectiveDate}.`);
    } catch (error) {
      setPriceBootstrap(previousBootstrap);
      setPriceError(error instanceof Error ? error.message : "Unable to save price update.");
      showToast("error", error instanceof Error ? error.message : "Unable to save price update.");
    } finally {
      setSavingPrice(false);
    }
  }

  function handleQuickRefresh() {
    void loadDashboard(true);
  }

  const bottomNavOffset = 12 + insets.bottom;
  const fabOffset = 92 + insets.bottom;
  const bottomSpacer = 126 + insets.bottom;

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
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]} edges={["top", "left", "right"]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <View pointerEvents="none" style={styles.backgroundLayer}>
        <View style={[styles.heroGlow, { backgroundColor: palette.emeraldSoft }]} />
        <View style={[styles.goldGlow, { backgroundColor: palette.goldSoft }]} />
      </View>

      <ToastBanner toast={toast} palette={palette} animatedValue={toastAnimation} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: bottomSpacer }}
        stickyHeaderIndices={[2]}
        onScroll={(event) => handleScrollNavigation(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
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
        <View onLayout={(event) => updateSectionOffset("dashboard", event.nativeEvent.layout.y)}>
          <View
            style={[
              styles.heroCard,
              adminShadow(palette.shadow, 0.12, 16, 24),
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <View style={[styles.heroOverlay, { backgroundColor: "rgba(255,255,255,0.38)" }]} />
            <View style={[styles.heroOrbLarge, { backgroundColor: palette.goldSoft }]} />
            <View style={[styles.heroOrbSmall, { backgroundColor: palette.emeraldSoft }]} />
            <View style={[styles.heroAccentBar, { backgroundColor: palette.emerald }]} />

            <View style={styles.heroTopRow}>
              <View style={[styles.heroBadge, { backgroundColor: palette.emeraldSoft, borderColor: palette.emerald }]}>
                <Text style={[styles.heroBadgeText, { color: heroPrimaryTextColor }]}>SRI MAHALAKSHMI BROILERS</Text>
              </View>
              <View style={styles.heroActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Show notifications"
                  onPress={() => showToast("success", severeLogsCount > 0 ? `${severeLogsCount} alerts need review.` : "No new critical notifications.")}
                  style={[styles.iconButton, styles.heroIconButton, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}
                >
                  <MaterialCommunityIcons name="bell-outline" size={18} color={palette.textPrimary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Refresh dashboard"
                  onPress={handleQuickRefresh}
                  style={[styles.iconButton, styles.heroIconButton, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}
                >
                  <MaterialCommunityIcons name="refresh" size={18} color={palette.textPrimary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Logout"
                  onPress={handleLogout}
                  style={[styles.iconButton, styles.heroIconButton, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}
                >
                  <MaterialCommunityIcons name="logout" size={18} color={palette.textPrimary} />
                </Pressable>
              </View>
            </View>

            <Text style={[styles.heroTitle, { color: heroPrimaryTextColor }]}>Smart Billing & Revenue Management</Text>
            <Text style={[styles.heroSubtitle, { color: heroSecondaryTextColor }]}>
              Premium mobile command center for poultry billing, branch monitoring, and inventory flow.
            </Text>

            <View style={styles.heroFooter}>
              <View style={styles.heroChipRow}>
                <View style={[styles.liveChip, styles.heroIconButton, { backgroundColor: palette.goldSoft, borderColor: palette.border }]}>
                  <View style={[styles.liveDot, { backgroundColor: isOfflineSnapshot ? palette.gold : "#86EFAC" }]} />
                  <Text style={[styles.liveChipText, { color: heroPrimaryTextColor }]}>
                    {isOfflineSnapshot ? "Offline Snapshot" : "Live Sync"} {lastSyncAt ? formatRelativeTime(lastSyncAt) : ""}
                  </Text>
                </View>
                <View style={[styles.focusChip, styles.heroIconButton, { backgroundColor: palette.emeraldSoft, borderColor: palette.border }]}>
                  <Text style={[styles.focusChipLabel, { color: heroLabelTextColor }]}>Focus</Text>
                  <Text style={[styles.focusChipValue, { color: heroPrimaryTextColor }]}>{selectedShopName}</Text>
                </View>
              </View>
              <View style={styles.heroHighlightRow}>
                <View style={[styles.heroHighlightCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                  <Text style={[styles.heroHighlightLabel, { color: palette.textMuted }]}>Top Branch</Text>
                  <Text style={[styles.heroHighlightValue, { color: palette.textPrimary }]}>
                    {topShop ? topShop.shop.name : "No sales yet"}
                  </Text>
                </View>
                <View style={[styles.heroHighlightCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                  <Text style={[styles.heroHighlightLabel, { color: palette.textMuted }]}>Viewing</Text>
                  <Text style={[styles.heroHighlightValue, { color: palette.textPrimary }]}>{analyticsReferenceLabel}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.selectorStack}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose shop focus"
            onPress={toggleShopSelector}
            style={[
              styles.selectorCard,
              adminShadow(palette.shadow, 0.05, 8, 16),
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <View style={styles.selectorHeader}>
              <Text style={[styles.selectorLabel, { color: palette.textMuted }]}>SHOP NAME</Text>
              <MaterialCommunityIcons
                name={shopSelectorOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={palette.textPrimary}
              />
            </View>
            <Text style={[styles.selectorValue, { color: palette.textPrimary }]}>{selectedShopName}</Text>
            <Text style={[styles.selectorHint, { color: palette.textSecondary }]}>
              Keep the dashboard focused on one branch or switch back to the whole network instantly.
            </Text>
          </Pressable>

          {shopSelectorOpen ? (
            <View
              style={[
                styles.selectorDropdown,
                adminShadow(palette.shadow, 0.05, 8, 14),
                { backgroundColor: palette.card, borderColor: palette.border },
              ]}
            >
              <Pressable onPress={() => handleSelectShop(null)} style={styles.selectorOption}>
                <View>
                  <Text style={[styles.selectorOptionTitle, { color: palette.textPrimary }]}>All Branches</Text>
                  <Text style={[styles.selectorOptionSubtitle, { color: palette.textMuted }]}>Network-wide analytics</Text>
                </View>
                {!selectedShopId ? <MaterialCommunityIcons name="check-circle" size={18} color={palette.emerald} /> : null}
              </Pressable>

              {shops.map((shop) => (
                <Pressable key={shop.id} onPress={() => handleSelectShop(shop.id)} style={styles.selectorOption}>
                  <View>
                    <Text style={[styles.selectorOptionTitle, { color: palette.textPrimary }]}>{shop.name}</Text>
                    <Text style={[styles.selectorOptionSubtitle, { color: palette.textMuted }]}>
                      {shop.code} · {shop.is_active ? "Active" : "Disabled"}
                    </Text>
                  </View>
                  {selectedShopId === shop.id ? <MaterialCommunityIcons name="check-circle" size={18} color={palette.emerald} /> : null}
                </Pressable>
              ))}
            </View>
          ) : null}

          {dashboardError && shops.length > 0 ? (
            <View style={[styles.inlineBanner, { backgroundColor: palette.goldSoft, borderColor: palette.gold }]}>
              <MaterialCommunityIcons name="wifi-alert" size={18} color={palette.cash} />
              <Text style={[styles.inlineBannerText, { color: palette.textPrimary }]}>{dashboardError}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.toolbarWrap, { backgroundColor: palette.background }]}>
          <View
            style={[
              styles.toolbarCard,
              adminShadow(palette.shadow, 0.05, 8, 16),
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <View style={styles.toolbarHeader}>
              <Text style={[styles.toolbarTitle, { color: palette.textPrimary }]}>Date Filter</Text>
            </View>

            <View style={styles.segmentRow}>
              {PERIOD_OPTIONS.map((option) => {
                const active = analyticsPeriod === option.key;
                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`View ${option.label.toLowerCase()} analytics`}
                    onPress={() => handleSelectPeriod(option.key)}
                    style={[
                      styles.segmentButton,
                      {
                        backgroundColor: active ? palette.emerald : palette.surfaceMuted,
                        borderColor: active ? palette.emerald : palette.border,
                      },
                    ]}
                  >
                    <Text style={[styles.segmentText, { color: active ? "#FFFFFF" : palette.textSecondary }]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Choose ${analyticsPeriod} data`}
              onPress={toggleReferencePicker}
              style={[
                styles.referenceSelector,
                {
                  backgroundColor: palette.surfaceMuted,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.referenceSelectorText}>
                <Text style={[styles.referenceSelectorLabel, { color: palette.textMuted }]}>
                  Select {analyticsPeriod}
                </Text>
                <Text style={[styles.referenceSelectorValue, { color: palette.textPrimary }]}>
                  {analyticsReferenceLabel}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={referencePickerOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={palette.textSecondary}
              />
            </Pressable>

            {referencePickerOpen ? (
              <View
                style={[
                  styles.referenceDropdown,
                  {
                    backgroundColor: palette.card,
                    borderColor: palette.border,
                  },
                ]}
              >
                {analyticsReferenceOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelectReferenceDate(option.value)}
                    style={[
                      styles.referenceOption,
                      option.value === analyticsReferenceDate && {
                        backgroundColor: palette.emeraldSoft,
                      },
                    ]}
                  >
                    <Text style={[styles.referenceOptionText, { color: palette.textPrimary }]}>
                      {option.label}
                    </Text>
                    {option.value === analyticsReferenceDate ? (
                      <MaterialCommunityIcons name="check-circle" size={18} color={palette.emerald} />
                    ) : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.metricGrid}>
          <MetricCard
            label="Total Revenue"
            value={totalRevenue.toNumber()}
            formatter={(value) => formatCurrency(value)}
            note={`${analyticsReferenceLabel} revenue`}
            icon="cash-multiple"
            accent={palette.emerald}
            accentSoft={palette.emeraldSoft}
            sparklineValues={metricSparklineValues.revenue}
            palette={palette}
          />
          <MetricCard
            label="Number of Bills"
            value={visibleBills.length}
            formatter={(value) => `${Math.round(value)} Bills`}
            note={largestBill ? `Largest ${formatCurrency(largestBill.total_amount)}` : `No bills in ${analyticsReferenceLabel}`}
            icon="receipt-text-outline"
            accent={palette.gold}
            accentSoft={palette.goldSoft}
            sparklineValues={metricSparklineValues.bills}
            palette={palette}
          />
          <MetricCard
            label="Cash Collection"
            value={totalCash.toNumber()}
            formatter={(value) => formatCurrency(value)}
            note={`${cashShare.toFixed(0)}% of collections`}
            icon="wallet-outline"
            accent={palette.cash}
            accentSoft={palette.cashSoft}
            sparklineValues={metricSparklineValues.cash}
            palette={palette}
          />
          <MetricCard
            label="UPI Collection"
            value={totalUpi.toNumber()}
            formatter={(value) => formatCurrency(value)}
            note={`${Math.max(0, 100 - cashShare).toFixed(0)}% digital mix`}
            icon="qrcode-scan"
            accent={palette.upi}
            accentSoft={palette.upiSoft}
            sparklineValues={metricSparklineValues.upi}
            palette={palette}
          />
        </View>

        <View onLayout={(event) => updateSectionOffset("inventory", event.nativeEvent.layout.y)}>
          <SectionCard
            title="Items Sold"
            subtitle="Fast-moving items first, cleaner search, and compact sales visibility."
            collapsed={collapsedSections.inventory}
            onToggle={() => toggleSection("inventory")}
            action={
              <View style={styles.sectionBadge}>
                <Text style={[styles.sectionBadgeText, { color: palette.emeraldDark, backgroundColor: palette.emeraldSoft }]}>
                  {filteredItemSales.length} items
                </Text>
              </View>
            }
            palette={palette}
          >
            <View style={styles.sectionBody}>
              <SearchField
                value={itemSearch}
                onChangeText={setItemSearch}
                placeholder="Search items"
                accessibilityLabel="Search sold items"
                palette={palette}
              />
              {filteredItemSales.length === 0 ? (
                <EmptyStateCard
                  title="No item movement found"
                  subtitle="Try a different branch or search term to find item sales."
                  actionLabel="Clear Search"
                  onAction={() => setItemSearch("")}
                  icon="food-off-outline"
                  palette={palette}
                />
              ) : (
                <View style={styles.cardStack}>
                  {filteredItemSales.slice(0, collapsedSections.inventory ? 0 : 8).map((item, index) => {
                    const itemTotal = money(item.total_amount).toNumber();
                    const isHot = itemTotal >= itemRevenueAverage;
                    return (
                      <Pressable
                        key={item.item_id}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.item_name} sold ${getUnitLabel(item.base_unit, item.quantity_sold)} for ${formatCurrency(item.total_amount)}`}
                        onPress={() => triggerHaptic()}
                        style={({ pressed }) => [
                          styles.itemCard,
                          adminShadow(palette.shadow, 0.04, 8, 14),
                          {
                            backgroundColor: palette.surfaceMuted,
                            borderColor: palette.border,
                            marginTop: index === 0 ? 0 : 10,
                            transform: [{ scale: pressed ? 0.995 : 1 }],
                          },
                        ]}
                      >
                        <View style={[styles.itemIconWrap, { backgroundColor: palette.card }]}>
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
                            <View
                              style={[
                                styles.stateChip,
                                {
                                  backgroundColor: isHot ? palette.successSoft : palette.goldSoft,
                                },
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={isHot ? "trending-up" : "trending-neutral"}
                                size={14}
                                color={isHot ? palette.success : palette.cash}
                              />
                              <Text style={[styles.stateChipText, { color: isHot ? palette.success : palette.cash }]}>
                                {isHot ? "Hot" : "Steady"}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.itemAmount, { color: palette.textPrimary }]}>{formatCurrency(item.total_amount)}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => updateSectionOffset("reports", event.nativeEvent.layout.y)}>
          <SectionCard
            title="Performance Snapshot"
            subtitle="Cleaner business signals with less visual clutter and faster scanning."
            collapsed={collapsedSections.reports}
            onToggle={() => toggleSection("reports")}
            palette={palette}
          >
            <View style={styles.reportGrid}>
              <View style={[styles.reportCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                <Text style={[styles.reportLabel, { color: palette.textMuted }]}>Top Branch</Text>
                <Text style={[styles.reportValue, { color: palette.textPrimary }]}>{topShop ? topShop.shop.name : "No sales yet"}</Text>
                <Text style={[styles.reportHint, { color: palette.textSecondary }]}>
                  {topShop ? formatCurrency(topShop.totalSales) : "Revenue ranking appears once billing starts."}
                </Text>
              </View>

              <View style={[styles.reportCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                <Text style={[styles.reportLabel, { color: palette.textMuted }]}>Payment Mix</Text>
                <View style={[styles.progressTrack, { backgroundColor: palette.card }]}>
                  <View style={[styles.progressFill, { width: `${cashShare}%`, backgroundColor: palette.cash }]} />
                </View>
                <View style={styles.reportMetaRow}>
                  <Text style={[styles.reportHint, { color: palette.textSecondary }]}>Cash {cashShare.toFixed(0)}%</Text>
                  <Text style={[styles.reportHint, { color: palette.textSecondary }]}>UPI {Math.max(0, 100 - cashShare).toFixed(0)}%</Text>
                </View>
              </View>

    
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => updateSectionOffset("billing", event.nativeEvent.layout.y)}>
          <SectionCard
            title="Billing & Audit Feed"
            subtitle="Grouped transactions, compact filters, and severity-aware audit visibility."
            collapsed={collapsedSections.billing}
            onToggle={() => toggleSection("billing")}
            palette={palette}
          >
            <View style={styles.sectionBody}>
              <View style={styles.feedColumns}>
                <View style={styles.feedColumn}>
                  <SearchField
                    value={billSearch}
                    onChangeText={setBillSearch}
                    placeholder="Search bills"
                    accessibilityLabel="Search bills"
                    palette={palette}
                  />

                  {groupedBills.length === 0 ? (
                    <EmptyStateCard
                      title="No bills found"
                      subtitle="Try another search or branch focus to view receipts."
                      actionLabel="Clear Filters"
                      onAction={() => {
                        setBillSearch("");
                      }}
                      icon="receipt-text-remove-outline"
                      palette={palette}
                    />
                  ) : (
                    groupedBills.map((group) => (
                      <View key={group.label} style={styles.billGroup}>
                        <Text style={[styles.billGroupTitle, { color: palette.textMuted }]}>{group.label}</Text>
                        {group.entries.map((bill) => (
                          <View key={bill.bill_id} style={[styles.feedCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                            <View style={styles.feedHeader}>
                              <View style={styles.feedTextWrap}>
                                <Text style={[styles.feedTitle, { color: palette.textPrimary }]}>{bill.bill_no}</Text>
                                <Text style={[styles.feedSubtitle, { color: palette.textMuted }]}>{bill.shop_name}</Text>
                              </View>
                              <Text style={[styles.feedAmount, { color: palette.textPrimary }]}>{formatCurrency(bill.total_amount)}</Text>
                            </View>
                            <View style={styles.feedMetaRow}>
                              <Text style={[styles.feedMeta, { color: palette.textSecondary }]}>{formatDateTime(bill.created_at)}</Text>
                              <View style={[styles.stateChip, { backgroundColor: palette.successSoft }]}>
                                <Text style={[styles.stateChipText, { color: palette.success }]}>{bill.status}</Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.feedColumn}>
                  <SearchField
                    value={auditSearch}
                    onChangeText={setAuditSearch}
                    placeholder="Search audit events"
                    accessibilityLabel="Search audit events"
                    palette={palette}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {AUDIT_FILTER_OPTIONS.map((chip) => (
                        <ChipButton
                          key={chip.key}
                          label={chip.label}
                          active={auditFilter === chip.key}
                          onPress={() => setAuditFilter(chip.key)}
                          palette={palette}
                        />
                      ))}
                    </View>
                  </ScrollView>

                  {filteredAuditLogs.length === 0 ? (
                    <EmptyStateCard
                      title="No audit events found"
                      subtitle="Adjust the query or severity chips to surface more activity."
                      actionLabel="Reset Filters"
                      onAction={() => {
                        setAuditSearch("");
                        setAuditFilter("all");
                      }}
                      icon="clipboard-text-search-outline"
                      palette={palette}
                    />
                  ) : (
                    filteredAuditLogs.slice(0, 6).map((log) => {
                      const severity = getSeverityMeta(log, palette);
                      return (
                        <View key={log.id} style={[styles.auditCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                          <View style={[styles.auditIconWrap, { backgroundColor: severity.chipBackground }]}>
                            <MaterialCommunityIcons name={severity.icon as never} size={16} color={severity.chipText} />
                          </View>
                          <View style={styles.auditContent}>
                            <View style={styles.auditHeader}>
                              <Text style={[styles.auditTitle, { color: palette.textPrimary }]}>{log.action}</Text>
                              <View style={[styles.stateChip, { backgroundColor: severity.chipBackground }]}>
                                <Text style={[styles.stateChipText, { color: severity.chipText }]}>{severity.label}</Text>
                              </View>
                            </View>
                            <Text style={[styles.auditDescription, { color: palette.textSecondary }]}>{log.details}</Text>
                            <Text style={[styles.auditMeta, { color: palette.textMuted }]}>{formatDateTime(log.created_at)}</Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => updateSectionOffset("settings", event.nativeEvent.layout.y)}>
          <SectionCard
            title="Branch Control"
            subtitle="Safer branch controls, ranking, and clearer online/offline status."
            collapsed={collapsedSections.settings}
            onToggle={() => toggleSection("settings")}
            action={
              <PrimaryButton
                label="Create Shop"
                onPress={() => setModalOpen(true)}
                icon="store-plus-outline"
                variant="secondary"
                palette={palette}
              />
            }
            palette={palette}
          >
            <View style={styles.sectionBody}>
              {visibleShopRows.length === 0 ? (
                <EmptyStateCard
                  title="No branches available"
                  subtitle="Create a branch to start tracking sales and operations."
                  actionLabel="Create Branch"
                  onAction={() => setModalOpen(true)}
                  icon="store-off-outline"
                  palette={palette}
                />
              ) : (
                <View style={styles.cardStack}>
                  {visibleShopRows.map((row, index) => {
                    const statusColor =
                      row.status === "ACTIVE"
                        ? palette.success
                        : row.status === "IDLE"
                          ? palette.cash
                          : row.status === "DISABLED"
                            ? palette.danger
                            : palette.textMuted;
                    const rank = branchRanking.get(row.shop.id) ?? index + 1;

                    return (
                      <View
                        key={row.shop.id}
                        style={[
                          styles.branchCard,
                          adminShadow(palette.shadow, 0.04, 8, 14),
                          { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
                        ]}
                      >
                        <View style={styles.branchHeader}>
                          <View style={styles.branchTextWrap}>
                            <View style={styles.branchTitleRow}>
                              <View style={[styles.rankBadge, { backgroundColor: palette.emeraldSoft }]}>
                                <Text style={[styles.rankBadgeText, { color: palette.emeraldDark }]}>#{rank}</Text>
                              </View>
                              <Text style={[styles.branchName, { color: palette.textPrimary }]}>{row.shop.name}</Text>
                            </View>
                            <Text style={[styles.branchMeta, { color: palette.textMuted }]}>
                              {row.shop.code} · {row.shop.username}
                            </Text>
                          </View>
                          <View style={[styles.stateChip, { backgroundColor: `${statusColor}18` }]}>
                            <View style={[styles.onlineDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.stateChipText, { color: statusColor }]}>{row.status}</Text>
                          </View>
                        </View>

                        <View style={styles.branchMetricsRow}>
                          <View style={styles.branchMetric}>
                            <Text style={[styles.branchMetricLabel, { color: palette.textMuted }]}>Revenue</Text>
                            <Text style={[styles.branchMetricValue, { color: palette.textPrimary }]}>{formatCompactCurrency(row.totalSales)}</Text>
                          </View>
                          <View style={styles.branchMetric}>
                            <Text style={[styles.branchMetricLabel, { color: palette.textMuted }]}>Bills</Text>
                            <Text style={[styles.branchMetricValue, { color: palette.textPrimary }]}>{row.billCount}</Text>
                          </View>
                          <View style={styles.branchMetric}>
                            <Text style={[styles.branchMetricLabel, { color: palette.textMuted }]}>Last Active</Text>
                            <Text style={[styles.branchMetricValue, { color: palette.textPrimary }]}>{formatRelativeTime(row.lastActivityAt)}</Text>
                          </View>
                        </View>

                        <View style={[styles.branchFooter, { borderTopColor: palette.border }]}>
                          <View style={styles.branchFooterText}>
                            <Text style={[styles.branchFooterTitle, { color: palette.textPrimary }]}>Shop Access</Text>
                            <Text style={[styles.branchFooterSubtitle, { color: palette.textMuted }]}>
                              Enable or disable branch login without leaving this dashboard.
                            </Text>
                          </View>
                          <PrimaryButton
                            label={row.shop.is_active ? "Disable" : "Enable"}
                            onPress={() => void handleToggleShop(row.shop.id, !row.shop.is_active)}
                            variant={row.shop.is_active ? "secondary" : "primary"}
                            palette={palette}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </SectionCard>
        </View>
      </ScrollView>

      <BottomNav
        items={NAV_ITEMS.map((item) => ({ ...item, icon: item.icon as never }))}
        activeKey={activeNav}
        onSelect={scrollToSection}
        palette={palette}
        bottomOffset={bottomNavOffset}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open update price sheet"
        onPress={() => void openPriceSheet()}
        style={[
          styles.fab,
          adminShadow(palette.shadow, 0.14, 12, 18),
          { backgroundColor: palette.emerald, bottom: fabOffset },
        ]}
      >
        <MaterialCommunityIcons name="cash-edit" size={20} color="#FFFFFF" />
        <Text style={styles.fabLabel}>Update Price</Text>
      </Pressable>

      <PriceUpdateSheet
        visible={priceSheetOpen}
        onClose={closePriceSheet}
        palette={palette}
        bottomInset={insets.bottom}
        priceLoading={priceLoading}
        priceBootstrap={priceBootstrap}
        currentPriceItem={currentPriceItem}
        selectedPriceItemId={selectedPriceItemId}
        onSelectItem={handleSelectPriceItem}
        draftPrice={draftPrice}
        onChangeDraftPrice={handleChangeDraftPrice}
        priceError={priceError}
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
      />

      <CreateShopSheet
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        palette={palette}
        bottomInset={insets.bottom}
        creating={creating}
        form={form}
        onSubmit={form.handleSubmit(handleCreateShop)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGlow: {
    position: "absolute",
    top: -80,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 999,
  },
  goldGlow: {
    position: "absolute",
    bottom: 160,
    left: -44,
    width: 180,
    height: 180,
    borderRadius: 999,
  },
  heroCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
  },
  heroAccentBar: {
    position: "absolute",
    left: 20,
    top: 18,
    width: 58,
    height: 4,
    borderRadius: 999,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOrbLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    top: -26,
    right: -32,
  },
  heroOrbSmall: {
    position: "absolute",
    width: 116,
    height: 116,
    borderRadius: 999,
    bottom: -18,
    left: -18,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  heroBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  heroActions: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconButton: {
    borderWidth: 1,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.86)",
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  heroFooter: {
    marginTop: 20,
  },
  heroChipRow: {
    gap: 10,
  },
  heroHighlightRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  heroHighlightCard: {
    flex: 1,
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
    gap: 10,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  liveChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  focusChip: {
    alignSelf: "flex-start",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  focusChipLabel: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 11,
    fontWeight: "600",
  },
  focusChipValue: {
    color: "#FFFFFF",
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
    borderRadius: 24,
    padding: 18,
  },
  selectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  selectorValue: {
    marginTop: 10,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  selectorHint: {
    marginTop: 6,
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
  },
  selectorOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  selectorOptionSubtitle: {
    marginTop: 4,
    fontSize: 12,
  },
  inlineBanner: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    borderRadius: 24,
    padding: 16,
    gap: 14,
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
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sectionBadge: {
    justifyContent: "center",
  },
  sectionBadgeText: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "700",
  },
  sectionBody: {
    marginTop: 14,
    gap: 12,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 10,
  },
  cardStack: {
    gap: 0,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  itemIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
    gap: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  itemTextWrap: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  itemSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  itemAmount: {
    fontSize: 17,
    fontWeight: "800",
  },
  stateChip: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stateChipText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  reportGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  reportCard: {
    width: "48.2%",
    minWidth: 150,
    borderWidth: 1,
    borderRadius: 22,
    padding: 15,
    gap: 10,
  },
  reportLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  reportValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
  },
  reportHint: {
    fontSize: 12,
    lineHeight: 17,
  },
  progressTrack: {
    width: "100%",
    height: 10,
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
    gap: 18,
  },
  feedColumn: {
    gap: 12,
  },
  billGroup: {
    gap: 10,
  },
  billGroupTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  feedCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 9,
  },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  feedTextWrap: {
    flex: 1,
  },
  feedTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  feedSubtitle: {
    marginTop: 4,
    fontSize: 12,
  },
  feedAmount: {
    fontSize: 15,
    fontWeight: "800",
  },
  feedMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feedMeta: {
    fontSize: 12,
  },
  auditCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },
  auditIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  auditContent: {
    flex: 1,
    gap: 7,
  },
  auditHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  auditTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  auditDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  auditMeta: {
    fontSize: 12,
  },
  branchCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 15,
    gap: 14,
  },
  branchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  branchTextWrap: {
    flex: 1,
    gap: 4,
  },
  branchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rankBadge: {
    minWidth: 36,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  branchName: {
    fontSize: 15,
    fontWeight: "800",
  },
  branchMeta: {
    fontSize: 12,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  branchMetricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  branchMetric: {
    minWidth: 90,
    flex: 1,
    gap: 4,
  },
  branchMetricLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  branchMetricValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  branchFooter: {
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 12,
  },
  branchFooterText: {
    gap: 4,
  },
  branchFooterTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  branchFooterSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  fab: {
    position: "absolute",
    right: 18,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fabLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
});

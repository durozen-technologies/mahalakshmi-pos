import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createShop,
  deleteShop,
  fetchAuditLogs,
  fetchDailyBills,
  fetchGlobalPriceBootstrap,
  fetchItemSales,
  fetchPaymentSummary,
  fetchShop,
  fetchSalesSummary,
  fetchShops,
  saveGlobalDailyPrices,
  updateShop,
  updateShopStatus,
} from "@/api/admin";
import { toApiError } from "@/api/client";
import type {
  AdminBillSummary,
  AnalyticsPeriod,
  AuditLogRead,
  DailyPriceCreate,
  ItemSalesSummary,
  PaymentSplitSummary,
  ShopBootstrapResponse,
  ShopRead,
  ShopSalesSummary,
  ShopUpdate,
} from "@/types/api";

import { getShopStatus, type ShopOperationalState } from "../admin-dashboard-utils";

export type ShopDashboardRow = {
  shop: ShopRead;
  totalSales: string;
  cashTotal: string;
  upiTotal: string;
  billCount: number;
  lastActivityAt: string;
  status: ShopOperationalState;
};

type CreateBranchInput = {
  name: string;
  username: string;
  password: string;
  code?: string | null;
};

type UpdateBranchInput = ShopUpdate;

type UseAdminDashboardDataOptions = {
  analyticsPeriod: AnalyticsPeriod;
  analyticsReferenceDate: string;
  selectedShopId: number | null;
};

export function useAdminDashboardData({
  analyticsPeriod,
  analyticsReferenceDate,
  selectedShopId,
}: UseAdminDashboardDataOptions) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOfflineSnapshot, setIsOfflineSnapshot] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceBootstrap, setPriceBootstrap] = useState<ShopBootstrapResponse | null>(null);
  const [shops, setShops] = useState<ShopRead[]>([]);
  const [salesSummary, setSalesSummary] = useState<ShopSalesSummary[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSplitSummary[]>([]);
  const [dailyBills, setDailyBills] = useState<AdminBillSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRead[]>([]);
  const [itemSales, setItemSales] = useState<ItemSalesSummary[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (shops.length === 0) {
      setLoading(true);
    }

    try {
      const [shopsData, salesData, paymentsData, billsData, logsData, itemSalesData] = await Promise.all([
        fetchShops(),
        fetchSalesSummary(analyticsPeriod, analyticsReferenceDate),
        fetchPaymentSummary(analyticsPeriod, analyticsReferenceDate),
        fetchDailyBills(analyticsPeriod, analyticsReferenceDate),
        fetchAuditLogs(),
        fetchItemSales(analyticsPeriod, analyticsReferenceDate, selectedShopId),
      ]);

      setShops(shopsData);
      setSalesSummary(salesData);
      setPaymentSummary(paymentsData);
      setDailyBills(billsData);
      setAuditLogs(logsData);
      setItemSales(itemSalesData);
      setLastSyncAt(new Date().toISOString());
      setIsOfflineSnapshot(false);
      setDashboardError(null);
    } catch (error) {
      setIsOfflineSnapshot(true);
      setDashboardError(toApiError(error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [analyticsPeriod, analyticsReferenceDate, selectedShopId, shops.length]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const loadPriceBootstrap = useCallback(async (forceRefresh = false) => {
    if (priceBootstrap && !forceRefresh) {
      return priceBootstrap;
    }

    setPriceLoading(true);
    try {
      const bootstrap = await fetchGlobalPriceBootstrap();
      setPriceBootstrap(bootstrap);
      return bootstrap;
    } catch (error) {
      throw new Error(toApiError(error).message);
    } finally {
      setPriceLoading(false);
    }
  }, [priceBootstrap]);

  const billCountByShopId = useMemo(() => {
    const counts = new Map<number, number>();

    for (const bill of dailyBills) {
      counts.set(bill.shop_id, (counts.get(bill.shop_id) ?? 0) + 1);
    }

    return counts;
  }, [dailyBills]);

  const latestBillByShopId = useMemo(() => {
    const map = new Map<number, AdminBillSummary>();

    for (const bill of dailyBills) {
      const current = map.get(bill.shop_id);
      if (!current || new Date(current.created_at).getTime() < new Date(bill.created_at).getTime()) {
        map.set(bill.shop_id, bill);
      }
    }

    return map;
  }, [dailyBills]);

  const salesByShopId = useMemo(
    () => new Map(salesSummary.map((item) => [item.shop_id, item.total_sales])),
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

  const shopRows = useMemo<ShopDashboardRow[]>(() => {
    return shops.map((shop) => {
      const latestBill = latestBillByShopId.get(shop.id);
      const payment = paymentsByShopId.get(shop.id);
      const lastActivityAt = latestBill?.created_at ?? shop.created_at;

      return {
        shop,
        totalSales: salesByShopId.get(shop.id) ?? "0",
        cashTotal: payment?.cashTotal ?? "0",
        upiTotal: payment?.upiTotal ?? "0",
        billCount: billCountByShopId.get(shop.id) ?? 0,
        lastActivityAt,
        status: getShopStatus(shop, lastActivityAt),
      };
    });
  }, [billCountByShopId, latestBillByShopId, paymentsByShopId, salesByShopId, shops]);

  const selectedShopName = useMemo(
    () => (selectedShopId ? shops.find((shop) => shop.id === selectedShopId)?.name ?? "Selected Branch" : "All Branches"),
    [selectedShopId, shops],
  );

  const visibleShopRows = useMemo(
    () => (selectedShopId ? shopRows.filter((row) => row.shop.id === selectedShopId) : shopRows),
    [selectedShopId, shopRows],
  );

  const createBranch = useCallback(async (values: CreateBranchInput) => {
    try {
      await createShop(values);
      await loadDashboard(true);
    } catch (error) {
      throw new Error(toApiError(error).message);
    }
  }, [loadDashboard]);

  const toggleBranchStatus = useCallback(async (shop: ShopRead, isActive: boolean) => {
    try {
      await updateShopStatus(shop.id, { is_active: isActive });
      await loadDashboard(true);
    } catch (error) {
      throw new Error(toApiError(error).message);
    }
  }, [loadDashboard]);

  const updateBranch = useCallback(async (shop: ShopRead, values: UpdateBranchInput) => {
    try {
      await updateShop(shop.id, values);
      await loadDashboard(true);
    } catch (error) {
      throw new Error(toApiError(error).message);
    }
  }, [loadDashboard]);

  const loadBranch = useCallback(async (shopId: number) => {
    try {
      return await fetchShop(shopId);
    } catch (error) {
      throw new Error(toApiError(error).message);
    }
  }, []);

  const deleteBranch = useCallback(async (shop: ShopRead) => {
    try {
      await deleteShop(shop.id);
      await loadDashboard(true);
    } catch (error) {
      throw new Error(toApiError(error).message);
    }
  }, [loadDashboard]);

  const saveGlobalPriceBook = useCallback(async (payload: DailyPriceCreate) => {
    try {
      await saveGlobalDailyPrices(payload);
      await Promise.all([loadPriceBootstrap(true), loadDashboard(true)]);
    } catch (error) {
      throw new Error(toApiError(error).message);
    }
  }, [loadDashboard, loadPriceBootstrap]);

  return {
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
    paymentSummary,
    priceBootstrap,
    priceLoading,
    refreshing,
    salesSummary,
    saveGlobalPriceBook,
    selectedShopName,
    setPriceBootstrap,
    shopRows,
    shops,
    loadBranch,
    updateBranch,
    deleteBranch,
    toggleBranchStatus,
    visibleShopRows,
  };
}

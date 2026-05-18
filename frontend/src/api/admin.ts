import { apiClient } from "@/api/client";
import {
  AdminBillPage,
  AnalyticsPeriod,
  BillRead,
  DailyPriceCreate,
  DailyPriceRead,
  ItemSalesSummary,
  PaymentSplitSummary,
  ShopBootstrapResponse,
  ShopCreate,
  ShopRead,
  ShopSalesSummary,
  ShopStatusUpdate,
  ShopUpdate,
  AdminDashboardBootstrap,
} from "@/types/api";

export async function createShop(payload: ShopCreate) {
  const { data } = await apiClient.post<ShopRead>("/api/v1/admin/shops", payload);
  return data;
}

export async function fetchShops() {
  const { data } = await apiClient.get<ShopRead[]>("/api/v1/admin/shops");
  return data;
}

export async function updateShop(shopId: number, payload: ShopUpdate) {
  const { data } = await apiClient.patch<ShopRead>(`/api/v1/admin/shops/${shopId}`, payload);
  return data;
}

export async function updateShopStatus(shopId: number, payload: ShopStatusUpdate) {
  const { data } = await apiClient.patch<ShopRead>(`/api/v1/admin/shops/${shopId}/status`, payload);
  return data;
}

export async function fetchAdminBillDetail(billId: number) {
  const { data } = await apiClient.get<BillRead>(`/api/v1/admin/bills/${billId}`);
  return data;
}

export async function deleteShop(shopId: number) {
  await apiClient.delete(`/api/v1/admin/shops/${shopId}`);
}

export async function fetchSalesSummary(period: AnalyticsPeriod, referenceDate?: string) {
  const { data } = await apiClient.get<ShopSalesSummary[]>("/api/v1/admin/sales-summary", {
    params: { period, reference_date: referenceDate },
  });
  return data;
}

export async function fetchPaymentSummary(period: AnalyticsPeriod, referenceDate?: string) {
  const { data } = await apiClient.get<PaymentSplitSummary[]>("/api/v1/admin/payment-summary", {
    params: { period, reference_date: referenceDate },
  });
  return data;
}

export async function fetchDailyBills(
  period: AnalyticsPeriod,
  referenceDate?: string,
  shopId?: number | null,
  limit = 100,
  cursorCreatedAt?: string | null,
  cursorId?: number | null,
) {
  const { data } = await apiClient.get<AdminBillPage>("/api/v1/admin/bills", {
    params: {
      period,
      reference_date: referenceDate,
      shop_id: shopId ?? undefined,
      limit,
      cursor_created_at: cursorCreatedAt ?? undefined,
      cursor_id: cursorId ?? undefined,
    },
  });
  return data;
}

export async function fetchItemSales(period: AnalyticsPeriod, referenceDate?: string, shopId?: number | null) {
  const { data } = await apiClient.get<ItemSalesSummary[]>("/api/v1/admin/item-sales", {
    params: { period, reference_date: referenceDate, shop_id: shopId ?? undefined },
  });
  return data;
}

export async function fetchGlobalPriceBootstrap() {
  const { data } = await apiClient.get<ShopBootstrapResponse>("/api/v1/admin/prices/bootstrap");
  return data;
}

export async function saveGlobalDailyPrices(payload: DailyPriceCreate) {
  const { data } = await apiClient.post<DailyPriceRead[]>("/api/v1/admin/daily-prices", payload);
  return data;
}

export async function fetchShopPriceBootstrap(shopId: number) {
  const { data } = await apiClient.get<ShopBootstrapResponse>(`/api/v1/admin/shops/${shopId}/prices/bootstrap`);
  return data;
}

export async function saveShopDailyPrices(shopId: number, payload: DailyPriceCreate) {
  const { data } = await apiClient.post<DailyPriceRead[]>(`/api/v1/admin/shops/${shopId}/daily-prices`, payload);
  return data;
}

export async function fetchDashboardBootstrap(
  period: AnalyticsPeriod,
  referenceDate?: string,
  shopId?: number | null,
  limit = 50,
) {
  const { data } = await apiClient.get<AdminDashboardBootstrap>("/api/v1/admin/dashboard/bootstrap", {
    params: {
      period,
      reference_date: referenceDate,
      shop_id: shopId ?? undefined,
      bills_limit: limit,
    },
  });
  return data;
}

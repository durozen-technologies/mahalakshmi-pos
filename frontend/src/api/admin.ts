import { apiClient } from "@/api/client";
import {
  AdminBillSummary,
  AnalyticsPeriod,
  AuditLogRead,
  DailyPriceCreate,
  DailyPriceRead,
  ItemSalesSummary,
  PaymentSplitSummary,
  ShopBootstrapResponse,
  ShopCreate,
  ShopRead,
  ShopSalesSummary,
  ShopStatusUpdate,
} from "@/types/api";

export async function createShop(payload: ShopCreate) {
  const { data } = await apiClient.post<ShopRead>("/api/v1/admin/shops", payload);
  return data;
}

export async function fetchShops() {
  const { data } = await apiClient.get<ShopRead[]>("/api/v1/admin/shops");
  return data;
}

export async function updateShopStatus(shopId: number, payload: ShopStatusUpdate) {
  const { data } = await apiClient.patch<ShopRead>(`/api/v1/admin/shops/${shopId}/status`, payload);
  return data;
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

export async function fetchDailyBills(period: AnalyticsPeriod, referenceDate?: string) {
  const { data } = await apiClient.get<AdminBillSummary[]>("/api/v1/admin/bills", {
    params: { period, reference_date: referenceDate },
  });
  return data;
}

export async function fetchAuditLogs() {
  const { data } = await apiClient.get<AuditLogRead[]>("/api/v1/admin/audit-logs");
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

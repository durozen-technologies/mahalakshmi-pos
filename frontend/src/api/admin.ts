import { apiClient } from "@/api/client";
import {
  AdminBillSummary,
  AuditLogRead,
  PaymentSplitSummary,
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

export async function fetchSalesSummary() {
  const { data } = await apiClient.get<ShopSalesSummary[]>("/api/v1/admin/sales-summary");
  return data;
}

export async function fetchPaymentSummary() {
  const { data } = await apiClient.get<PaymentSplitSummary[]>("/api/v1/admin/payment-summary");
  return data;
}

export async function fetchDailyBills() {
  const { data } = await apiClient.get<AdminBillSummary[]>("/api/v1/admin/bills");
  return data;
}

export async function fetchAuditLogs() {
  const { data } = await apiClient.get<AuditLogRead[]>("/api/v1/admin/audit-logs");
  return data;
}

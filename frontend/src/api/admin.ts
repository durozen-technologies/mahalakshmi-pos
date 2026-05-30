import { apiClient } from "@/api/client";
import {
  AdminBillPage,
  AnalyticsPeriod,
  AdminDashboardBootstrap,
  BillRead,
  DailyPriceCreate,
  DailyPriceRead,
  DailyPriceUpdate,
  ItemCategoryCreate,
  ItemCategoryRead,
  ItemMetadataUpdate,
  ItemRead,
  ItemScope,
  ItemSalesSummary,
  PaymentSplitSummary,
  PriceStatus,
  ShopBootstrapResponse,
  ShopCreate,
  ShopItemAllocationUpdate,
  ShopItemPage,
  ShopItemRead,
  ShopRead,
  ShopSalesSummary,
  ShopStatusUpdate,
  ShopUpdate,
  UUID,
} from "@/types/api";

export async function createShop(payload: ShopCreate) {
  const { data } = await apiClient.post<ShopRead>("/api/v1/admin/shops", payload);
  return data;
}

export async function fetchShops() {
  const { data } = await apiClient.get<ShopRead[]>("/api/v1/admin/shops");
  return data;
}

export async function fetchItemCategories() {
  const { data } = await apiClient.get<ItemCategoryRead[]>("/api/v1/admin/item-categories");
  return data;
}

export async function createItemCategory(payload: ItemCategoryCreate) {
  const { data } = await apiClient.post<ItemCategoryRead>("/api/v1/admin/item-categories", payload);
  return data;
}

export async function deleteItemCategory(categoryId: UUID) {
  await apiClient.delete(`/api/v1/admin/item-categories/${categoryId}`);
}

export async function updateShop(shopId: UUID, payload: ShopUpdate) {
  const { data } = await apiClient.patch<ShopRead>(`/api/v1/admin/shops/${shopId}`, payload);
  return data;
}

export async function updateShopStatus(shopId: UUID, payload: ShopStatusUpdate) {
  const { data } = await apiClient.patch<ShopRead>(`/api/v1/admin/shops/${shopId}/status`, payload);
  return data;
}

export async function fetchAdminBillDetail(billId: UUID) {
  const { data } = await apiClient.get<BillRead>(`/api/v1/admin/bills/${billId}`);
  return data;
}

export async function deleteShop(shopId: UUID) {
  await apiClient.delete(`/api/v1/admin/shops/${shopId}`);
}

export type FetchShopItemsParams = {
  q?: string;
  scope?: ItemScope;
  allocated?: boolean;
  priced?: boolean;
  price_status?: PriceStatus;
  active?: boolean;
  limit?: number;
  cursor_group?: number | null;
  cursor_sort_order?: number | null;
  cursor_name?: string | null;
  cursor_id?: UUID | null;
};

export async function fetchShopItemsPage(shopId: UUID, params?: FetchShopItemsParams) {
  const { data } = await apiClient.get<ShopItemPage>(`/api/v1/admin/shops/${shopId}/items`, {
    params: {
      q: params?.q || undefined,
      scope: params?.scope,
      allocated: params?.allocated,
      priced: params?.priced,
      price_status: params?.price_status,
      active: params?.active,
      limit: params?.limit ?? 100,
      cursor_group: params?.cursor_group ?? undefined,
      cursor_sort_order: params?.cursor_sort_order ?? undefined,
      cursor_name: params?.cursor_name ?? undefined,
      cursor_id: params?.cursor_id ?? undefined,
    },
  });
  return data;
}

export async function fetchCatalogueItemsPage(params?: FetchShopItemsParams) {
  const { data } = await apiClient.get<ShopItemPage>("/api/v1/admin/items", {
    params: {
      q: params?.q || undefined,
      allocated: params?.allocated,
      active: params?.active,
      limit: params?.limit ?? 100,
      cursor_sort_order: params?.cursor_sort_order ?? undefined,
      cursor_name: params?.cursor_name ?? undefined,
      cursor_id: params?.cursor_id ?? undefined,
    },
  });
  return data;
}

export async function fetchCatalogueItem(itemId: UUID) {
  const { data } = await apiClient.get<ShopItemRead>(`/api/v1/admin/items/${itemId}`);
  return data;
}

export async function fetchShopItem(shopId: UUID, itemId: UUID) {
  const { data } = await apiClient.get<ShopItemRead>(`/api/v1/admin/shops/${shopId}/items/${itemId}`);
  return data;
}

export async function fetchShopItems(shopId: UUID, params?: FetchShopItemsParams) {
  const firstPage = await fetchShopItemsPage(shopId, params);
  return firstPage.items;
}

export async function createItem(payload: FormData) {
  const { data } = await apiClient.post<ItemRead>("/api/v1/admin/items", payload);
  return data;
}

export async function updateItem(itemId: UUID, payload: FormData) {
  const { data } = await apiClient.patch<ItemRead>(`/api/v1/admin/items/${itemId}`, payload);
  return data;
}

export async function updateItemMetadata(itemId: UUID, payload: ItemMetadataUpdate) {
  const { data } = await apiClient.patch<ItemRead>(`/api/v1/admin/items/${itemId}/metadata`, payload);
  return data;
}

export async function deleteItem(itemId: UUID) {
  await apiClient.delete(`/api/v1/admin/items/${itemId}`);
}

export async function createShopItem(shopId: UUID, payload: FormData) {
  const { data } = await apiClient.post<ItemRead>(`/api/v1/admin/shops/${shopId}/items`, payload);
  return data;
}

export async function updateShopItem(shopId: UUID, itemId: UUID, payload: FormData) {
  const { data } = await apiClient.patch<ItemRead>(`/api/v1/admin/shops/${shopId}/items/${itemId}`, payload);
  return data;
}

export async function updateShopItemMetadata(shopId: UUID, itemId: UUID, payload: ItemMetadataUpdate) {
  const { data } = await apiClient.patch<ItemRead>(`/api/v1/admin/shops/${shopId}/items/${itemId}/metadata`, payload);
  return data;
}

export async function deleteShopItem(shopId: UUID, itemId: UUID) {
  await apiClient.delete(`/api/v1/admin/shops/${shopId}/items/${itemId}`);
}

export async function deleteItemImage(itemId: UUID) {
  const { data } = await apiClient.delete(`/api/v1/admin/items/${itemId}/image`);
  return data;
}

export async function allocateShopItem(shopId: UUID, itemId: UUID) {
  const { data } = await apiClient.post<ShopItemRead>(`/api/v1/admin/shops/${shopId}/item-allocations/${itemId}`);
  return data;
}

export async function deallocateShopItem(shopId: UUID, itemId: UUID) {
  const { data } = await apiClient.delete<ShopItemRead>(`/api/v1/admin/shops/${shopId}/item-allocations/${itemId}`);
  return data;
}

export async function updateShopItemAllocation(shopId: UUID, itemId: UUID, payload: ShopItemAllocationUpdate) {
  const { data } = await apiClient.patch<ShopItemRead>(
    `/api/v1/admin/shops/${shopId}/item-allocations/${itemId}`,
    payload,
  );
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

export async function fetchDailyBills(
  period: AnalyticsPeriod,
  referenceDate?: string,
  shopId?: UUID | null,
  limit = 100,
  cursorCreatedAt?: string | null,
  cursorId?: UUID | null,
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

export async function fetchItemSales(period: AnalyticsPeriod, referenceDate?: string, shopId?: UUID | null) {
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

export async function fetchShopPriceBootstrap(shopId: UUID) {
  const { data } = await apiClient.get<ShopBootstrapResponse>(`/api/v1/admin/shops/${shopId}/prices/bootstrap`);
  return data;
}

export async function saveShopDailyPrices(shopId: UUID, payload: DailyPriceCreate) {
  const { data } = await apiClient.post<DailyPriceRead[]>(`/api/v1/admin/shops/${shopId}/daily-prices`, payload);
  return data;
}

export async function saveEditedShopDailyPrices(shopId: UUID, payload: DailyPriceCreate) {
  const { data } = await apiClient.patch<DailyPriceRead[]>(`/api/v1/admin/shops/${shopId}/daily-prices`, payload);
  return data;
}

export async function saveShopDailyPrice(shopId: UUID, itemId: UUID, payload: DailyPriceUpdate) {
  const { data } = await apiClient.put<DailyPriceRead>(
    `/api/v1/admin/shops/${shopId}/daily-prices/${itemId}`,
    payload,
  );
  return data;
}

export async function fetchDashboardBootstrap(
  period: AnalyticsPeriod,
  referenceDate?: string,
  shopId?: UUID | null,
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

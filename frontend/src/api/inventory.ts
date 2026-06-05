import { apiClient } from "@/api/client";
import {
  InventoryAddRequest,
  InventoryMovementCreateResult,
  InventoryMovementPage,
  InventoryMovementSplitCreateResult,
  InventoryStockRowsPage,
  InventorySummaryRead,
  InventoryUseRequest,
  InventoryUseSplitRequest,
  UUID,
} from "@/types/api";

export async function fetchShopInventory() {
  const { data } = await apiClient.get<InventorySummaryRead>("/api/v1/shop/inventory");
  return data;
}

export type FetchShopInventoryRowsParams = {
  q?: string;
  limit?: number;
  cursor_sort_order?: number | null;
  cursor_name?: string | null;
  cursor_id?: UUID | null;
};

export async function fetchShopInventoryRows(params?: FetchShopInventoryRowsParams, options: { signal?: AbortSignal } = {}) {
  const { data } = await apiClient.get<InventoryStockRowsPage>("/api/v1/shop/inventory/items/rows", {
    params: {
      q: params?.q || undefined,
      limit: params?.limit ?? 50,
      cursor_sort_order: params?.cursor_sort_order ?? undefined,
      cursor_name: params?.cursor_name ?? undefined,
      cursor_id: params?.cursor_id ?? undefined,
    },
    signal: options.signal,
  });
  return data;
}

export async function fetchShopInventoryMovements(limit = 30) {
  const { data } = await apiClient.get<InventoryMovementPage>("/api/v1/shop/inventory/movements", {
    params: { limit },
  });
  return data;
}

export async function addShopInventoryStock(itemId: UUID, payload: InventoryAddRequest) {
  const { data } = await apiClient.post<InventoryMovementCreateResult>(
    `/api/v1/shop/inventory/items/${itemId}/add`,
    payload,
  );
  return data;
}

export async function useShopInventoryStock(itemId: UUID, payload: InventoryUseRequest) {
  const { data } = await apiClient.post<InventoryMovementCreateResult>(
    `/api/v1/shop/inventory/items/${itemId}/use`,
    payload,
  );
  return data;
}

export async function useShopInventoryStockSplit(itemId: UUID, payload: InventoryUseSplitRequest) {
  const { data } = await apiClient.post<InventoryMovementSplitCreateResult>(
    `/api/v1/shop/inventory/items/${itemId}/use-split`,
    payload,
  );
  return data;
}

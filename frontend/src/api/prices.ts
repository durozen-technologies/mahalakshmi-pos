import { apiClient } from "@/api/client";
import { DailyPriceCreate, DailyPriceRead, ShopBootstrapResponse } from "@/types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeShopBootstrapResponse(payload: unknown): ShopBootstrapResponse {
  if (!isRecord(payload)) {
    throw new Error("Shop bootstrap response was not an object.");
  }

  const bootstrap = payload as unknown as ShopBootstrapResponse;

  return {
    ...bootstrap,
    items: Array.isArray(payload.items) ? payload.items : [],
  };
}

export async function fetchShopBootstrap() {
  const { data } = await apiClient.get<unknown>("/api/v1/shop/bootstrap");
  return normalizeShopBootstrapResponse(data);
}

export async function fetchTodayPrices() {
  const { data } = await apiClient.get<DailyPriceRead[]>("/api/v1/shop/daily-prices/today");
  return data;
}

export async function saveDailyPrices(payload: DailyPriceCreate) {
  const { data } = await apiClient.post<DailyPriceRead[]>("/api/v1/shop/daily-prices", payload);
  return data;
}

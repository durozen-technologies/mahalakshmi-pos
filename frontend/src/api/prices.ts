import { apiClient } from "@/api/client";
import { DailyPriceCreate, DailyPriceRead, ShopBootstrapResponse } from "@/types/api";

export async function fetchShopBootstrap() {
  const { data } = await apiClient.get<ShopBootstrapResponse>("/api/v1/shop/bootstrap");
  return data;
}

export async function fetchTodayPrices() {
  const { data } = await apiClient.get<DailyPriceRead[]>("/api/v1/shop/daily-prices/today");
  return data;
}

export async function saveDailyPrices(payload: DailyPriceCreate) {
  const { data } = await apiClient.post<DailyPriceRead[]>("/api/v1/shop/daily-prices", payload);
  return data;
}

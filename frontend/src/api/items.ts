import { fetchShopBootstrap } from "@/api/prices";

export async function fetchAvailableItems() {
  const bootstrap = await fetchShopBootstrap();
  return bootstrap.items;
}

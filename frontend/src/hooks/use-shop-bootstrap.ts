import { useEffect, useState } from "react";

import { toApiError } from "@/api/client";
import { fetchShopBootstrap, fetchTodayPrices } from "@/api/prices";
import { useAuthStore } from "@/store/auth-store";
import { usePriceStore } from "@/store/price-store";
import { ShopBootstrapResponse } from "@/types/api";

export function useShopBootstrap() {
  const user = useAuthStore((state) => state.user);
  const bootstrap = usePriceStore((state) => state.bootstrap);
  const setBootstrap = usePriceStore((state) => state.setBootstrap);
  const setTodayPrices = usePriceStore((state) => state.setTodayPrices);
  const [loading, setLoading] = useState(user?.role === "shop_account");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (user?.role !== "shop_account") {
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchShopBootstrap();
      setBootstrap(response);
      if (response.prices_set) {
        const prices = await fetchTodayPrices();
        setTodayPrices(prices);
      } else {
        setTodayPrices([]);
      }
      return response;
    } catch (err) {
      const message = toApiError(err).message;
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    bootstrap: bootstrap as ShopBootstrapResponse | null,
    loading,
    error,
    refresh,
  };
}

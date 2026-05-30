import { create } from "zustand";

import { DailyPriceRead, ShopBootstrapResponse } from "@/types/api";

type PriceState = {
  bootstrap: ShopBootstrapResponse | null;
  todayPrices: DailyPriceRead[];
  setBootstrap: (payload: ShopBootstrapResponse) => void;
  setTodayPrices: (prices: DailyPriceRead[]) => void;
  clear: () => void;
};

export const usePriceStore = create<PriceState>((set) => ({
  bootstrap: null,
  todayPrices: [],
  setBootstrap: (bootstrap) => set({ bootstrap }),
  setTodayPrices: (todayPrices) => set({ todayPrices }),
  clear: () =>
    set((state) =>
      state.bootstrap === null && state.todayPrices.length === 0
        ? state
        : { bootstrap: null, todayPrices: [] },
    ),
}));

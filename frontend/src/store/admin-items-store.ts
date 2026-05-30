import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { ADMIN_ITEMS_STORAGE_KEY } from "@/constants/config";
import type { UUID } from "@/types/api";
import { secureStorage } from "@/utils/secure-storage";

type AdminItemsState = {
  selectedShopId: UUID | null;
  setSelectedShopId: (selectedShopId: UUID | null) => void;
};

export const useAdminItemsStore = create<AdminItemsState>()(
  persist(
    (set) => ({
      selectedShopId: null,
      setSelectedShopId: (selectedShopId) => set({ selectedShopId }),
    }),
    {
      name: ADMIN_ITEMS_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ selectedShopId: state.selectedShopId }),
    },
  ),
);

import { create } from "zustand";

import { BillRead } from "@/types/api";

type ReceiptState = {
  lastBill: BillRead | null;
  setLastBill: (bill: BillRead) => void;
  clearLastBill: () => void;
};

export const useReceiptStore = create<ReceiptState>((set) => ({
  lastBill: null,
  setLastBill: (lastBill) => set({ lastBill }),
  clearLastBill: () => set({ lastBill: null }),
}));

import { apiClient } from "@/api/client";
import { BillCheckoutRequest, BillRead } from "@/types/api";

export async function checkoutBill(payload: BillCheckoutRequest) {
  const { data } = await apiClient.post<BillRead>("/api/v1/shop/bills", payload);
  return data;
}

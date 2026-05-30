import { apiClient } from "@/api/client";
import {
  BillCheckoutCommitRequest,
  BillCheckoutPreviewRead,
  BillCheckoutRequest,
  BillRead,
} from "@/types/api";

export async function previewBill(payload: BillCheckoutRequest) {
  const { data } = await apiClient.post<BillCheckoutPreviewRead>(
    "/api/v1/shop/bills/preview",
    payload,
  );
  return data;
}

export async function checkoutBill(payload: BillCheckoutCommitRequest) {
  const { data } = await apiClient.post<BillRead>("/api/v1/shop/bills", payload);
  return data;
}

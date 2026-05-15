import axios, { isAxiosError } from "axios";

import { API_BASE_URL, EXPO_TUNNEL_DETECTED } from "@/constants/config";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { usePriceStore } from "@/store/price-store";

export type ApiError = {
  message: string;
  status?: number;
};

function getNetworkFailureMessage() {
  if (EXPO_TUNNEL_DETECTED) {
    return `Cannot reach API at ${API_BASE_URL}. Expo tunnel shares the app bundle only, not your backend on port 8000. Set EXPO_PUBLIC_API_BASE_URL to a public URL for the backend, or switch Expo to LAN and use your computer's Wi-Fi IP.`;
  }

  return `Cannot reach API at ${API_BASE_URL}. Check that the backend is running and avoid localhost or 127.0.0.1 from Expo Go on Android. Use your computer's LAN IP or let the app rewrite it automatically.`;
}

function getErrorMessage(error: unknown) {
  if (!isAxiosError(error)) {
    if (error instanceof Error) {
      if (/network request failed|network error|failed to fetch/i.test(error.message)) {
        return getNetworkFailureMessage();
      }

      return error.message || "Something went wrong. Please try again.";
    }

    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }

    return "Something went wrong. Please try again.";
  }

  if (!error.response) {
    return getNetworkFailureMessage();
  }

  const detail = error.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item.msg).join(", ");
  }
  return error.message || "Request failed";
}

export function toApiError(error: unknown): ApiError {
  return {
    message: getErrorMessage(error),
    status: isAxiosError(error) ? error.response?.status : undefined,
  };
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().clearSession();
      useCartStore.getState().resetCart();
      usePriceStore.getState().clear();
    }
    return Promise.reject(error);
  },
);

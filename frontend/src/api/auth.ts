import { apiClient } from "@/api/client";
import { LoginRequest, LoginResponse, RegisterRequest, UserSession } from "@/types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getAuthErrorMessage(data: unknown) {
  if (!isRecord(data)) {
    return "";
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }
  if (typeof data.message === "string") {
    return data.message;
  }
  if (typeof data.error === "string") {
    return data.error;
  }

  return "";
}

export async function login(payload: LoginRequest) {
  const { data, status } = await apiClient.post<LoginResponse | unknown>(
    "/api/v1/auth/login",
    payload,
    {
      validateStatus: (responseStatus) =>
        (responseStatus >= 200 && responseStatus < 300) ||
        responseStatus === 401 ||
        responseStatus === 403,
    },
  );

  if (status === 401 || status === 403) {
    throw new Error(getAuthErrorMessage(data) || "Invalid username or password");
  }

  return data as LoginResponse;
}

export async function registerAdmin(payload: RegisterRequest) {
  const { data } = await apiClient.post<LoginResponse>("/api/v1/auth/register", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get<UserSession>("/api/v1/auth/me");
  return data;
}

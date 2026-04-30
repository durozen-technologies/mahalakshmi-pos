import { apiClient } from "@/api/client";
import { LoginRequest, LoginResponse, RegisterRequest, UserSession } from "@/types/api";

export async function login(payload: LoginRequest) {
  const { data } = await apiClient.post<LoginResponse>("/api/v1/auth/login", payload);
  return data;
}

export async function registerAdmin(payload: RegisterRequest) {
  const { data } = await apiClient.post<LoginResponse>("/api/v1/auth/register", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get<UserSession>("/api/v1/auth/me");
  return data;
}

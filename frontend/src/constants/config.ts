import Constants from "expo-constants";
import { Platform } from "react-native";

type ProcessEnvShape = {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

const envApiBaseUrl = (globalThis as ProcessEnvShape).process?.env?.EXPO_PUBLIC_API_BASE_URL?.trim();

type LocationShape = {
  location?: {
    hostname?: string;
  };
};

function isExpoTunnelHost(host: string) {
  const normalizedHost = host.trim().toLowerCase();

  return (
    normalizedHost.endsWith(".exp.direct") ||
    normalizedHost.endsWith(".exp.host") ||
    normalizedHost.includes("anonymous")
  );
}

function getExpoDevHost() {
  const hostUri = Constants.expoConfig?.hostUri;

  if (!hostUri) {
    return null;
  }

  const host = hostUri.split(":")[0] ?? null;
  if (!host || !isDirectlyReachableDevHost(host)) {
    return null;
  }

  return host;
}

function isPrivateIpv4Host(host: string) {
  return /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/.test(
    host,
  );
}

function isLoopbackHost(host: string) {
  const normalizedHost = host.trim().toLowerCase();

  return (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "::1" ||
    normalizedHost === "[::1]"
  );
}

function isDirectlyReachableDevHost(host: string) {
  const normalizedHost = host.trim().toLowerCase();

  if (!normalizedHost) {
    return false;
  }

  if (isLoopbackHost(normalizedHost)) {
    return true;
  }

  if (isExpoTunnelHost(normalizedHost)) {
    return false;
  }

  return isPrivateIpv4Host(normalizedHost);
}

function getWebHost() {
  return (globalThis as LocationShape).location?.hostname ?? null;
}

function getDefaultApiHost() {
  if (Platform.OS === "android") {
    return "10.0.2.2";
  }

  if (Platform.OS === "web") {
    return getWebHost() ?? "127.0.0.1";
  }

  const expoDevHost = getExpoDevHost();
  if (expoDevHost) {
    return expoDevHost;
  }

  return "127.0.0.1";
}

function withHttpProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `http://${value}`;
}

function normalizeApiBaseUrl(value: string) {
  const runtimeHost = getDefaultApiHost();

  try {
    const parsedUrl = new URL(withHttpProtocol(value));
    if (
      parsedUrl.hostname === "0.0.0.0" ||
      parsedUrl.hostname === "::" ||
      isLoopbackHost(parsedUrl.hostname)
    ) {
      parsedUrl.hostname = runtimeHost;
    }

    return parsedUrl.toString().replace(/\/$/, "");
  } catch {
    return withHttpProtocol(value)
      .replace("localhost", runtimeHost)
      .replace("127.0.0.1", runtimeHost)
      .replace("0.0.0.0", runtimeHost)
      .replace(/\/$/, "");
  }
}

export const EXPO_TUNNEL_DETECTED = Boolean(
  Constants.expoConfig?.hostUri && isExpoTunnelHost(Constants.expoConfig.hostUri.split(":")[0] ?? ""),
);

export const API_BASE_URL =
  envApiBaseUrl && envApiBaseUrl.length > 0
    ? normalizeApiBaseUrl(envApiBaseUrl)
    : `http://${getDefaultApiHost()}:8000`;
export const AUTH_STORAGE_KEY = "meat-billing-auth";

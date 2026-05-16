import Constants from "expo-constants";

type ProcessEnvShape = {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

type ExpoExtraShape = {
  expoPublicApiBaseUrl?: string;
};

const envApiBaseUrl = (globalThis as ProcessEnvShape).process?.env?.EXPO_PUBLIC_API_BASE_URL?.trim();

type ConstantsShape = typeof Constants & {
  manifest?: {
    extra?: ExpoExtraShape;
  };
  manifest2?: {
    extra?: ExpoExtraShape;
  };
};

function getExpoConfiguredApiBaseUrl() {
  const constants = Constants as ConstantsShape;

  return (
    (Constants.expoConfig?.extra as ExpoExtraShape | undefined)?.expoPublicApiBaseUrl?.trim() ||
    constants.manifest?.extra?.expoPublicApiBaseUrl?.trim() ||
    constants.manifest2?.extra?.expoPublicApiBaseUrl?.trim() ||
    ""
  );
}

const expoExtraApiBaseUrl = getExpoConfiguredApiBaseUrl();

function isExpoTunnelHost(host: string) {
  const normalizedHost = host.trim().toLowerCase();

  return (
    normalizedHost.endsWith(".exp.direct") ||
    normalizedHost.endsWith(".exp.host") ||
    normalizedHost.includes("anonymous")
  );
}

function withHttpProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `http://${value}`;
}

function normalizeApiBaseUrl(value: string) {
  if (!value.trim()) {
    return "";
  }

  try {
    return new URL(withHttpProtocol(value)).toString().replace(/\/$/, "");
  } catch {
    return withHttpProtocol(value).replace(/\/$/, "");
  }
}

export const EXPO_TUNNEL_DETECTED = Boolean(
  Constants.expoConfig?.hostUri && isExpoTunnelHost(Constants.expoConfig.hostUri.split(":")[0] ?? ""),
);

const configuredApiBaseUrl = envApiBaseUrl || expoExtraApiBaseUrl || "";

export const API_BASE_URL =
  normalizeApiBaseUrl(configuredApiBaseUrl);
export const AUTH_STORAGE_KEY = "meat-billing-auth";
export const PRINTER_STORAGE_KEY = "meat-billing-printer";
export const SHOP_LANGUAGE_STORAGE_KEY = "meat-billing-shop-language";
export const ADMIN_THEME_STORAGE_KEY = "meat-billing-admin-theme";

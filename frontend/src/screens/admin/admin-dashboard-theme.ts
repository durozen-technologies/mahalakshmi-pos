export type ThemePalette = {
  background: string;
  backgroundElevated: string;
  surfaceMuted: string;
  card: string;
  glass: string;
  glassBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primaryStrong: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  analytics: string;
  analyticsStrong: string;
  analyticsSoft: string;
  items: string;
  itemsStrong: string;
  itemsSoft: string;
  inventory: string;
  inventoryStrong: string;
  inventorySoft: string;
  billing: string;
  billingStrong: string;
  billingSoft: string;
  gold: string;
  goldSoft: string;
  settings: string;
  settingsStrong: string;
  settingsSoft: string;
  success: string;
  successSoft: string;
  cash: string;
  onCash: string;
  cashSoft: string;
  upi: string;
  upiSoft: string;
  danger: string;
  dangerSoft: string;
  shadow: string;
  overlay: string;
  navBackdrop: string;
  shell: string;
  shellBorder: string;
  onShell: string;
  onShellMuted: string;
  shellControl: string;
};

const DARK_ADMIN_PALETTE: ThemePalette = {
  background: "#0E0E0E",
  backgroundElevated: "#181818",
  surfaceMuted: "#202020",
  card: "#151515",
  glass: "rgba(255,255,255,0.08)",
  glassBorder: "rgba(255,255,255,0.16)",
  textPrimary: "#FFFFFF",
  textSecondary: "#E6E6E6",
  textMuted: "#A7A7A7",
  border: "rgba(255,255,255,0.15)",
  primaryStrong: "#FFB3B8",
  primary: "#cd686b",
  primarySoft: "rgba(244,63,70,0.18)",
  onPrimary: "#1A0003",
  analytics: "#FFFFFF",
  analyticsStrong: "#FFFFFF",
  analyticsSoft: "rgba(255,255,255,0.12)",
  items: "#28bc32",
  itemsStrong: "#FFCDD1",
  itemsSoft: "rgba(244,63,70,0.18)",
  inventory: "#147D52",
  inventoryStrong: "#7ede5e",
  inventorySoft: "rgba(20,125,82,0.18)",
  billing: "#147D52",
  billingStrong: "#5EDEA8",
  billingSoft: "rgba(20,125,82,0.18)",
  gold: "#147D52",
  goldSoft: "rgba(20,125,82,0.18)",
  settings: "#FFFFFF",
  settingsStrong: "#FFFFFF",
  settingsSoft: "rgba(255,255,255,0.12)",
  success: "#147D52",
  successSoft: "rgba(20,125,82,0.18)",
  cash: "#147D52",
  onCash: "#111111",
  cashSoft: "rgba(20,125,82,0.18)",
  upi: "#FFFFFF",
  upiSoft: "rgba(255,255,255,0.12)",
  danger: "#FF4D55",
  dangerSoft: "rgba(255,77,85,0.18)",
  shadow: "#000000",
  overlay: "rgba(0,0,0,0.72)",
  navBackdrop: "rgba(0,0,0,0.96)",
  shell: "#000000",
  shellBorder: "rgba(255,255,255,0.14)",
  onShell: "#FFFFFF",
  onShellMuted: "#CFCFCF",
  shellControl: "rgba(255,255,255,0.10)",
};

const LIGHT_ADMIN_PALETTE: ThemePalette = {
  background: "#F3F3F3",
  backgroundElevated: "#EDEDED",
  surfaceMuted: "#F8F8F8",
  card: "#FFFFFF",
  glass: "rgba(0,0,0,0.05)",
  glassBorder: "rgba(0,0,0,0.12)",
  textPrimary: "#111111",
  textSecondary: "#2E2E2E",
  textMuted: "#666666",
  border: "#D8D8D8",
  primaryStrong: "#8F000B",
  primary: "#C1121F",
  primarySoft: "#FFE5E8",
  onPrimary: "#FFFFFF",
  analytics: "#111111",
  analyticsStrong: "#000000",
  analyticsSoft: "#E9E9E9",
  items: "#C1121F",
  itemsStrong: "#8F000B",
  itemsSoft: "#FFE5E8",
  inventory: "#147D52",
  inventoryStrong: "#0F4A3C",
  inventorySoft: "#D4EFE8",
  billing: "#147D52",
  billingStrong: "#0F4A3C",
  billingSoft: "#D4EFE8",
  gold: "#147D52",
  goldSoft: "#D4EFE8",
  settings: "#111111",
  settingsStrong: "#000000",
  settingsSoft: "#E9E9E9",
  success: "#147D52",
  successSoft: "#D4EFE8",
  cash: "#147D52",
  onCash: "#111111",
  cashSoft: "#D4EFE8",
  upi: "#111111",
  upiSoft: "#E9E9E9",
  danger: "#C1121F",
  dangerSoft: "#FFE5E8",
  shadow: "#000000",
  overlay: "rgba(0,0,0,0.38)",
  navBackdrop: "rgba(255,255,255,0.96)",
  shell: "#FFFFFF",
  shellBorder: "#D8D8D8",
  onShell: "#111111",
  onShellMuted: "#666666",
  shellControl: "#F8F8F8",
};

export function getAdminPalette(colorScheme: "light" | "dark" | null | undefined): ThemePalette {
  return colorScheme === "dark" ? DARK_ADMIN_PALETTE : LIGHT_ADMIN_PALETTE;
}

export function adminShadow(color: string, opacity: number, radius: number, offsetHeight: number) {
  return {
    shadowColor: color,
    shadowOpacity: opacity * 0.72,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: Math.max(2, offsetHeight / 3) },
    elevation: Math.max(2, Math.round(offsetHeight / 4)),
  };
}

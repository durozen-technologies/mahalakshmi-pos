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
  emerald: string;
  emeraldDark: string;
  emeraldSoft: string;
  gold: string;
  goldSoft: string;
  success: string;
  successSoft: string;
  cash: string;
  cashSoft: string;
  upi: string;
  upiSoft: string;
  danger: string;
  dangerSoft: string;
  shadow: string;
  overlay: string;
  navBackdrop: string;
};

export function getAdminPalette(colorScheme: "light" | "dark" | null | undefined): ThemePalette {
  if (colorScheme === "dark") {
    return {
      background: "#081410",
      backgroundElevated: "#0F1E19",
      surfaceMuted: "#0D1814",
      card: "#10231D",
      glass: "rgba(255,255,255,0.08)",
      glassBorder: "rgba(255,255,255,0.16)",
      textPrimary: "#F8FAFC",
      textSecondary: "#CBD5E1",
      textMuted: "#94A3B8",
      border: "rgba(148,163,184,0.18)",
      emerald: "#22A67F",
      emeraldDark: "#C3F4E6",
      emeraldSoft: "rgba(34,166,127,0.18)",
      gold: "#F4B860",
      goldSoft: "rgba(244,184,96,0.16)",
      success: "#22C55E",
      successSoft: "rgba(34,197,94,0.16)",
      cash: "#F59E0B",
      cashSoft: "rgba(245,158,11,0.16)",
      upi: "#818CF8",
      upiSoft: "rgba(99,102,241,0.18)",
      danger: "#FB7185",
      dangerSoft: "rgba(244,63,94,0.16)",
      shadow: "#000000",
      overlay: "rgba(2,6,23,0.76)",
      navBackdrop: "rgba(8,20,16,0.94)",
    };
  }

  return {
    background: "#F5F7FA",
    backgroundElevated: "#ECF2F8",
    surfaceMuted: "#F8FAFC",
    card: "#FFFFFF",
    glass: "rgba(255,255,255,0.18)",
    glassBorder: "rgba(255,255,255,0.26)",
    textPrimary: "#1E293B",
    textSecondary: "#475569",
    textMuted: "#64748B",
    border: "#E2E8F0",
    emerald: "#0F8B6D",
    emeraldDark: "#0A5C49",
    emeraldSoft: "#D7F3EC",
    gold: "#F4B860",
    goldSoft: "#FFF1D8",
    success: "#16A34A",
    successSoft: "#DCFCE7",
    cash: "#F59E0B",
    cashSoft: "#FEF3C7",
    upi: "#6366F1",
    upiSoft: "#E0E7FF",
    danger: "#E11D48",
    dangerSoft: "#FFE4E6",
    shadow: "#0F172A",
    overlay: "rgba(15,23,42,0.42)",
    navBackdrop: "rgba(255,255,255,0.95)",
  };
}

export function adminShadow(color: string, opacity: number, radius: number, offsetHeight: number) {
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: offsetHeight / 2 },
    elevation: Math.max(4, Math.round(offsetHeight / 3)),
  };
}

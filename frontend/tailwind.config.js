/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./App.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F2F7F4", // Tinted neutral green
        ink: "#0A110D", // Deep green ink
        accent: "#0F7642", // Primary green
        accentDeep: "#0A5C32", // Strong green
        accentSoft: "#D7F0E0", // Soft green wash
        success: "#16A34A",
        successSoft: "#DCFCE7",
        warning: "#D97706",
        warningSoft: "#FEF3C7",
        danger: "#DC2626",
        dangerSoft: "#FEE2E2",
        card: "#FFFFFF",
        muted: "#4B6356", // Muted green text
        border: "#B4C7BC", // Tinted green border
        surface: "#E6EFE9", // Elevated green surface
      },
      borderRadius: {
        control: "8px",
        card: "12px",
      },
      boxShadow: {
        float: "0 4px 8px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
};

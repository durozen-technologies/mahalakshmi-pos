/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./App.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF9F1",
        ink: "#1F2937",
        accent: "#D97706",
        accentSoft: "#FDE7C3",
        successSoft: "#DCFCE7",
        warningSoft: "#FEF3C7",
        dangerSoft: "#FEE2E2",
        card: "#FFFFFF",
        muted: "#6B7280",
        border: "#E5E7EB",
        surface: "#FFFDF8",
      },
      borderRadius: {
        "4xl": "32px",
      },
      boxShadow: {
        pos: "0 12px 30px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

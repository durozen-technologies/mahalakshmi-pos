/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./App.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F7F1E8",
        ink: "#1E2B22",
        accent: "#244734",
        accentDeep: "#183224",
        accentSoft: "#DCE7DA",
        successSoft: "#DBEADF",
        warningSoft: "#F8E9C7",
        dangerSoft: "#F8DFD9",
        card: "#FFFCF7",
        muted: "#657366",
        border: "#D7DECF",
        surface: "#EEF2E8",
        sage: "#E4ECE0",
        sageDeep: "#AAB9A9",
        amber: "#A36A20",
      },
      borderRadius: {
        "4xl": "32px",
      },
      boxShadow: {
        pos: "0 18px 40px rgba(24, 50, 36, 0.10)",
        soft: "0 10px 24px rgba(24, 50, 36, 0.06)",
      },
    },
  },
  plugins: [],
};

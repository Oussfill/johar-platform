/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        johar: {
          gold: "#D4AF37",
          "gold-light": "#E8D48B",
          "gold-dark": "#B8960C",
          black: "#0A0A0A",
          "black-light": "#1A1A1A",
          "black-lighter": "#2A2A2A",
          "gray-dark": "#333333",
          "gray-mid": "#666666",
          "gray-light": "#999999",
          white: "#FFFFFF",
          success: "#4CAF50",
          warning: "#FF9800",
          danger: "#F44336",
          info: "#2196F3",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Arabic", "sans-serif"],
        arabic: ["Noto Sans Arabic", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

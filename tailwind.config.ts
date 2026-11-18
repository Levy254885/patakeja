import type { Config } from "tailwindcss";

// Visual language follows the reference designs: bright blue primary, soft blue-grey canvas, white rounded cards,
// pill navigation and filters, pastel status tints.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1D5FD8", 50: "#EAF1FE", 100: "#D6E4FC", 200: "#AEC9F8", 300: "#7FA8F2", 400: "#4D84E8", 500: "#2A6BDD", 600: "#1D5FD8", 700: "#174DB0", 800: "#133E8C", 900: "#0E2D66" },
        surface: { DEFAULT: "#EEF2F8", 50: "#F6F8FC", 100: "#EEF2F8", 200: "#E3E9F3" },
        charcoal: "#1A2233",
        accent: { DEFAULT: "#F2A33A", 50: "#FFF6E5", 100: "#FDE9C4", 600: "#D98A1E", 700: "#B06E12" },
        muted: "#6B7488",
        line: "#E6EAF2",
        danger: { DEFAULT: "#DC4A4A", 50: "#FDEEEE" },
        success: { DEFAULT: "#1E9E6A", 50: "#E6F7EF" },
        warning: { DEFAULT: "#D98A1E", 50: "#FFF6E5" },
        violet: { DEFAULT: "#6C4DF6", 50: "#EFEBFF" },
        pink: { DEFAULT: "#F472B6", 50: "#FFEAF5" },
        teal: { DEFAULT: "#4DB6B8", 50: "#E5F6F6" },
      },
      fontFamily: {
        heading: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: { DEFAULT: "10px", md: "12px", lg: "14px", xl: "18px", "2xl": "22px" },
      boxShadow: { card: "0 1px 2px rgba(26,34,51,0.04), 0 4px 14px rgba(26,34,51,0.04)", pop: "0 12px 32px rgba(26,34,51,0.14)" },
    },
  },
  plugins: [],
};

export default config;

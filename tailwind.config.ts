import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", md: "1.5rem" }, screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        forest: {
          DEFAULT: "#174B3B",
          50: "#EEF4F1",
          100: "#D9E7E1",
          200: "#B3CFC3",
          300: "#82AE9C",
          400: "#4F8A74",
          500: "#2C6A55",
          600: "#174B3B",
          700: "#133F32",
          800: "#0F3228",
          900: "#0B241D",
        },
        ivory: { DEFAULT: "#F4F1E9", 50: "#FAF8F3", 100: "#F4F1E9", 200: "#ECE7DA" },
        charcoal: "#242923",
        gold: { DEFAULT: "#B99A65", 50: "#F8F3EA", 100: "#EFE5D2", 600: "#9E8052", 700: "#826841" },
        muted: "#777D76",
        line: "#E8E8E2",
        danger: { DEFAULT: "#B3382C", 50: "#FBEDEB" },
        success: { DEFAULT: "#2C6A55", 50: "#EEF4F1" },
        warning: { DEFAULT: "#9E7A2E", 50: "#FAF3E1" },
      },
      fontFamily: {
        heading: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: { DEFAULT: "6px", md: "8px", lg: "10px", xl: "12px" },
      boxShadow: { card: "0 1px 2px rgba(36,41,35,0.05)", pop: "0 8px 24px rgba(36,41,35,0.12)" },
    },
  },
  plugins: [],
};

export default config;

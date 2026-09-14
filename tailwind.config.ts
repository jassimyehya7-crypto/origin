import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ec: {
          // Brand tokens (Épicerie Club)
          ink: "#171B15",
          yellow: "#EAFF4F",
          blue: "#255CFF",
          green: "#0CAF68",
          red: "#EB4A3F",
          paper: "#F5F6F2",
          surface: "#FFFFFF",
          rule: "#DDE1D8",
          muted: "#71776D",
          soft: "#ECEFE8",
          // Aliases for existing class names across client / pro / fondateur
          dark: "#171B15",
          bright: "#0CAF68",
          leaf: "#0CAF68",
          orange: "#EB4A3F",
          bg: "#F5F6F2",
          line: "#DDE1D8",
        },
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
        display: ["Arial Black", "Arial", "Helvetica", "sans-serif"],
      },
      boxShadow: {
        card: "0 14px 34px rgba(23, 27, 21, 0.12)",
        soft: "0 8px 20px rgba(23, 27, 21, 0.08)",
        none: "none",
      },
      borderRadius: {
        control: "12px",
        card: "20px",
        panel: "24px",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;

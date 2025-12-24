import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a", // Slate 950
        foreground: "#f8fafc", // Slate 50
        proveniq: {
          panel: "#1e293b",    // Slate 800
          accent: "#0ea5e9",   // Sky 500
          success: "#10b981",  // Emerald 500
          risk: "#f59e0b",     // Amber 500
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        glass:
          "linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.4) 100%)",
      },
      boxShadow: {
        glow: "0 0 20px 0 rgba(14, 165, 233, 0.4)",
        "glow-success": "0 0 20px 0 rgba(16, 185, 129, 0.4)",
        "glow-risk": "0 0 20px 0 rgba(245, 158, 11, 0.4)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;

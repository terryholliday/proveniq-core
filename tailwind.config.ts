import type { Config } from "tailwindcss";
import { PROVENIQ_DNA } from "./lib/config";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: [PROVENIQ_DNA.theme.fonts.ui, "sans-serif"],
                mono: [PROVENIQ_DNA.theme.fonts.data, "monospace"],
            },
            colors: {
                background: PROVENIQ_DNA.theme.colors.bg,
                panel: PROVENIQ_DNA.theme.colors.panel,
                accent: PROVENIQ_DNA.theme.colors.accent,
                success: PROVENIQ_DNA.theme.colors.success,
            },
            transitionTimingFunction: {
                "ease-heavy": `cubic-bezier(${PROVENIQ_DNA.theme.motion.easeHeavy.join(", ")})`,
            },
        },
    },
    plugins: [],
};
export default config;

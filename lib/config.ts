export type ProductRole = "Ingest" | "Verify" | "Adjudicate" | "Liquidate" | "Orchestrate" | "Finance" | "Secure" | "Track";
export type ProductCategory = "Software" | "Infrastructure" | "Hardware";

export interface ProductModule {
  id: string;
  label: string;
  type: ProductCategory;
  role: ProductRole;
  routeSlug: string;
  docSlug: string;
}

export interface ProveniqConfig {
  products: ProductModule[];
  theme: {
    fonts: { ui: string; data: string };
    colors: { bg: string; panel: string; accent: string; success: string };
    motion?: { easeHeavy: number[] };
  };
}

export const PROVENIQ_DNA: ProveniqConfig = {
  products: [
    { id: "home", label: "Home", type: "Software", role: "Ingest", routeSlug: "home", docSlug: "proveniq-home" },
    { id: "ledger", label: "Ledger", type: "Software", role: "Verify", routeSlug: "ledger", docSlug: "proveniq-ledger" },
    { id: "claims-iq", label: "ClaimsIQ", type: "Software", role: "Adjudicate", routeSlug: "claims-iq", docSlug: "proveniq-claims-iq" },
    { id: "bids", label: "Bids", type: "Software", role: "Liquidate", routeSlug: "bids", docSlug: "proveniq-bids" },
    { id: "core", label: "Core", type: "Infrastructure", role: "Orchestrate", routeSlug: "core", docSlug: "proveniq-core" },
    { id: "capital", label: "Capital", type: "Infrastructure", role: "Finance", routeSlug: "capital", docSlug: "proveniq-capital" },
    { id: "locker", label: "Lockers", type: "Hardware", role: "Secure", routeSlug: "locker", docSlug: "anti-fraud-locker" },
    { id: "smart-tag", label: "SmartTags", type: "Hardware", role: "Track", routeSlug: "smart-tag", docSlug: "smart-tag-system" }
  ],
  theme: {
    fonts: { ui: "var(--font-inter)", data: "var(--font-jetbrains)" },
    colors: { bg: "#0f172a", panel: "#1e293b", accent: "#0ea5e9", success: "#10b981" },
    motion: { easeHeavy: [0.22, 1, 0.36, 1] }
  }
} as const;

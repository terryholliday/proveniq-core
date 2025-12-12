export const PROVENIQ_DNA = {
  products: [
    { id: "home", label: "Home", type: "Software", role: "Ingest", routeSlug: "home", docSlug: "proveniq-home" },
    { id: "ledger", label: "Ledger", type: "Software", role: "Verify", routeSlug: "ledger", docSlug: "proveniq-ledger" },
    { id: "claims-iq", label: "ClaimsIQ", type: "Software", role: "Adjudicate", routeSlug: "claims-iq", docSlug: "proveniq-claims-iq" },
    { id: "bids", label: "Bids", type: "Software", role: "Liquidate", routeSlug: "bids", docSlug: "proveniq-bids" },
    { id: "core", label: "Core", type: "Infrastructure", role: "Orchestrate", routeSlug: "core", docSlug: "proveniq-core" },
    { id: "capital", label: "Capital", type: "Infrastructure", role: "Finance", routeSlug: "capital", docSlug: "proveniq-capital" },
    { id: "locker", label: "Locker", type: "Hardware", role: "Secure", routeSlug: "locker", docSlug: "anti-fraud-locker" },
    { id: "smart-tag", label: "SmartTags", type: "Hardware", role: "Track", routeSlug: "smart-tag", docSlug: "smart-tag-system" }
  ],
  theme: {
    fonts: { ui: "Inter", data: "JetBrains Mono" },
    colors: {
      bg: "slate-950",
      panel: "slate-900",
      accent: "sky-500",
      success: "emerald-500"
    },
    motion: {
      easeHeavy: [0.22, 1, 0.36, 1]
    }
  }
} as const;

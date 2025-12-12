/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  PROVENIQ DNA - THE SOURCE OF TRUTH                                          ║
 * ║  ═══════════════════════════════════════════════════════════════════════════ ║
 * ║                                                                              ║
 * ║  This file defines the canonical configuration for the Proveniq ecosystem.   ║
 * ║  All product modules, their roles, and routing are defined here.             ║
 * ║                                                                              ║
 * ║  THE 8-NODE ECOSYSTEM:                                                       ║
 * ║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
 * ║  │  SOFTWARE          INFRASTRUCTURE         HARDWARE                      │ ║
 * ║  │  ─────────         ──────────────         ────────                      │ ║
 * ║  │  Home (Ingest)     Core (Orchestrate)     Locker (Secure)               │ ║
 * ║  │  Ledger (Verify)   Capital (Finance)      SmartTags (Track)             │ ║
 * ║  │  ClaimsIQ (Adjudicate)                                                  │ ║
 * ║  │  Bids (Liquidate)                                                       │ ║
 * ║  └─────────────────────────────────────────────────────────────────────────┘ ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { ProveniqConfig } from "./types";

/**
 * PROVENIQ_DNA - The immutable configuration constant.
 *
 * This is the single source of truth for:
 * - Product registry
 * - Routing configuration
 * - Documentation mapping
 * - Theme variables
 */
export const PROVENIQ_DNA: ProveniqConfig = {
  products: [
    // ═══════════════════════════════════════════════════════════════════════════
    // SOFTWARE LAYER - User-facing applications
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: "home",
      label: "Home",
      type: "Software",
      role: "Ingest",
      routeSlug: "home",
      docSlug: "proveniq-home",
    },
    {
      id: "ledger",
      label: "Ledger",
      type: "Software",
      role: "Verify",
      routeSlug: "ledger",
      docSlug: "proveniq-ledger",
    },
    {
      id: "claims-iq",
      label: "ClaimsIQ",
      type: "Software",
      role: "Adjudicate",
      routeSlug: "claims-iq",
      docSlug: "proveniq-claims-iq",
    },
    {
      id: "bids",
      label: "Bids",
      type: "Software",
      role: "Liquidate",
      routeSlug: "bids",
      docSlug: "proveniq-bids",
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // INFRASTRUCTURE LAYER - Backend services
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: "core",
      label: "Core",
      type: "Infrastructure",
      role: "Orchestrate",
      routeSlug: "core",
      docSlug: "proveniq-core",
    },
    {
      id: "capital",
      label: "Capital",
      type: "Infrastructure",
      role: "Finance",
      routeSlug: "capital",
      docSlug: "proveniq-capital",
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // HARDWARE LAYER - Physical devices & IoT
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: "locker",
      label: "Locker",
      type: "Hardware",
      role: "Secure",
      routeSlug: "locker",
      docSlug: "anti-fraud-locker",
    },
    {
      id: "smart-tag",
      label: "SmartTags",
      type: "Hardware",
      role: "Track",
      routeSlug: "smart-tag",
      docSlug: "smart-tag-system",
    },
  ],

  theme: {
    fonts: {
      ui: "var(--font-inter)",
      data: "var(--font-jetbrains)",
    },
    colors: {
      bg: "#0f172a",
      panel: "#1e293b",
      accent: "#0ea5e9",
      success: "#10b981",
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Get all products */
export const getProducts = () => PROVENIQ_DNA.products;

/** Get products by category */
export const getProductsByType = (type: "Software" | "Infrastructure" | "Hardware") =>
  PROVENIQ_DNA.products.filter((p) => p.type === type);

/** Get product by ID */
export const getProductById = (id: string) =>
  PROVENIQ_DNA.products.find((p) => p.id === id);

/** Get product by route slug */
export const getProductByRoute = (routeSlug: string) =>
  PROVENIQ_DNA.products.find((p) => p.routeSlug === routeSlug);

/** Get theme configuration */
export const getTheme = () => PROVENIQ_DNA.theme;

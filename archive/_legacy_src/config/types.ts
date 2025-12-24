/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  PROVENIQ DNA - TYPE DEFINITIONS                                             ║
 * ║  ═══════════════════════════════════════════════════════════════════════════ ║
 * ║                                                                              ║
 * ║  The canonical type system for the Proveniq product ecosystem.               ║
 * ║  This is the source of truth for product taxonomy.                           ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

/**
 * ProductRole defines the functional responsibility of each module
 * in the Proveniq ecosystem. Each role maps to a specific stage
 * in the asset lifecycle.
 *
 * - Ingest:      Data entry point (Home)
 * - Verify:      Validation & audit trail (Ledger)
 * - Adjudicate:  Claims processing & dispute resolution (ClaimsIQ)
 * - Liquidate:   Asset disposition & marketplace (Bids)
 * - Orchestrate: Central nervous system (Core)
 * - Finance:     Capital operations & treasury (Capital)
 * - Secure:      Physical asset protection (Locker)
 * - Track:       IoT & asset tracking (SmartTags)
 */
export type ProductRole =
  | "Ingest"
  | "Verify"
  | "Adjudicate"
  | "Liquidate"
  | "Orchestrate"
  | "Finance"
  | "Secure"
  | "Track";

/**
 * ProductCategory classifies modules by their deployment model.
 *
 * - Software:       Cloud-hosted applications
 * - Infrastructure: Backend services & APIs
 * - Hardware:       Physical devices & IoT
 */
export type ProductCategory = "Software" | "Infrastructure" | "Hardware";

/**
 * ProductModule represents a single product in the Proveniq ecosystem.
 */
export interface ProductModule {
  /** Unique identifier (kebab-case) */
  id: string;

  /** Display name for UI */
  label: string;

  /** Deployment category */
  type: ProductCategory;

  /** Functional role in the ecosystem */
  role: ProductRole;

  /** URL path segment for routing */
  routeSlug: string;

  /** Documentation identifier */
  docSlug: string;
}

/**
 * Theme configuration for consistent UI across products.
 */
export interface ThemeConfig {
  fonts: {
    /** Primary UI font (headings, labels) */
    ui: string;
    /** Monospace font for data display */
    data: string;
  };
  colors: {
    /** Background color */
    bg: string;
    /** Panel/card background */
    panel: string;
    /** Primary accent color */
    accent: string;
    /** Success state color */
    success: string;
  };
}

/**
 * ProveniqConfig is the root configuration object.
 * This defines the entire product ecosystem.
 */
export interface ProveniqConfig {
  /** All product modules in the ecosystem */
  products: ProductModule[];

  /** Global theme configuration */
  theme: ThemeConfig;
}

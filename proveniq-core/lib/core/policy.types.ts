// --- POLICY PRIMITIVES ---

export type ScoreBucket =
    | "identity"
    | "provenance"
    | "condition"
    | "liquidity"
    | "fraud_risk" // Special case: Higher can mean higher risk or safety depending on context. Spec says 1.0 = High Risk.
    | "core_confidence";

export type DisclosureLevel = "NONE" | "SUMMARY" | "FULL";

export type Decision =
    | "VERIFIED"
    | "VERIFIED_WITH_DISCLOSURE" // New P7
    | "REVIEW_REQUIRED"
    | "REJECTED"
    | "REVOKED"
    | "EXPIRED";

export interface CorePolicy {
    id: string;
    version: string;

    // Disclosure: How much transparency for "soft" risks?
    disclosure: DisclosureLevel;

    weights: {
        identity: number;
        provenance: number;
        condition: number;
        liquidity: number;
        fraudSafety: number;
    };

    thresholds: {
        identity: number;
        provenance: number;
        condition: number;
        liquidity: number;
        coreConfidence: number;
        maxFraudRisk: number;
    };

    // Decay Rules (P7.T3)
    // We define them here conceptually now.
    decay: {
        review_days: number;           // Days until REVIEW_REQUIRED
        expire_days: number;           // Days until EXPIRED
        locker_extension_days: number; // Bonus days if in locker
    };
}

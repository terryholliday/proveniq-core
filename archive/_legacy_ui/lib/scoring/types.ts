/**
 * Proveniq-Core Scoring Schema v1.0 (Investor-Grade Strict)
 * Types & Interfaces
 */

export type SignalSource = 'HOME_APP' | 'LOCKER' | 'SMARTTAG' | 'HUMAN' | 'PARTNER_API';

export interface Signal {
    id: string; // Stable, versioned signal ID
    value: number; // 0..1 normalized
    confidence: number; // 0..1 reliability of the signal itself
    source: SignalSource;
    timestamp: string; // ISO
    evidence_refs?: string[];
    description?: string;
}

export type ConfidenceBand = "LOW" | "MEDIUM" | "HIGH";

export type Decision =
    | "VERIFIED"
    | "REVIEW_REQUIRED"
    | "REJECTED"
    | "REVOKED"
    | "EXPIRED";

export type ScoreBucket =
    | "identity"
    | "provenance"
    | "condition"
    | "liquidity"
    | "fraud_risk"
    | "core_confidence";

export interface FactorContribution {
    factor_id: string;
    title: string;
    bucket: Exclude<ScoreBucket, "core_confidence">;
    weight: number;              // 0..1
    contribution: number;        // signed, typically -1..1
    signals_used: string[];
    evidence_refs: string[];     // "obs:...", "evt:..."
    notes?: string;
}

export interface DecisionResponse {
    asset_id: string;
    policy_id: string;

    // Strict Record of scores
    scores: Record<ScoreBucket, number>; // 0..1 except fraud_risk (0..1 risk)

    decision: Decision;
    confidence_band: ConfidenceBand;

    // Explainability
    top_factors: FactorContribution[];   // ranked by |contribution|

    required_actions: Array<{
        action_id: string;
        label: string;
        reason: string;
        evidence_needed?: string[];
    }>;

    audit: {
        score_model_version: string;  // e.g., "score.v1"
        policy_version: string;       // e.g., "insurer.v1"
        computed_at: string;          // ISO
        ledger_event_id?: string;     // link into Event Ledger
    };
}

// Inputs for normalization/engine usage
export interface AssetInputs {
    opticalMatch?: number;
    serialMatch?: boolean;
    custodyEvents?: number;
    custodyGaps?: boolean;
    conditionRating?: 'A' | 'B' | 'C' | 'D' | 'F';
    marketVolume?: number;
    tamperEvents?: number;
    geoMismatch?: boolean;
    conditionReportDate?: Date | null;
}

export interface Policy {
    id: string;
    version: string;
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
        coreConfidence: number;
        maxFraudRisk: number;
    };
}

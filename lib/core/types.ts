/**
 * Proveniq-Core Authority Contracts
 * Version: 1.0.0 (Investor-Grade)
 * 
 * Strict typing for the System of Record.
 * No UI logic allowed here. Pure domain models.
 */

// --- 1. CORE PRIMITIVES ---

import { CorePolicy, Decision, ScoreBucket } from "./policy.types";

export { CorePolicy, Decision, ScoreBucket };

// Alias for backward compatibility during refactor
export type Policy = CorePolicy;

// --- 1. CORE PRIMITIVES ---

export type ConfidenceBand = "LOW" | "MEDIUM" | "HIGH";

// Decision & ScoreBucket moved to policy.types.ts

export type SignalSource = "HOME_APP" | "LOCKER" | "SMARTTAG" | "HUMAN" | "PARTNER_API";


// --- 2. SIGNAL & FACTOR MODEL ---

export interface Signal {
    id: string;
    value: number; // 0..1
    confidence: number; // 0..1
    source: SignalSource;
    timestamp: string; // ISO
    evidence_refs?: string[];
}

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


// --- 3. DECISION RESPONSE CONTRACT ---

export interface DecisionResponse {
    asset_id: string;
    policy_id: string;

    // Scores: 0..1 for all buckets. 
    // fraud_risk: 1.0 = Max Risk. 
    // core_confidence: 1.0 = Max Confidence.
    scores: Record<ScoreBucket, number>;

    decision: Decision;
    confidence_band: ConfidenceBand;

    top_factors: FactorContribution[];   // ranked by |contribution| desc

    required_actions: Array<{
        action_id: string;
        label: string;
        reason: string;
        evidence_needed?: string[];
    }>;

    audit: {
        score_model_version: string;
        policy_version: string;
        computed_at: string;          // ISO
        ledger_event_id?: string;     // Link to immutable log
    };
}


// --- 5. INPUTS (For Normalization) ---

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


// --- 6. LEDGER SCHEMA ---

export type LedgerEventType =
    | "ASSET_CREATED"
    | "OBSERVATION_ADDED"
    | "SIGNALS_COMPUTED"
    | "SCORES_COMPUTED"
    | "DECISION_RECORDED"
    | "DECISION_REVOKED"
    | "TRANSFER_RECORDED";

export interface LedgerEvent {
    event_id: string;          // ULID
    asset_id: string;
    type: LedgerEventType;
    occurred_at: string;       // ISO
    actor: {
        kind: "SYSTEM" | "USER" | "DEVICE" | "PARTNER";
        id: string;
    };

    // Immutability & Chaining
    prev_event_id?: string;
    payload_hash: string;      // SHA-256(payload)

    payload: Record<string, any>;
}

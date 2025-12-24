import {
    AssetInputs,
    Decision,
    DecisionResponse,
    CorePolicy,
    ConfidenceBand
} from "./types";
import { normalizeSignals, computeFactors, computeScores } from "./scoring";
import { calculateDecay } from "./decay";

/**
 * CORE DECISION ENGINE (v3: Decay Awareness)
 * 
 * Orchestrates the full evaluation pipeline:
 * Inputs -> Signals -> Factors -> Scores -> Policy Gates -> Time Decay -> Decision
 */
export function evaluateAsset(
    assetId: string,
    inputs: AssetInputs,
    policy: CorePolicy,
    ledgerEventId?: string
): DecisionResponse {

    // 1. Normalize Inputs to Signals
    const signals = normalizeSignals(inputs);

    // 2. Compute Weighted Factors
    const factors = computeFactors(signals);

    // 3. Compute Bucket Scores and Composite
    const scores = computeScores(factors, policy);

    // 4. Score-Based Decision (Sanapshot-in-time)
    let decision: Decision = 'VERIFIED';
    let confidenceBand: ConfidenceBand = 'HIGH';

    // --- HARD FAILS (Red Lines) ---
    if (scores.identity < policy.thresholds.identity) decision = 'REJECTED';
    else if (scores.provenance < policy.thresholds.provenance) decision = 'REJECTED';
    else if (scores.condition < policy.thresholds.condition) decision = 'REJECTED';
    else if (scores.liquidity < policy.thresholds.liquidity) decision = 'REJECTED';
    else if (scores.fraud_risk > policy.thresholds.maxFraudRisk) decision = 'REJECTED';

    // --- SOFT FAILS (Review Needed) ---
    else if (scores.core_confidence < policy.thresholds.coreConfidence) {
        decision = 'REVIEW_REQUIRED';
        confidenceBand = 'LOW';
    }
    else if (scores.core_confidence < 0.85) {
        confidenceBand = 'MEDIUM';
    }

    // 5. Apply Confidence Decay (Time-Based)
    // Only degrade valid or review-state decisions (Rejected stays rejected)
    const decayResult = calculateDecay(policy, inputs, decision);
    decision = decayResult.decayedDecision;

    // 6. Generate Recommendations
    const requiredActions: DecisionResponse['required_actions'] = [];

    // Map Decay Reason to Action
    if (decayResult.isStale && decayResult.decayReason) {
        if (decision === 'EXPIRED') {
            requiredActions.push({
                action_id: 'act_renew_scan',
                label: 'Renew Verification',
                reason: decayResult.decayReason
            });
        }
        else if (decision === 'REVIEW_REQUIRED') {
            requiredActions.push({
                action_id: 'act_stale_data',
                label: 'Data Refresh Required',
                reason: decayResult.decayReason
            });
        }
        else if (decision === 'VERIFIED_WITH_DISCLOSURE') {
            requiredActions.push({
                action_id: 'act_disclosure',
                label: 'Notice to Buyer',
                reason: decayResult.decayReason
            });
            // Lower confidence band if disclosed
            confidenceBand = 'LOW';
        }
    }

    if (decision === 'REJECTED') {
        requiredActions.push({
            action_id: 'act_quarantine',
            label: 'Immediate Quarantine',
            reason: 'Critical Policy Failure (Identity/Fraud/Provenance/Liquidity)'
        });
    }

    if (decision === 'REVIEW_REQUIRED' && !decayResult.isStale) {
        requiredActions.push({
            action_id: 'act_manual_audit',
            label: 'Manual Inspection',
            reason: `Confidence (${(scores.core_confidence * 100).toFixed(0)}%) below policy threshold`
        });

        // Specific drills
        if (scores.identity < 0.9) requiredActions.push({ action_id: 'act_ID_verify', label: 'Re-verify Identity', reason: 'Identity score weak' });
        if (scores.condition < 0.7) requiredActions.push({ action_id: 'act_condition_report', label: 'New Condition Report', reason: 'Physical grade low' });
        if (scores.liquidity < 0.6) requiredActions.push({ action_id: 'act_market_comps', label: 'Refresh Market Comps', reason: 'Liquidity score weak' });
    }

    // 7. Construct Final Response
    return {
        asset_id: assetId,
        policy_id: policy.id,
        scores,
        decision,
        confidence_band: confidenceBand,
        top_factors: factors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
        required_actions: requiredActions,
        audit: {
            score_model_version: "core.score.v2.1",
            policy_version: policy.version,
            computed_at: new Date().toISOString(),
            ledger_event_id: ledgerEventId
        }
    };
}

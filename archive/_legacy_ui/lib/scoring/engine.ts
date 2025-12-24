import { AssetInputs, DecisionResponse, FactorContribution, Signal, Decision, Policy } from "./types";

/**
 * Normalizes Raw Inputs into Signals [0..1]
 */
function normalizeSignals(inputs: AssetInputs): Signal[] {
    const signals: Signal[] = [];
    const ts = new Date().toISOString();

    // Optical Match
    signals.push({
        id: "optical_match",
        value: inputs.opticalMatch ?? 0,
        confidence: 0.95,
        source: "HOME_APP",
        timestamp: ts
    });

    // Custody Integrity
    signals.push({
        id: "custody_integrity",
        value: inputs.custodyGaps ? 0 : 1, // Binary
        confidence: 1.0,
        source: "PARTNER_API",
        timestamp: ts
    });

    // Market Liquidity
    let liquidityVal = 0;
    const vol = inputs.marketVolume ?? 0;
    if (vol > 100000) liquidityVal = 1;
    else if (vol > 10000) liquidityVal = 0.7;
    else if (vol > 1000) liquidityVal = 0.4;
    signals.push({
        id: "market_depth",
        value: liquidityVal,
        confidence: 0.8,
        source: "PARTNER_API",
        timestamp: ts
    });

    // Fraud Signals
    if (inputs.tamperEvents && inputs.tamperEvents > 0) {
        signals.push({ id: "tamper_detected", value: 1.0, confidence: 1.0, source: "LOCKER", timestamp: ts });
    }
    if (inputs.geoMismatch) {
        signals.push({ id: "geo_mismatch", value: 1.0, confidence: 0.9, source: "SMARTTAG", timestamp: ts });
    }

    // Condition Rating
    const ratingMap = { 'A': 1.0, 'B': 0.85, 'C': 0.70, 'D': 0.50, 'F': 0.0 };
    signals.push({
        id: "condition_report",
        value: ratingMap[inputs.conditionRating || 'F'],
        confidence: 0.9,
        source: "HUMAN",
        timestamp: ts
    });

    return signals;
}

/**
 * Core Deterministic Engine (Strict Type Compliance)
 */
export function evaluateAsset(assetId: string, inputs: AssetInputs, policy: Policy, ledgerEventId?: string): DecisionResponse {
    const signals = normalizeSignals(inputs);
    const factors: FactorContribution[] = [];

    // --- BUCKET 1: IDENTITY ---
    const sOptical = signals.find(s => s.id === 'optical_match');
    const fIdentity: FactorContribution = {
        factor_id: "identity_optical",
        title: "Optical Fingerprint",
        bucket: "identity",
        weight: 1.0,
        contribution: (sOptical?.value || 0),
        signals_used: ["optical_match"],
        evidence_refs: ["obs:img:scan_01"]
    };
    factors.push(fIdentity);
    const scoreIdentity = fIdentity.contribution;


    // --- BUCKET 2: PROVENANCE ---
    const sCustody = signals.find(s => s.id === 'custody_integrity');
    const fProvenance: FactorContribution = {
        factor_id: "custody_chain",
        title: "Custody Continuity",
        bucket: "provenance",
        weight: 1.0,
        contribution: (sCustody?.value || 0),
        signals_used: ["custody_integrity"],
        evidence_refs: []
    };
    factors.push(fProvenance);
    const scoreProvenance = fProvenance.contribution;


    // --- BUCKET 3: CONDITION ---
    const sCondition = signals.find(s => s.id === 'condition_report');
    const fCondition: FactorContribution = {
        factor_id: "condition_rating",
        title: "Physical Grade",
        bucket: "condition",
        weight: 1.0,
        contribution: (sCondition?.value || 0),
        signals_used: ["condition_report"],
        evidence_refs: ["doc:condition_report_v1"]
    };
    factors.push(fCondition);
    const scoreCondition = fCondition.contribution;


    // --- BUCKET 4: LIQUIDITY ---
    const sLiquidity = signals.find(s => s.id === 'market_depth');
    const fLiquidity: FactorContribution = {
        factor_id: "market_volume",
        title: "Market Depth",
        bucket: "liquidity",
        weight: 1.0,
        contribution: (sLiquidity?.value || 0),
        signals_used: ["market_depth"],
        evidence_refs: []
    };
    factors.push(fLiquidity);
    const scoreLiquidity = fLiquidity.contribution;


    // --- BUCKET 5: FRAUD (Risk Inversion) ---
    let fraudRiskSum = 0;
    const sTamper = signals.find(s => s.id === 'tamper_detected');
    if (sTamper) {
        factors.push({
            factor_id: "tamper_risk",
            title: "Tamper Event",
            bucket: "fraud_risk",
            weight: 1.0,
            contribution: -1.0, // Negative impact
            signals_used: ["tamper_detected"],
            evidence_refs: ["evt:sensor_alert_01"]
        });
        fraudRiskSum += 1.0;
    }
    const sGeo = signals.find(s => s.id === 'geo_mismatch');
    if (sGeo) {
        factors.push({
            factor_id: "geo_risk",
            title: "Geolocation Mismatch",
            bucket: "fraud_risk",
            weight: 0.5,
            contribution: -0.5,
            signals_used: ["geo_mismatch"],
            evidence_refs: ["obs:gps_01"]
        });
        fraudRiskSum += 0.5;
    }

    const scoreFraudRisk = Math.min(1.0, fraudRiskSum);
    const scoreFraudSafety = 1.0 - scoreFraudRisk;


    // --- COMPOSITE SCORE ---
    const weightedSum =
        (scoreIdentity * policy.weights.identity) +
        (scoreProvenance * policy.weights.provenance) +
        (scoreCondition * policy.weights.condition) +
        (scoreLiquidity * policy.weights.liquidity) +
        (scoreFraudSafety * policy.weights.fraudSafety);

    const weightsTotal = Object.values(policy.weights).reduce((a, b) => a + b, 0);
    const coreConfidence = weightsTotal > 0 ? weightedSum / weightsTotal : 0;


    // --- DECISION LOGIC ---
    let decision: Decision = 'VERIFIED';
    let confidenceBand: DecisionResponse['confidence_band'] = 'HIGH';

    if (scoreIdentity < policy.thresholds.identity) decision = 'REJECTED';
    else if (scoreProvenance < policy.thresholds.provenance) decision = 'REJECTED';
    else if (scoreFraudRisk > policy.thresholds.maxFraudRisk) decision = 'REJECTED';

    else if (coreConfidence < policy.thresholds.coreConfidence) {
        decision = 'REVIEW_REQUIRED';
        confidenceBand = 'LOW';
    }
    else if (coreConfidence < 0.85) {
        confidenceBand = 'MEDIUM';
    }

    // Required Actions
    const requiredActions: DecisionResponse['required_actions'] = [];
    if (decision === 'REJECTED') {
        requiredActions.push({
            action_id: 'act_quarantine',
            label: "Immediate Quarantine",
            reason: "Critical Trust Failure"
        });
    }
    if (decision === 'REVIEW_REQUIRED') {
        requiredActions.push({
            action_id: 'act_manual_review',
            label: "Manual Inspection",
            reason: "Confidence below threshold"
        });
    }

    return {
        asset_id: assetId,
        policy_id: policy.id,
        scores: {
            identity: scoreIdentity,
            provenance: scoreProvenance,
            condition: scoreCondition,
            liquidity: scoreLiquidity,
            fraud_risk: scoreFraudRisk,
            core_confidence: coreConfidence
        },
        decision,
        confidence_band: confidenceBand,
        top_factors: factors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
        required_actions: requiredActions,
        audit: {
            score_model_version: "score.v1.0",
            policy_version: policy.version,
            computed_at: new Date().toISOString(),
            ledger_event_id: ledgerEventId
        }
    };
}

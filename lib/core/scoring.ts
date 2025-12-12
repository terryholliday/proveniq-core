import {
    AssetInputs,
    FactorContribution,
    Policy,
    ScoreBucket,
    Signal,
    SignalSource
} from "./types";

/**
 * 1. SIGNAL NORMALIZATION
 * Converts raw heterogeneous inputs into normalized 0..1 signals.
 */
export function normalizeSignals(inputs: AssetInputs): Signal[] {
    const signals: Signal[] = [];
    const ts = new Date().toISOString();

    // OPTICAL
    if (inputs.opticalMatch !== undefined) {
        signals.push({
            id: "optical_match",
            value: Math.max(0, Math.min(1, inputs.opticalMatch)),
            confidence: 0.95,
            source: "HOME_APP",
            timestamp: ts,
            evidence_refs: ["obs:img:optical_scan_01"]
        });
    }

    // SERIAL
    if (inputs.serialMatch !== undefined) {
        signals.push({
            id: "serial_match",
            value: inputs.serialMatch ? 1.0 : 0.0,
            confidence: 1.0,
            source: "HUMAN",
            timestamp: ts
        });
    }

    // CUSTODY
    if (inputs.custodyGaps !== undefined) {
        signals.push({
            id: "custody_integrity",
            value: inputs.custodyGaps ? 0.0 : 1.0,
            confidence: 1.0,
            source: "PARTNER_API",
            timestamp: ts
        });
    }

    // MARKET DEPTH (Log Scale)
    if (inputs.marketVolume !== undefined) {
        let val = 0;
        if (inputs.marketVolume > 100000) val = 1.0;
        else if (inputs.marketVolume > 10000) val = 0.7;
        else if (inputs.marketVolume > 1000) val = 0.4;

        signals.push({
            id: "market_depth",
            value: val,
            confidence: 0.8,
            source: "PARTNER_API",
            timestamp: ts
        });
    }

    // CONDITION
    if (inputs.conditionRating) {
        const map: Record<string, number> = { 'A': 1.0, 'B': 0.85, 'C': 0.70, 'D': 0.50, 'F': 0.0 };
        signals.push({
            id: "condition_report",
            value: map[inputs.conditionRating] || 0,
            confidence: 0.9,
            source: "HUMAN",
            timestamp: ts,
            evidence_refs: ["doc:condition_report_v1"]
        });
    }

    // RISK SIGNALS (Tamper, Geo)
    if (inputs.tamperEvents && inputs.tamperEvents > 0) {
        signals.push({
            id: "tamper_detected",
            value: 1.0, // Signal existence = 1.0 (True)
            confidence: 1.0,
            source: "LOCKER",
            timestamp: ts,
            evidence_refs: ["evt:sensor_alert_01"]
        });
    }
    if (inputs.geoMismatch) {
        signals.push({
            id: "geo_mismatch",
            value: 1.0,
            confidence: 0.9,
            source: "SMARTTAG",
            timestamp: ts,
            evidence_refs: ["obs:gps_01"]
        });
    }

    return signals;
}


/**
 * 2. FACTOR COMPUTATION
 * Maps Signals to Weighted Factors based on Business Logic.
 */
export function computeFactors(signals: Signal[]): FactorContribution[] {
    const factors: FactorContribution[] = [];

    // --- IDENTITY BUCKET ---
    const sOptical = signals.find(s => s.id === 'optical_match');
    if (sOptical) {
        factors.push({
            factor_id: "identity_optical",
            title: "Optical Fingerprint",
            bucket: "identity",
            weight: 1.0,
            contribution: sOptical.value,
            signals_used: [sOptical.id],
            evidence_refs: sOptical.evidence_refs || []
        });
    }

    const sSerial = signals.find(s => s.id === 'serial_match');
    if (sSerial) {
        factors.push({
            factor_id: "identity_serial",
            title: "Serial Verification",
            bucket: "identity",
            weight: 0.5,
            contribution: sSerial.value,
            signals_used: [sSerial.id],
            evidence_refs: []
        });
    }

    // --- PROVENANCE BUCKET ---
    const sCustody = signals.find(s => s.id === 'custody_integrity');
    if (sCustody) {
        factors.push({
            factor_id: "custody_chain",
            title: "Custody Continuity",
            bucket: "provenance",
            weight: 1.0,
            contribution: sCustody.value,
            signals_used: [sCustody.id],
            evidence_refs: []
        });
    }

    // --- CONDITION BUCKET ---
    const sCondition = signals.find(s => s.id === 'condition_report');
    if (sCondition) {
        factors.push({
            factor_id: "condition_rating",
            title: "Physical Grade",
            bucket: "condition",
            weight: 1.0,
            contribution: sCondition.value,
            signals_used: [sCondition.id],
            evidence_refs: sCondition.evidence_refs || []
        });
    }

    // --- LIQUIDITY BUCKET ---
    const sLiquidity = signals.find(s => s.id === 'market_depth');
    if (sLiquidity) {
        factors.push({
            factor_id: "market_volume",
            title: "Market Depth",
            bucket: "liquidity",
            weight: 1.0,
            contribution: sLiquidity.value,
            signals_used: [sLiquidity.id],
            evidence_refs: []
        });
    }

    // --- FRAUD RISK BUCKET (Negative Contributors) ---
    const sTamper = signals.find(s => s.id === 'tamper_detected');
    if (sTamper) {
        factors.push({
            factor_id: "tamper_risk",
            title: "Tamper Event",
            bucket: "fraud_risk",
            weight: 1.0,
            contribution: -1.0, // MAX NEGATIVE IMPACT
            signals_used: [sTamper.id],
            evidence_refs: sTamper.evidence_refs || []
        });
    }

    const sGeo = signals.find(s => s.id === 'geo_mismatch');
    if (sGeo) {
        factors.push({
            factor_id: "geo_risk",
            title: "Geolocation Mismatch",
            bucket: "fraud_risk",
            weight: 0.5,
            contribution: -0.5,
            signals_used: [sGeo.id],
            evidence_refs: sGeo.evidence_refs || []
        });
    }

    return factors;
}


/**
 * 3. SCORE AGGREGATION
 * Aggregates Factors into Buckets and computes Composite.
 */
export function computeScores(factors: FactorContribution[], policy: Policy): Record<ScoreBucket, number> {

    // Initialize Buckets
    const scores: Record<ScoreBucket, number> = {
        identity: 0,
        provenance: 0,
        condition: 0,
        liquidity: 0,
        fraud_risk: 0, // 0 = Safe, 1.0 = Danger
        core_confidence: 0
    };

    // Helper to sum bucket contributions
    // For normal buckets: simple weighted average of factors? 
    // Spec says: "Signals produce factors. Factors produce scores."
    // Let's assume for v1.0, factors in a bucket are averaged or summed with clamping.
    // Given the factor definitions above (e.g. Identity Optical is weight 1, Serial weight 0.5),
    // let's do a weighted average within the bucket.

    const bucketTotals: Record<string, { sum: number, weight: number }> = {};

    factors.forEach(f => {
        if (!bucketTotals[f.bucket]) bucketTotals[f.bucket] = { sum: 0, weight: 0 };

        if (f.bucket === 'fraud_risk') {
            // Special handling: negative contribution means RISK.
            // Factor contribution is -1.0. absolute it to get risk magnitude.
            const riskMagnitude = Math.abs(f.contribution);
            bucketTotals[f.bucket].sum += riskMagnitude * f.weight;
            bucketTotals[f.bucket].weight += f.weight;
        } else {
            bucketTotals[f.bucket].sum += f.contribution * f.weight;
            bucketTotals[f.bucket].weight += f.weight;
        }
    });

    // Calculate Bucket Scores
    (Object.keys(scores) as ScoreBucket[]).forEach(key => {
        if (key === 'core_confidence') return; // Computed last

        const total = bucketTotals[key];
        if (total && total.weight > 0) {
            // Normalize
            // If fraud_risk, sum could be > 1.0 if we just add. 
            // Let's clamp to 0..1
            // For others like Identity, we have 1.0 + 0.5 weights.
            // Weighted Average approach:
            let val = total.sum / total.weight;

            // Should Serial match (weight 0.5) drag down a perfect Optical match (weight 1.0)?
            // Maybe max() is better for Identity? 
            // "IdentityScore... Typical signals... optical... serial..."
            // Let's stick to weighted average for now, it's deterministic.

            scores[key] = Math.max(0, Math.min(1, val));
        }
    });

    // Fraud Risk Special Logic
    // If we have ANY fraud risk signals, they accumulate.
    // Currently weighted average might dilute it.
    // "Tamper" should be deadly.
    // Let's override: if Tamper is present (-1.0), FraudRisk = 1.0.
    const tamperFactor = factors.find(f => f.factor_id === 'tamper_risk');
    if (tamperFactor) scores.fraud_risk = 1.0;

    // Composite Calculation (Policy Weights)
    const fraudSafety = 1.0 - scores.fraud_risk;

    const weightedSum =
        (scores.identity * policy.weights.identity) +
        (scores.provenance * policy.weights.provenance) +
        (scores.condition * policy.weights.condition) +
        (scores.liquidity * policy.weights.liquidity) +
        (fraudSafety * policy.weights.fraudSafety);

    const totalPolicyWeight = Object.values(policy.weights).reduce((a, b) => a + b, 0);

    scores.core_confidence = totalPolicyWeight > 0 ? (weightedSum / totalPolicyWeight) : 0;

    return scores;
}

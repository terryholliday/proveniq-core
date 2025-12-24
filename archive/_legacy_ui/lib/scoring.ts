/**
 * Deterministic Scoring Engine
 * 
 * "Not AI Vibes. Math."
 * 
 * key Rule: AI may suggest, but Core decides deterministically.
 */

export interface AssetInputs {
    hasIdentity: boolean;
    identityConfidence: number; // 0-1
    chainOfCustodyLength: number;
    gapsInCustody: boolean;
    conditionReportDate: Date | null;
    conditionRating: 'A' | 'B' | 'C' | 'D' | 'F';
    marketVolume24h: number; // USD
    fraudSignals: string[];
}

export interface AssetScore {
    totalScore: number; // 0-100
    riskLevel: 'LOW' | 'MED' | 'HIGH';
    confidenceBand: 'HIGH_CERTAINTY' | 'MODERATE' | 'LOW_CONFIDENCE';
    factors: {
        identity: number;    // Weight: 30%
        provenance: number;  // Weight: 30%
        condition: number;   // Weight: 20%
        liquidity: number;   // Weight: 10%
        fraudRisk: number;   // Weight: 10% (Negative impact logic)
    };
    decision: 'VERIFIED' | 'FLAGGED' | 'REJECTED';
    explainability: string[];
}

export const SCORING_WEIGHTS = {
    identity: 0.3,
    provenance: 0.3,
    condition: 0.2,
    liquidity: 0.1,
    fraud: 0.1
} as const;

export function calculateAssetScore(inputs: AssetInputs): AssetScore {
    const explainability: string[] = [];

    // 1. Identity Score (0-100)
    let identityScore = 0;
    if (inputs.hasIdentity) {
        identityScore = inputs.identityConfidence * 100;
        explainability.push(`Identity Match: ${(inputs.identityConfidence * 100).toFixed(0)}%`);
    } else {
        explainability.push("CRITICAL: No Identity Established");
    }

    // 2. Provenance Score (0-100)
    let provenanceScore = 0;
    if (!inputs.gapsInCustody) {
        provenanceScore = Math.min(100, inputs.chainOfCustodyLength * 10); // 10 points per step, max 100
        explainability.push(`Custody Chain: ${inputs.chainOfCustodyLength} verified steps`);
    } else {
        provenanceScore = 0;
        explainability.push("CRITICAL: Gap in Custody Chain detected");
    }

    // 3. Condition Score (0-100)
    const conditionMap = { 'A': 100, 'B': 85, 'C': 70, 'D': 50, 'F': 0 };
    let conditionScore = conditionMap[inputs.conditionRating] || 0;

    // Decay Score based on report age (simulated: -1 point per day old, max -20)
    if (inputs.conditionReportDate) {
        const daysOld = Math.floor((new Date().getTime() - inputs.conditionReportDate.getTime()) / (1000 * 3600 * 24));
        const penalty = Math.min(20, Math.max(0, daysOld));
        conditionScore -= penalty;
        if (penalty > 0) explainability.push(`Condition Report Aged: -${penalty} pts`);
    } else {
        conditionScore = 0;
        explainability.push("CRITICAL: No Condition Report");
    }

    // 4. Liquidity Score (0-100)
    // Simple log scale mapping
    let liquidityScore = 0;
    if (inputs.marketVolume24h > 1000000) liquidityScore = 100;
    else if (inputs.marketVolume24h > 100000) liquidityScore = 80;
    else if (inputs.marketVolume24h > 10000) liquidityScore = 60;
    else liquidityScore = 40;
    explainability.push(`Market Depth: $${inputs.marketVolume24h.toLocaleString()} 24h vol`);

    // 5. Fraud Risk Score (100 = Safe, 0 = Fraud)
    let fraudScore = 100;
    if (inputs.fraudSignals.length > 0) {
        fraudScore = Math.max(0, 100 - (inputs.fraudSignals.length * 30)); // -30 per signal
        inputs.fraudSignals.forEach(s => explainability.push(`RISK SIGNAL: ${s}`));
    } else {
        explainability.push("No Active Fraud Signals");
    }

    // Calculate Weighted Total
    const totalScore = Math.round(
        (identityScore * SCORING_WEIGHTS.identity) +
        (provenanceScore * SCORING_WEIGHTS.provenance) +
        (conditionScore * SCORING_WEIGHTS.condition) +
        (liquidityScore * SCORING_WEIGHTS.liquidity) +
        (fraudScore * SCORING_WEIGHTS.fraud) // Note: This is additive in this model to normalize to 100
    );

    // Determine Risk Level & Decision
    let riskLevel: AssetScore['riskLevel'] = 'HIGH';
    let decision: AssetScore['decision'] = 'REJECTED';
    let confidenceBand: AssetScore['confidenceBand'] = 'LOW_CONFIDENCE';

    if (totalScore >= 90) {
        riskLevel = 'LOW';
        decision = 'VERIFIED';
        confidenceBand = 'HIGH_CERTAINTY';
    } else if (totalScore >= 75) {
        riskLevel = 'MED';
        decision = 'VERIFIED'; // Verified but with caveats
        confidenceBand = 'MODERATE';
    } else if (totalScore >= 60) {
        riskLevel = 'MED';
        decision = 'FLAGGED';
        confidenceBand = 'MODERATE';
    } else {
        riskLevel = 'HIGH';
        decision = 'REJECTED';
        confidenceBand = 'LOW_CONFIDENCE';
    }

    // Override: Critical Failure Logic (Policy)
    if (fraudScore < 50 || provenanceScore === 0) {
        decision = 'REJECTED';
        riskLevel = 'HIGH';
        explainability.push("POLICY OVERRIDE: Critical Trust Failure");
    }

    return {
        totalScore,
        riskLevel,
        confidenceBand,
        decision,
        factors: {
            identity: identityScore,
            provenance: provenanceScore,
            condition: conditionScore,
            liquidity: liquidityScore,
            fraudRisk: fraudScore
        },
        explainability
    };
}

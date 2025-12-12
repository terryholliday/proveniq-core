import { Policy } from "./types";

export const INSURER_POLICY_V1: Policy = {
    id: "insurer_policy_v1",
    version: "1.0.0",
    weights: {
        identity: 0.30,
        provenance: 0.30,
        condition: 0.20,
        liquidity: 0.00, // Insurers care less about resale speed, more about existence/condition
        fraudSafety: 0.20
    },
    thresholds: {
        identity: 0.80,     // High identity standard
        provenance: 0.50,   // Moderate provenance accepted
        coreConfidence: 0.75,
        maxFraudRisk: 0.10  // Very low fraud tolerance
    }
};

export const LENDER_POLICY_V1: Policy = {
    id: "lender_policy_v1",
    version: "1.0.0",
    weights: {
        identity: 0.20,
        provenance: 0.20,
        condition: 0.10,
        liquidity: 0.30, // Lenders care heavily about liquidation
        fraudSafety: 0.20
    },
    thresholds: {
        identity: 0.60,
        provenance: 0.60,
        coreConfidence: 0.70,
        maxFraudRisk: 0.20
    }
};

export const MARKETPLACE_POLICY_V1: Policy = {
    id: "marketplace_policy_v1",
    version: "1.0.0",
    weights: {
        identity: 0.30,
        provenance: 0.10,
        condition: 0.30, // Buyers care about condition
        liquidity: 0.10,
        fraudSafety: 0.20
    },
    thresholds: {
        identity: 0.50,
        provenance: 0.20,
        coreConfidence: 0.60,
        maxFraudRisk: 0.25
    }
};

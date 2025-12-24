import { CorePolicy } from "../policy.types";

export const INSURER_POLICY_V1: CorePolicy = {
    id: "insurer_policy_v1",
    version: "1.0.0",
    disclosure: "NONE", // Rejection is absolute

    weights: {
        identity: 0.30,
        provenance: 0.30,
        condition: 0.20,
        liquidity: 0.00,
        fraudSafety: 0.20
    },
    thresholds: {
        identity: 0.80,
        provenance: 0.70,
        condition: 0.60,
        liquidity: 0.0,
        coreConfidence: 0.75,
        maxFraudRisk: 0.30
    },
    decay: {
        review_days: 90,
        expire_days: 180,
        locker_extension_days: 0 // Insurers trust freshness, not just custody
    }
};

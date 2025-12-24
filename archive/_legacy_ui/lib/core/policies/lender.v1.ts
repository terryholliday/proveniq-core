import { CorePolicy } from "../policy.types";

export const LENDER_POLICY_V1: CorePolicy = {
    id: "lender_policy_v1",
    version: "1.0.0",
    disclosure: "SUMMARY",

    weights: {
        identity: 0.20,
        provenance: 0.20,
        condition: 0.10,
        liquidity: 0.30,
        fraudSafety: 0.20
    },
    thresholds: {
        identity: 0.70,
        provenance: 0.55,
        condition: 0.60,
        liquidity: 0.65,
        coreConfidence: 0.70,
        maxFraudRisk: 0.40
    },
    decay: {
        review_days: 180,
        expire_days: 365,
        locker_extension_days: 90 // Custody in locker matters
    }
};

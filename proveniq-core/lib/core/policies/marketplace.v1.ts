import { CorePolicy } from "../policy.types";

export const MARKETPLACE_POLICY_V1: CorePolicy = {
    id: "marketplace_policy_v1",
    version: "1.0.0",
    disclosure: "FULL",

    weights: {
        identity: 0.30,
        provenance: 0.10,
        condition: 0.30,
        liquidity: 0.10,
        fraudSafety: 0.20
    },
    thresholds: {
        identity: 0.65,
        provenance: 0.40,
        condition: 0.50,
        liquidity: 0.0,
        coreConfidence: 0.60,
        maxFraudRisk: 0.55
    },
    decay: {
        review_days: 365,
        expire_days: 730,
        locker_extension_days: 0
    }
};

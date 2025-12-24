import { CorePolicy } from "../policy.types";
import { INSURER_POLICY_V1 } from "./insurer.v1";
import { LENDER_POLICY_V1 } from "./lender.v1";
import { MARKETPLACE_POLICY_V1 } from "./marketplace.v1";

export const CORE_POLICIES: Record<string, CorePolicy> = {
    // Canonical Names
    "insurer": INSURER_POLICY_V1,
    "insurer_policy_v1": INSURER_POLICY_V1,

    "lender": LENDER_POLICY_V1,
    "lender_policy_v1": LENDER_POLICY_V1,

    "marketplace": MARKETPLACE_POLICY_V1,
    "marketplace_policy_v1": MARKETPLACE_POLICY_V1
};

export { INSURER_POLICY_V1, LENDER_POLICY_V1, MARKETPLACE_POLICY_V1 };

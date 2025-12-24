import { CorePolicy, Decision } from "./policy.types";
import { AssetInputs } from "./types";

export interface DecayResult {
    isStale: boolean;
    originalDecision: Decision; // What it would be purely based on score
    decayedDecision: Decision;  // What it becomes after time decay
    decayReason?: string;
    effectiveAgeDays: number;
}

/**
 * PURE FUNCTION: Decay Engine
 * Calculates if a decision should degrade based on time and policy rules.
 */
export function calculateDecay(
    policy: CorePolicy,
    inputs: AssetInputs,
    currentDecision: Decision
): DecayResult {

    // 1. Determine Asset Age
    // If no report date, assume fresh (0) or infinity? 
    // Spec says "Last Verified At". 
    // Usually this comes from the PREVIOUS decision or the "Condition Report Date".
    // Let's use inputs.conditionReportDate as the proxy for "Physical Verification Age".

    const now = new Date();
    const verifiedAt = inputs.conditionReportDate
        ? new Date(inputs.conditionReportDate)
        : new Date(); // Default to now if missing (assume fresh ingest)

    const diffTime = Math.abs(now.getTime() - verifiedAt.getTime());
    const ageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let finalDecision = currentDecision;
    let reason = undefined;
    let isStale = false;

    // Short Circuit: If already Rejected/Revoked, decay doesn't matter (can't get worse).
    if (currentDecision === 'REJECTED' || currentDecision === 'REVOKED' || currentDecision === 'EXPIRED') {
        return {
            isStale: false,
            originalDecision: currentDecision,
            decayedDecision: currentDecision,
            effectiveAgeDays: ageDays
        };
    }

    // 2. Resolve Policy Rules
    const { review_days, expire_days, locker_extension_days } = policy.decay;

    // Apply Extensions (e.g. Locker)
    // "If custody is Locker-backed, extend review window"
    // We need a signal/input for locker. 
    // inputs.custodyEvents is minimal. 
    // Let's assume inputs.tamperEvents == 0 AND some "Locker" flag...
    // For now, we don't have explicit "Locker" boolean in AssetInputs.
    // We'll use a heuristic or just not apply extension if data missing.
    // Let's defer extension until we have 'isLocker' input.
    // Actually, `Signal.source === 'LOCKER'`. But inputs are raw.
    // Let's assume if `tamperEvents` is defined, it's a smart asset/locker.
    // Or just strictly follow config for now.

    const extension = 0; // Placeholder for future logic
    const effectiveReviewThreshold = review_days + extension;
    const effectiveExpireThreshold = expire_days + extension;

    // 3. Evaluate Decay

    // EXPIRED
    if (ageDays > effectiveExpireThreshold) {
        // Marketplace exception: "Degrade into disclosure mode before rejection"
        if (policy.disclosure === 'FULL' || policy.disclosure === 'SUMMARY') {
            // "If stale > 730 days -> EXPIRED (optional)" - Policy config says 730.
            // So if > 730, it expires.
            // But if > 365 (review) and < 730?
            finalDecision = 'EXPIRED';
            reason = `Verification age (${ageDays}d) exceeds expiration limit (${effectiveExpireThreshold}d).`;
            isStale = true;
        } else {
            finalDecision = 'EXPIRED';
            reason = `Verification age (${ageDays}d) exceeds hard expiration (${effectiveExpireThreshold}d).`;
            isStale = true;
        }
    }
    // REVIEW REQUIRED
    else if (ageDays > effectiveReviewThreshold) {
        // Marketplace: "If stale > 365 days -> VERIFIED_WITH_DISCLOSURE"
        if (policy.id.includes('marketplace')) {
            finalDecision = 'VERIFIED_WITH_DISCLOSURE';
            reason = `Asset verification aged (${ageDays}d). Disclosure applied.`;
            isStale = true;
        } else {
            finalDecision = 'REVIEW_REQUIRED';
            reason = `Verification age (${ageDays}d) exceeds review threshold (${effectiveReviewThreshold}d).`;
            isStale = true;
        }
    }

    return {
        isStale,
        originalDecision: currentDecision,
        decayedDecision: finalDecision,
        decayReason: reason,
        effectiveAgeDays: ageDays
    };
}

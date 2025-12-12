import { NextRequest, NextResponse } from "next/server";
import { evaluateAsset } from "@/lib/core/decision";
import { CORE_POLICIES } from "@/lib/core/policies";
import { LEDGER } from "@/lib/core/ledger";
import { AssetInputs } from "@/lib/core/types";

/**
 * POST /api/core/verify
 * 
 * The Single Source of Truth Entry Point.
 * Accepts asset inputs and a policy ID.
 * Returns a cryptographically logged DecisionResponse.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { assetId, inputs, policyId } = body as {
            assetId: string;
            inputs: AssetInputs;
            policyId?: string;
        };

        if (!assetId || !inputs) {
            return NextResponse.json({ error: "Missing assetId or inputs" }, { status: 400 });
        }

        // 1. Select Policy (Default to Insurer if missing)
        const selectedPolicy = policyId ? CORE_POLICIES[policyId] : CORE_POLICIES["insurer_policy_v1"];
        if (!selectedPolicy) {
            return NextResponse.json({ error: "Invalid Policy ID" }, { status: 400 });
        }

        // 2. Log Ingestion Event (if not exists)
        // In a real system, this might be separate, but here we ensure the asset exists in ledger.
        const history = LEDGER.getAssetHistory(assetId);
        if (history.length === 0) {
            LEDGER.logEvent('ASSET_CREATED', assetId, 'SYS:API_GATEWAY', { note: "Auto-created on verify" });
        }

        // 3. Compute Decision (Deterministic)
        // We log the Decision Event *inside* this flow? 
        // No, evaluateAsset is pure logic. We log the event here using its result.

        // Wait, evaluateAsset returns a response with `audit.ledger_event_id`. 
        // So we need to log FIRST? Or log the RESULT?
        // Spec: "Writes DECISION_RECORDED event"
        // And the response needs that event ID. 
        // So:
        // A. Calc Score (Pure)
        // B. Log to Ledger
        // C. Return Response with Event ID inserted.

        // Actually `evaluateAsset` takes `ledgerEventId` as optional arg.
        // Let's run it, get result, THEN log, then link?
        // No, the event payload should contain the decision.

        // Correct Flow:
        // 1. Evaluate (Logic)
        const analysis = evaluateAsset(assetId, inputs, selectedPolicy);

        // 2. Log Result (Persistence)
        // Store Full Snapshot for Replay/Audit
        const event = LEDGER.logEvent('DECISION_RECORDED', assetId, 'CORE_KERNEL', {
            // Replay Inputs
            inputs,
            policy_id: policyId,

            // Result Snapshot
            analysis: {
                scores: analysis.scores,
                decision: analysis.decision,
                confidence_band: analysis.confidence_band,
                top_factors: analysis.top_factors,
                required_actions: analysis.required_actions,
                audit: analysis.audit
            }
        });

        // 3. Bind Event ID to Response
        analysis.audit.ledger_event_id = event.event_id;

        return NextResponse.json(analysis);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Kernel Error" }, { status: 500 });
    }
}

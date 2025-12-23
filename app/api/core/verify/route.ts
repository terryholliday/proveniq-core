import { NextRequest, NextResponse } from "next/server";
import { evaluateAsset } from "@/lib/core/decision";
import { CORE_POLICIES } from "@/lib/core/policies";
import { LEDGER } from "@/lib/core/ledger";
import { AssetInputs } from "@/lib/core/types";
import { parseAssetId, parseAssetInputs } from "@/lib/core/validation";

/**
 * POST /api/core/verify
 * 
 * The Single Source of Truth Entry Point.
 * Accepts asset inputs and a policy ID.
 * Returns a cryptographically logged DecisionResponse.
 */
export async function POST(req: NextRequest) {
    try {
        let body: unknown;
        try {
            body = await req.json();
        } catch (error) {
            console.error(error);
            return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
        }

        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
        }

        const { assetId, inputs, policyId } = body as {
            assetId: string;
            inputs: AssetInputs;
            policyId?: string;
        };

        const assetIdResult = parseAssetId(assetId);
        if (!assetIdResult.ok) {
            return NextResponse.json({ error: assetIdResult.error }, { status: 400 });
        }

        const inputsResult = parseAssetInputs(inputs);
        if (!inputsResult.ok) {
            return NextResponse.json(
                { error: inputsResult.error, details: inputsResult.details },
                { status: 400 }
            );
        }

        if (policyId !== undefined && (typeof policyId !== "string" || !policyId.trim())) {
            return NextResponse.json({ error: "policyId must be a non-empty string" }, { status: 400 });
        }

        // 1. Select Policy (Default to Insurer if missing)
        const policyKey = policyId?.trim();
        const selectedPolicy = policyKey ? CORE_POLICIES[policyKey] : CORE_POLICIES["insurer_policy_v1"];
        if (!selectedPolicy) {
            return NextResponse.json({ error: "Invalid Policy ID" }, { status: 400 });
        }

        // 2. Log Ingestion Event (if not exists)
        // In a real system, this might be separate, but here we ensure the asset exists in ledger.
        const history = LEDGER.getAssetHistory(assetIdResult.data);
        if (history.length === 0) {
            LEDGER.logEvent('ASSET_CREATED', assetIdResult.data, 'SYS:API_GATEWAY', { note: "Auto-created on verify" });
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
        const analysis = evaluateAsset(assetIdResult.data, inputsResult.data, selectedPolicy);

        // 2. Log Result (Persistence)
        // Store Full Snapshot for Replay/Audit
        const event = LEDGER.logEvent('DECISION_RECORDED', assetIdResult.data, 'CORE_KERNEL', {
            // Replay Inputs
            inputs: inputsResult.data,
            policy_id: selectedPolicy.id,
            policy_key: policyKey ?? selectedPolicy.id,

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

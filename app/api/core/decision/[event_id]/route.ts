import { NextRequest, NextResponse } from "next/server";
import { LEDGER } from "@/lib/core/ledger";
import { DecisionResponse } from "@/lib/core/types";
import { requireApiKey } from "@/lib/api/serviceAuth";

// Force Dynamic because we are querying runtime memory/db
export const dynamic = 'force-dynamic';

interface Context {
    params: Promise<{
        event_id: string;
    }>
}

/**
 * GET /api/core/decision/[event_id]
 * 
 * Rehydrates a historical decision from the immutable ledger.
 * This is the "Replay" mechanism.
 */
export async function GET(req: NextRequest, { params }: Context) {
    try {
        const auth = await requireApiKey(req);
        if (!auth.ok) return auth.response;

        const { event_id } = await params;
        const eventId = event_id;

        const event = LEDGER.getEvent(eventId);

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (event.type !== 'DECISION_RECORDED') {
            return NextResponse.json({ error: "Event is not a decision record", type: event.type }, { status: 400 });
        }

        const payload = event.payload;

        // Reconstruct DecisionResponse
        // Payload has: inputs, policy_id, analysis: { ... }
        if (!payload.analysis || !payload.policy_id) {
            return NextResponse.json({ error: "Corrupt Decision Record" }, { status: 500 });
        }

        const response: DecisionResponse = {
            asset_id: event.asset_id,
            policy_id: payload.policy_id,
            scores: payload.analysis.scores,
            decision: payload.analysis.decision,
            confidence_band: payload.analysis.confidence_band,
            top_factors: payload.analysis.top_factors,
            required_actions: payload.analysis.required_actions,
            audit: {
                ...payload.analysis.audit,
                ledger_event_id: event.event_id // Ensure it matches this event
            }
        };

        return NextResponse.json(response);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

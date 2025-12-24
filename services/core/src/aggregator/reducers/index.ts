
import { LedgerEvent } from "../../ledger/readClient";

export interface AggregatedState {
    value_micros: string;
    currency: string;
    integrity: 'INTACT' | 'COMPROMISED' | 'UNKNOWN';
    custody_status: 'CUSTODY' | 'TRANSIT' | 'DISPUTED' | 'LOST';
    custody_holder: string;
    owner_subject: string;
    timeline: Array<{ occurred_at: string, title: string, description: string, actor: string }>;
    claims: {
        status: "NONE" | "OPEN" | "DECIDED" | "AUTHORIZED" | "PAID" | "FAILED";
        claim_id?: string;
        decision?: "PAY" | "DENY" | "REVIEW";
        amount_micros?: string;
        currency?: string;
        decision_time?: string;
        payout_time?: string;
        last_event_id?: string;
    };
}

export const INITIAL_STATE: AggregatedState = {
    value_micros: "0",
    currency: "USD",
    integrity: "UNKNOWN",
    custody_status: "CUSTODY",
    custody_holder: "ORIGIN",
    owner_subject: "UNKNOWN",
    timeline: [],
    claims: { status: "NONE" }
};

export function reduceState(events: LedgerEvent[]): AggregatedState {
    const state = { ...INITIAL_STATE, claims: { ...INITIAL_STATE.claims } };
    state.timeline = []; // Reset timeline to avoid dupes if re-reducing

    // Sort by time
    const sorted = [...events].sort((a, b) =>
        new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
    );

    for (const event of sorted) {
        // Timeline (Always append)
        state.timeline.push({
            occurred_at: event.occurred_at,
            title: event.event_type.replace(/_/g, ' '),
            description: event.source,
            actor: event.source
        });

        // Domain Logic
        switch (event.event_type) {
            case 'ANCHOR_REGISTERED':
                state.integrity = 'INTACT';
                break;
            case 'PROTECT_POLICY_BOUND':
                // Simple assumption: coverage = value
                if (event.payload.coverage_amount) {
                    state.value_micros = (event.payload.coverage_amount * 1000000).toString(); // Convert to micros
                }
                break;
            case 'TRANSIT_HANDOFF_ACCEPTED':
                state.custody_status = 'TRANSIT';
                state.custody_holder = event.payload.custodian_id || "Unknown Driver";
                break;

            // CLAIM LIFECYCLE
            case 'CLAIM_OPENED':
                state.claims.status = 'OPEN';
                state.claims.claim_id = event.payload.claim_id;
                state.claims.last_event_id = event.event_id || event.id; // Handle mock/real
                break;
            case 'CLAIM_DECISION_RECORDED':
                state.claims.status = 'DECIDED';
                state.claims.decision = event.payload.decision;
                state.claims.amount_micros = event.payload.amount_micros;
                state.claims.currency = event.payload.currency;
                state.claims.decision_time = event.occurred_at;
                state.claims.last_event_id = event.event_id || event.id;
                break;
            case 'CLAIM_PAYOUT_AUTHORIZED':
                state.claims.status = 'AUTHORIZED';
                state.claims.last_event_id = event.event_id || event.id;
                break;
            case 'CAPITAL_PAYOUT_EXECUTED':
                state.claims.status = 'PAID';
                state.claims.payout_time = event.occurred_at;
                state.claims.last_event_id = event.event_id || event.id;
                break;
            case 'CAPITAL_PAYOUT_FAILED':
                state.claims.status = 'FAILED';
                state.claims.last_event_id = event.event_id || event.id;
                break;
        }
    }

    return state;
}

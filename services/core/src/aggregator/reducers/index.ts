
import { LedgerEvent } from "../../ledger/readClient";

export interface AggregatedState {
    value_micros: string;
    currency: string;
    integrity: 'INTACT' | 'COMPROMISED' | 'UNKNOWN';
    custody_status: 'CUSTODY' | 'TRANSIT' | 'DISPUTED' | 'LOST';
    custody_holder: string;
    owner_subject: string;
    timeline: Array<{ occurred_at: string, title: string, description: string, actor: string }>;
}

export const INITIAL_STATE: AggregatedState = {
    value_micros: "0",
    currency: "USD",
    integrity: "UNKNOWN",
    custody_status: "CUSTODY",
    custody_holder: "ORIGIN",
    owner_subject: "UNKNOWN",
    timeline: []
};

export function reduceState(events: LedgerEvent[]): AggregatedState {
    const state = { ...INITIAL_STATE };

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
            case 'SERVICE_WORK_ORDER_CREATED':
                // Maybe affects status
                break;
        }
    }

    return state;
}

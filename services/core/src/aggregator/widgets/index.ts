
import { AggregatedState } from "../reducers";
import { Widget } from "../../domain/schemas";
import { randomUUID } from "crypto"; // Use uuid v4 in real app

export function generateWidgets(state: AggregatedState): Widget[] {
    const widgets: Widget[] = [];

    // 1. Valuation
    widgets.push({
        type: "VALUATION_SUMMARY",
        priority_int: 100,
        title: "Asset Value",
        generated_at: new Date().toISOString(),
        source_event_refs: [],
        data: {
            amount_micros: state.value_micros,
            currency: state.currency,
            confidence_score: 0.95,
            valuation_date: new Date().toISOString()
        }
    });

    // 2. Custody
    widgets.push({
        type: "CUSTODY_STATUS",
        priority_int: 90,
        title: "Custody Chain",
        generated_at: new Date().toISOString(),
        source_event_refs: [],
        data: {
            status: state.custody_status,
            current_custodian: state.custody_holder
        }
    });

    // 3. Timeline
    widgets.push({
        type: "PROVENANCE_TIMELINE",
        priority_int: 80,
        title: "History",
        generated_at: new Date().toISOString(),
        source_event_refs: [],
        data: {
            events: state.timeline
        }
    });

    // 4. Claim Summary
    if (state.claims && state.claims.status !== "NONE") {
        widgets.push({
            type: "CLAIM_SUMMARY",
            priority_int: 110, // Higher priority than Valuation
            title: "Active Claim",
            generated_at: new Date().toISOString(),
            source_event_refs: state.claims.last_event_id ? [state.claims.last_event_id] : [],
            data: {
                status: state.claims.status,
                claim_id: state.claims.claim_id,
                decision: state.claims.decision,
                amount_micros: state.claims.amount_micros,
                currency: state.claims.currency,
                decision_time: state.claims.decision_time,
                payout_time: state.claims.payout_time,
                last_event_id: state.claims.last_event_id
            }
        });
    }

    return widgets;
}

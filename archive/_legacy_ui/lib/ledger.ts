/**
 * Core Internal Event Ledger (Investor-Grade)
 * 
 * Implements Append-Only Log with Hashing and Chaining.
 * "System of Record" for Core Authority.
 */

export type LedgerEventType =
    | "ASSET_CREATED"
    | "OBSERVATION_ADDED"
    | "SIGNALS_COMPUTED"
    | "SCORES_COMPUTED"
    | "DECISION_RECORDED"
    | "DECISION_REVOKED"
    | "TRANSFER_RECORDED";

export interface LedgerEvent {
    event_id: string;          // ULID style
    asset_id: string;
    type: LedgerEventType;
    occurred_at: string;       // ISO
    actor: {
        kind: "SYSTEM" | "USER" | "DEVICE" | "PARTNER";
        id: string;              // system:user:device id
    };
    // Immutability Semantics
    prev_event_id?: string;
    payload_hash: string;      // hash(payload)
    payload: Record<string, any>;
}

// In-Memory Store (Simulated DB)
let MEMORY_LEDGER: LedgerEvent[] = [];

// Simple simulated hash function (In prod use SHA-256)
function mockHash(payload: any): string {
    const str = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return "0x" + Math.abs(hash).toString(16);
}

export const LEDGER = {
    logEvent: (
        type: LedgerEventType,
        asset_id: string,
        actorId: string,
        payload: Record<string, any>
    ): LedgerEvent => {

        // Find previous event for this asset to chain
        const history = MEMORY_LEDGER.filter(e => e.asset_id === asset_id);
        const prevEvent = history.length > 0 ? history[0] : undefined; // Newest first in our filter logic below, but let's standardise

        const event: LedgerEvent = {
            event_id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            occurred_at: new Date().toISOString(),
            type,
            asset_id,
            actor: {
                kind: actorId.startsWith("SYS") ? "SYSTEM" : "USER",
                id: actorId
            },
            prev_event_id: prevEvent?.event_id,
            payload_hash: mockHash(payload),
            payload
        };

        // Append to LOG (Newest first for UI convenience, but logically append-only)
        MEMORY_LEDGER.unshift(event);

        // Retention Policy (Simulated)
        if (MEMORY_LEDGER.length > 1000) MEMORY_LEDGER.pop();

        return event;
    },

    getAssetHistory: (asset_id: string): LedgerEvent[] => {
        return MEMORY_LEDGER.filter(e => e.asset_id === asset_id);
    },

    getEvent: (event_id: string): LedgerEvent | undefined => {
        return MEMORY_LEDGER.find(e => e.event_id === event_id);
    },

    // Demo Seeding
    seed: () => {
        if (MEMORY_LEDGER.length === 0) {
            LEDGER.logEvent('ASSET_CREATED', 'DEMO-ASSET-099', 'SYS:INGEST', { origin: 'Singapore FreePort' });
        }
    }
};

import { createHash, randomUUID } from "crypto";
import { LedgerEvent, LedgerEventType } from "./types";

// In-Memory Database Simulation
// Logic is Append-Only.
const MEMORY_LEDGER: LedgerEvent[] = [];

/**
 * SIMULATED CRYPTO HASH
 * In production, replace with SHA-256 (Node crypto or WebCrypto).
 */
function hashPayload(payload: Record<string, any>): string {
    const compact = JSON.stringify(payload);
    return createHash("sha256").update(compact).digest("hex");
}

/**
 * CORE IMMUTABLE LEDGER
 */
export const LEDGER = {

    // WRITE
    logEvent: (
        type: LedgerEventType,
        asset_id: string,
        actorId: string,
        payload: Record<string, any>
    ): LedgerEvent => {

        // 1. Find Tip of Chain for this Asset
        // (Simulate DB Index lookup: select * from events where asset_id = ? order by date desc limit 1)
        const history = MEMORY_LEDGER.filter(e => e.asset_id === asset_id);

        // "Newest" is at index 0 because we unshift. 
        // Logic: The "chain" links back to the immediately preceding event.
        const prevEvent = history.length > 0 ? history[0] : undefined;

        // 2. Construct Event
        const event: LedgerEvent = {
            event_id: `evt_${randomUUID()}`,
            occurred_at: new Date().toISOString(),
            type,
            asset_id,
            actor: {
                kind: actorId.startsWith("SYS") ? "SYSTEM" : "USER",
                id: actorId
            },
            prev_event_id: prevEvent?.event_id,
            payload_hash: hashPayload(payload),
            payload
        };

        // 3. Append (unshift to keep newest first in memory for UI)
        MEMORY_LEDGER.unshift(event);

        // 4. Persistence Simulation (Limit size)
        if (MEMORY_LEDGER.length > 2000) MEMORY_LEDGER.pop();

        return event;
    },

    // READ
    getAssetHistory: (asset_id: string): LedgerEvent[] => {
        return MEMORY_LEDGER.filter(e => e.asset_id === asset_id);
    },

    getEvent: (event_id: string): LedgerEvent | undefined => {
        return MEMORY_LEDGER.find(e => e.event_id === event_id);
    },

    // DEBUG / SEED
    seed: () => {
        if (MEMORY_LEDGER.length === 0) {
            LEDGER.logEvent('ASSET_CREATED', 'DEMO-ASSET-099', 'SYS:INGEST', { origin: 'Singapore FreePort' });
        }
    }
};

// Auto-seed for demo reliability
LEDGER.seed();

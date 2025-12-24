
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

// Minimal Event Schema for Core consumption
export const LedgerEventSchema = z.object({
    event_type: z.string(),
    occurred_at: z.string().datetime(),
    payload: z.record(z.any()), // Core treats payload as semi-opaque source for reducers
    source: z.string(),
    asset_id: z.string(),
    schema_version: z.string()
});

export type LedgerEvent = z.infer<typeof LedgerEventSchema>;

export async function getEventStreamByAssetId(asset_id: string): Promise<LedgerEvent[]> {
    const mode = process.env.CORE_LEDGER_MODE || 'mock';

    if (mode === 'mock') {
        return getMockEvents(asset_id);
    }

    if (mode === 'ledger') {
        // Real implementation would look like:
        // const res = await fetch(`${process.env.LEDGER_URL}/events?asset_id=${asset_id}`);
        // return z.array(LedgerEventSchema).parse(await res.json());
        throw new Error("Ledger Mode Not Yet Implemented - Waiting for Client Adapter");
    }

    throw new Error(`Invalid CORE_LEDGER_MODE: ${mode}`);
}

async function getMockEvents(asset_id: string): Promise<LedgerEvent[]> {
    // Basic Mock logic: Try to load fixture, else return generic sequence
    try {
        // Try reliable path from project root
        let fixturePath = path.resolve(process.cwd(), 'src/ledger/fixtures', `${asset_id}.json`);
        // Check if exists
        try {
            await fs.access(fixturePath);
        } catch {
            // Fallback to __dirname if running from build
            fixturePath = path.join(__dirname, 'fixtures', `${asset_id}.json`);
        }

        console.log(`[MOCK] Loading fixture from: ${fixturePath}`);
        const data = await fs.readFile(fixturePath, 'utf8');
        return z.array(LedgerEventSchema).parse(JSON.parse(data));
    } catch (e: any) {
        // Fallback for unknown assets in mock mode
        console.error(`[MOCK] Error loading fixture: ${e.message}`);
        throw e; // Fail loud for debug
    }
}

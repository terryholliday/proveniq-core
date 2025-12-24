
import { resolveAsset } from './src/aggregator/resolver';
import { getEventStreamByAssetId } from './src/ledger/readClient';

async function main() {
    process.env.CORE_LEDGER_MODE = 'mock';
    const ASSET_ID = "ASSET-MOCK-1";

    console.log("--- DIRECT DEBUG START ---");
    try {
        console.log("Fetching stream...");
        const events = await getEventStreamByAssetId(ASSET_ID);
        console.log("Events:", JSON.stringify(events, null, 2));

        console.log("Resolving asset...");
        const result = await resolveAsset(ASSET_ID);
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error("FATAL ERROR:", e);
        const fs = require('fs');
        fs.writeFileSync('debug_error.log', e.stack || e.toString());
    }
    console.log("--- DIRECT DEBUG END ---");
}

main();

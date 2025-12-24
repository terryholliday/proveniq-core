
import { getEventStreamByAssetId } from "../ledger/readClient";
import { reduceState } from "./reducers";
import { generateWidgets } from "./widgets";
import { CoreAssetResponse, CoreAssetResponseSchema } from "../domain/schemas";
// I will rely on the fact I can add uuid to package.json later or use crypto
import { randomUUID } from "crypto";

export async function resolveAsset(asset_id: string, opts?: { debug?: boolean }): Promise<CoreAssetResponse> {

    // 1. Fetch
    const events = await getEventStreamByAssetId(asset_id);

    // 2. Reduce
    const state = reduceState(events);

    // 3. Widgetize
    const widgets = generateWidgets(state);

    // 4. Construct Response
    const response: CoreAssetResponse = {
        schema_version: "1.0.0",
        correlation_id: randomUUID(),
        generated_at: new Date().toISOString(),
        asset_id: asset_id,
        mode: (process.env.CORE_LEDGER_MODE as 'mock' | 'ledger') || 'mock',
        asset: {
            asset_id: asset_id,
            asset_kind: "Unknown", // Would need reducer logic for this
            owner_subject: state.owner_subject,
            integrity: state.integrity,
            health: "NOMINAL",
            risk_bps: 0,
            value_micros: state.value_micros,
            currency: state.currency,
            custody_status: state.custody_status,
            custody_holder: state.custody_holder,
            capabilities: ["VALUATION", "CUSTODY"]
        },
        widgets: widgets,
        debug: opts?.debug ? { event_count: events.length } : undefined
    };

    // 5. Validate (Fail-Loud)
    return CoreAssetResponseSchema.parse(response);
}

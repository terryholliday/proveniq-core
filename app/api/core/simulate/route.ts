import { NextRequest, NextResponse } from "next/server";
import { evaluateAsset } from "@/lib/core/decision";
import {
    INSURER_POLICY_V1,
    LENDER_POLICY_V1,
    MARKETPLACE_POLICY_V1
} from "@/lib/core/policies";
import { AssetInputs, DecisionResponse } from "@/lib/core/types";
import { requireApiKey } from "@/lib/api/serviceAuth";

// Force pure compute, no caching for simulation
export const dynamic = 'force-dynamic';

/**
 * POST /api/core/simulate
 * 
 * Runs the asset through ALL active policies (Insurer, Lender, Marketplace).
 * Returns a comparison map { policyId: Result }.
 * Does NOT write to the Immutable Ledger (Simulation Mode).
 */
export async function POST(req: NextRequest) {
    try {
        const auth = await requireApiKey(req);
        if (!auth.ok) return auth.response;

        const body = await req.json();
        const { assetId, inputs } = body as {
            assetId: string;
            inputs: AssetInputs;
        };

        if (!assetId || !inputs) {
            return NextResponse.json({ error: "Missing assetId or inputs" }, { status: 400 });
        }

        const results: Record<string, DecisionResponse> = {};

        // 1. Run Insurer
        results['insurer'] = evaluateAsset(assetId, inputs, INSURER_POLICY_V1);

        // 2. Run Lender
        results['lender'] = evaluateAsset(assetId, inputs, LENDER_POLICY_V1);

        // 3. Run Marketplace
        results['marketplace'] = evaluateAsset(assetId, inputs, MARKETPLACE_POLICY_V1);

        // Return Map
        return NextResponse.json({
            assetId,
            timestamp: new Date().toISOString(),
            results
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Simulation Failed" }, { status: 500 });
    }
}

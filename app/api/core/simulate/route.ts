import { NextRequest, NextResponse } from "next/server";
import { evaluateAsset } from "@/lib/core/decision";
import {
    INSURER_POLICY_V1,
    LENDER_POLICY_V1,
    MARKETPLACE_POLICY_V1
} from "@/lib/core/policies";
import { AssetInputs, DecisionResponse } from "@/lib/core/types";
import { parseAssetId, parseAssetInputs } from "@/lib/core/validation";

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
        let body: unknown;
        try {
            body = await req.json();
        } catch (error) {
            console.error(error);
            return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
        }

        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
        }

        const { assetId, inputs } = body as {
            assetId: string;
            inputs: AssetInputs;
        };

        const assetIdResult = parseAssetId(assetId);
        if (!assetIdResult.ok) {
            return NextResponse.json({ error: assetIdResult.error }, { status: 400 });
        }

        const inputsResult = parseAssetInputs(inputs);
        if (!inputsResult.ok) {
            return NextResponse.json(
                { error: inputsResult.error, details: inputsResult.details },
                { status: 400 }
            );
        }

        const results: Record<string, DecisionResponse> = {};

        // 1. Run Insurer
        results['insurer'] = evaluateAsset(assetIdResult.data, inputsResult.data, INSURER_POLICY_V1);

        // 2. Run Lender
        results['lender'] = evaluateAsset(assetIdResult.data, inputsResult.data, LENDER_POLICY_V1);

        // 3. Run Marketplace
        results['marketplace'] = evaluateAsset(assetIdResult.data, inputsResult.data, MARKETPLACE_POLICY_V1);

        // Return Map
        return NextResponse.json({
            assetId: assetIdResult.data,
            timestamp: new Date().toISOString(),
            results
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Simulation Failed" }, { status: 500 });
    }
}

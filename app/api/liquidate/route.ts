import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/serviceAuth";

export async function POST(request: NextRequest) {
    try {
        const auth = await requireApiKey(request);
        if (!auth.ok) return auth.response;

        const body = await request.json();

        // Simulating Matching Engine
        await new Promise(resolve => setTimeout(resolve, 500));

        return NextResponse.json({
            status: "ORDER_PLACED",
            order_id: `ORD-${Date.now()}`,
            side: body.side || "SELL",
            asset_id: body.asset_id || "UNKNOWN",
            filled: false,
            venue: "PROVENIQ_DEX",
            timestamp: new Date().toISOString()
        });

    } catch {
        return NextResponse.json({ error: "Liquidation Failed" }, { status: 500 });
    }
}

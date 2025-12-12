import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
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

    } catch (error) {
        return NextResponse.json({ error: "Liquidation Failed" }, { status: 500 });
    }
}

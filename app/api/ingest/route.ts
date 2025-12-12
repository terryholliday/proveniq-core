import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Simulating Ingestion Delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock Logic: If payload has 'type'
        const type = body.type || "UNKNOWN_ASSET";

        return NextResponse.json({
            status: "INGESTED",
            asset_id: `ASSET-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            type: type,
            hash: "0x7d9f...3a2b", // Mock Hash
            timestamp: new Date().toISOString(),
            confidence_score: 0.99
        });
    } catch (error) {
        return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
    }
}

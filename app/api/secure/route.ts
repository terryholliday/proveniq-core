import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/serviceAuth";

export async function POST(request: NextRequest) {
    try {
        const auth = await requireApiKey(request);
        if (!auth.ok) return auth.response;

        const body = await request.json();

        // Simulating HSM Interaction
        // In real life, check biometric header or signature
        if (body.signature !== "VALID_MOCK_SIG") {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        await new Promise(resolve => setTimeout(resolve, 1200));

        return NextResponse.json({
            status: "UNLOCKED",
            locker_id: body.locker_id || "LOCKER_01",
            access_token: `tk_${Math.random().toString(36).substring(7)}`,
            session_expires_in: 60, // seconds
            timestamp: new Date().toISOString()
        });

    } catch {
        return NextResponse.json({ error: "Security Exception" }, { status: 500 });
    }
}

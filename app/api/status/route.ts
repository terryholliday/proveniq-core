import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/serviceAuth";

export async function GET(request: NextRequest) {
    const auth = await requireApiKey(request);
    if (!auth.ok) return auth.response;

    return NextResponse.json({
        system: "PROVENIQ_KERNEL",
        version: "v3.3.0",
        status: "ONLINE",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        modules: {
            ingest: "READY",
            verify: "READY",
            liquidate: "READY",
            secure: "READY"
        }
    });
}

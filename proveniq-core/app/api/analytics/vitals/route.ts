import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { VitalsPayload } from "@/lib/vitals";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json() as VitalsPayload;

    await db.auditLog.create({
      data: {
        action: `vitals.${body.name.toLowerCase()}`,
        entityType: "performance",
        userId: session?.user?.id || null,
        metadata: {
          type: "web_vitals",
          metric: body.name,
          value: body.value,
          rating: body.rating,
          delta: body.delta,
          id: body.id,
          navigationType: body.navigationType,
          url: body.url,
          timestamp: body.timestamp,
        } as any,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Vitals] API error:", error);
    return NextResponse.json({ success: true });
  }
}

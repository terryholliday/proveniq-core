import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identifyUser, IdentifyPayload } from "@/lib/analytics/track";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json() as IdentifyPayload;

    const payload: IdentifyPayload = {
      ...body,
      userId: session?.user?.id || body.userId,
    };

    if (!payload.userId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    await identifyUser(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Analytics] Identify error:", error);
    return NextResponse.json({ success: true });
  }
}

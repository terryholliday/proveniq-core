import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { trackEvent, TrackEventPayload } from "@/lib/analytics/track";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json() as TrackEventPayload;

    const payload: TrackEventPayload = {
      ...body,
      userId: session?.user?.id || body.userId,
      anonymousId: body.anonymousId || req.headers.get("x-anonymous-id") || undefined,
    };

    await trackEvent(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Analytics] Track error:", error);
    // Return success anyway - analytics should not break the app
    return NextResponse.json({ success: true });
  }
}

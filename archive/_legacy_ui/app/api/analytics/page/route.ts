import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { trackPageView, PageViewPayload } from "@/lib/analytics/track";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json() as PageViewPayload;

    const payload: PageViewPayload = {
      ...body,
      userId: session?.user?.id || body.userId,
      anonymousId: body.anonymousId || req.headers.get("x-anonymous-id") || undefined,
    };

    await trackPageView(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Analytics] Page error:", error);
    return NextResponse.json({ success: true });
  }
}

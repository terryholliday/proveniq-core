import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { trackError, ErrorPayload } from "@/lib/errors/tracking";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json() as ErrorPayload;

    const payload: ErrorPayload = {
      ...body,
      userId: session?.user?.id || body.userId,
    };

    await trackError(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ErrorTracking] API error:", error);
    return NextResponse.json({ success: true });
  }
}

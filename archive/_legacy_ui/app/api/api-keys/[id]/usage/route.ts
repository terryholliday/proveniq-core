import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUsageStats } from "@/lib/apiKeys/usage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const apiKey = await db.apiKey.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!apiKey || apiKey.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const stats = await getUsageStats(id, days);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("[ApiKeyUsage] GET error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

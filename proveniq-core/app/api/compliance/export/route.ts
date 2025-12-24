import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exportUserData } from "@/lib/compliance/gdpr";
import { isGdprEnabled } from "@/lib/compliance/config";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isGdprEnabled()) {
      return NextResponse.json(
        { error: "GDPR features are not enabled" },
        { status: 400 }
      );
    }

    const data = await exportUserData(session.user.id);

    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return as downloadable JSON
    const jsonString = JSON.stringify(data, null, 2);
    
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="user-data-export-${session.user.id}.json"`,
      },
    });
  } catch (error) {
    console.error("[Compliance] Export error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

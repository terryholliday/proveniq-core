import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteUserData, anonymizeUserData } from "@/lib/compliance/gdpr";
import { isGdprEnabled } from "@/lib/compliance/config";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { action, confirmation } = body;

    // Require explicit confirmation
    if (confirmation !== "DELETE_MY_DATA") {
      return NextResponse.json(
        { error: "Confirmation required. Send confirmation: 'DELETE_MY_DATA'" },
        { status: 400 }
      );
    }

    if (action === "anonymize") {
      await anonymizeUserData(session.user.id);
      return NextResponse.json({
        success: true,
        message: "Your data has been anonymized",
      });
    }

    if (action === "delete") {
      const result = await deleteUserData(session.user.id);
      return NextResponse.json({
        success: true,
        message: "Your account and data have been deleted",
        deletedItems: result.deletedItems,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'anonymize' or 'delete'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Compliance] Delete error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

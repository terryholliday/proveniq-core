import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSignedDocument } from "@/lib/esign/request";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const envelopeId = searchParams.get("envelopeId");
    const organizationId = searchParams.get("organizationId");

    if (!envelopeId || !organizationId) {
      return NextResponse.json(
        { error: "envelopeId and organizationId required" },
        { status: 400 }
      );
    }

    // Verify organization membership
    const membership = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Organization access denied" }, { status: 403 });
    }

    const document = await getSignedDocument(envelopeId, session.user.id, organizationId);

    return new NextResponse(new Uint8Array(document), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="signed-document-${envelopeId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[E-Sign Download] Error:", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

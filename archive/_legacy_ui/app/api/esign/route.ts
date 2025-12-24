import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createSignatureRequest,
  getSignatureRequestStatus,
  cancelSignatureRequest,
  getSignedDocument,
} from "@/lib/esign/request";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, organizationId, recipients, emailSubject, emailBody, returnUrl } = body;

    if (!documentId || !organizationId || !recipients?.length) {
      return NextResponse.json(
        { error: "documentId, organizationId, and recipients are required" },
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

    const result = await createSignatureRequest({
      documentId,
      organizationId,
      requestedById: session.user.id,
      recipients,
      emailSubject,
      emailBody,
      returnUrl,
    });

    return NextResponse.json({ signatureRequest: result });
  } catch (error) {
    console.error("[E-Sign] POST error:", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const envelopeId = searchParams.get("envelopeId");

    if (!envelopeId) {
      return NextResponse.json({ error: "envelopeId required" }, { status: 400 });
    }

    const status = await getSignatureRequestStatus(envelopeId);

    return NextResponse.json({ status });
  } catch (error) {
    console.error("[E-Sign] GET error:", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const envelopeId = searchParams.get("envelopeId");
    const organizationId = searchParams.get("organizationId");
    const reason = searchParams.get("reason") || "Cancelled by user";

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

    await cancelSignatureRequest(envelopeId, reason, session.user.id, organizationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[E-Sign] DELETE error:", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

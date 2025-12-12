import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createApiKey, listApiKeys, revokeApiKey, deleteApiKey } from "@/lib/apiKeys";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId") || undefined;

    const keys = await listApiKeys({
      userId: session.user.id,
      organizationId,
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("[ApiKeys] GET error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, scopes, organizationId, expiresInDays } = body;

    if (!name || !scopes || !Array.isArray(scopes)) {
      return NextResponse.json(
        { error: "Name and scopes are required" },
        { status: 400 }
      );
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const apiKey = await createApiKey({
      name,
      scopes,
      userId: session.user.id,
      organizationId,
      expiresAt,
    });

    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error("[ApiKeys] POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("id");
    const action = searchParams.get("action") || "delete";

    if (!keyId) {
      return NextResponse.json({ error: "Key ID required" }, { status: 400 });
    }

    let success: boolean;
    if (action === "revoke") {
      success = await revokeApiKey(keyId, session.user.id);
    } else {
      success = await deleteApiKey(keyId, session.user.id);
    }

    if (!success) {
      return NextResponse.json(
        { error: "Key not found or not authorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ApiKeys] DELETE error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

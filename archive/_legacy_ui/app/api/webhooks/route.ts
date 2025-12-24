import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { success, unauthorized, badRequest, forbidden } from "@/lib/api/response";
import { getAuthContext } from "@/lib/rbac/guards";

// Get all webhooks for an organization
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const organizationId = request.nextUrl.searchParams.get("organizationId");
  if (!organizationId) return badRequest("Organization ID required");

  // Check permissions
  const context = await getAuthContext(organizationId);
  if (!context || !context.orgRole) return forbidden();

  const webhooks = await db.webhook.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { deliveries: true },
      },
    },
  });

  return success(webhooks);
}

// Create a new webhook
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const body = await request.json();
  const { organizationId, url, events } = body;

  if (!organizationId || !url || !events || !Array.isArray(events)) {
    return badRequest("Missing required fields");
  }

  // Check permissions (Admin or Owner only)
  const context = await getAuthContext(organizationId);
  if (!context || !["OWNER", "ADMIN"].includes(context.orgRole || "")) {
    return forbidden();
  }

  const secret = `whsec_${randomBytes(24).toString("hex")}`;

  const webhook = await db.webhook.create({
    data: {
      organizationId,
      url,
      events,
      secret,
    },
  });

  return success(webhook);
}

// Update or delete
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const body = await request.json();
  const { id, organizationId, ...updates } = body;

  if (!id || !organizationId) return badRequest("ID and Organization ID required");

  // Check permissions
  const context = await getAuthContext(organizationId);
  if (!context || !["OWNER", "ADMIN"].includes(context.orgRole || "")) {
    return forbidden();
  }

  const webhook = await db.webhook.update({
    where: { id },
    data: updates,
  });

  return success(webhook);
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const organizationId = request.nextUrl.searchParams.get("organizationId");
  const id = request.nextUrl.searchParams.get("id");

  if (!id || !organizationId) return badRequest("ID and Organization ID required");

  // Check permissions
  const context = await getAuthContext(organizationId);
  if (!context || !["OWNER", "ADMIN"].includes(context.orgRole || "")) {
    return forbidden();
  }

  await db.webhook.delete({
    where: { id },
  });

  return success({ success: true });
}

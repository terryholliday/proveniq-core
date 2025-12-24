import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { initiateUpload, confirmUpload } from "@/lib/storage/upload";
import { generateDownloadUrl } from "@/lib/storage/signedUrl";
import { db } from "@/lib/db";
import { getAuthContext } from "@/lib/rbac/guards";
import { success, unauthorized, badRequest, forbidden, notFound } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const organizationId = request.nextUrl.searchParams.get("organizationId");
  if (!organizationId) return badRequest("Organization ID required");

  // Check permissions
  const context = await getAuthContext(organizationId);
  if (!context || !context.orgRole) return forbidden();

  const documents = await db.document.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  // Generate download URLs for each document (could be optimized)
  const docsWithUrls = await Promise.all(
    documents.map(async (doc: any) => {
      const url = await generateDownloadUrl(doc.key);
      return { ...doc, url };
    })
  );

  return success(docsWithUrls);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const body = await request.json();
  const { organizationId, filename, contentType, size } = body;

  if (!organizationId || !filename || !contentType || !size) {
    return badRequest("Missing required fields");
  }

  // Check permissions
  const context = await getAuthContext(organizationId);
  if (!context || !context.orgRole) return forbidden();

  const result = await initiateUpload({
    organizationId,
    userId: session.user.id,
    filename,
    contentType,
    size,
  });

  return success(result);
}

// Confirm upload or delete
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const body = await request.json();
  const { id, status } = body;

  if (!id || status !== "UPLOADED") {
    return badRequest("Invalid request");
  }

  const document = await db.document.findUnique({ where: { id } });
  if (!document) return notFound("Document not found");

  // Check permissions
  const context = await getAuthContext(document.organizationId);
  if (!context || !context.orgRole) return forbidden();

  const updated = await confirmUpload(id);

  return success(updated);
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return badRequest("Document ID required");

  const document = await db.document.findUnique({ where: { id } });
  if (!document) return notFound("Document not found");

  // Check permissions - only Admin/Owner can delete
  const context = await getAuthContext(document.organizationId);
  if (!context || !["OWNER", "ADMIN"].includes(context.orgRole || "")) {
    return forbidden();
  }

  // In production, also delete from S3
  // await deleteObject(document.key);

  await db.document.delete({ where: { id } });

  return success({ success: true });
}

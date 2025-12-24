import { db } from "@/lib/db";
import { generateUploadUrl } from "./signedUrl";
import { randomBytes } from "crypto";
import { indexEntity } from "@/lib/search/sync";

export interface InitiateUploadInput {
  organizationId: string;
  userId: string;
  filename: string;
  contentType: string;
  size: number;
}

export async function initiateUpload(input: InitiateUploadInput) {
  const { organizationId, userId, filename, contentType, size } = input;
  
  // Generate a unique key for S3
  const fileExt = filename.split(".").pop();
  const uniqueId = randomBytes(16).toString("hex");
  const key = `${organizationId}/${uniqueId}.${fileExt}`;
  
  // Create DB record
  const document = await db.document.create({
    data: {
      organizationId,
      userId,
      name: filename,
      key,
      contentType,
      size,
      status: "PENDING",
    },
  });
  
  // Generate signed URL
  const uploadUrl = await generateUploadUrl(key, contentType);
  
  return {
    document,
    uploadUrl,
    key,
  };
}

export async function confirmUpload(documentId: string) {
  const document = await db.document.update({
    where: { id: documentId },
    data: {
      status: "UPLOADED",
      updatedAt: new Date(),
    },
  });

  // Index for search
  await indexEntity({
    organizationId: document.organizationId,
    entityType: "document",
    entityId: document.id,
    title: document.name,
    content: `${document.name} ${document.contentType}`,
    metadata: {
      contentType: document.contentType,
      size: document.size,
      url: document.url,
    },
  });

  return document;
}

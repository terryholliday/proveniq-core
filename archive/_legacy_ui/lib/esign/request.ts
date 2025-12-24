import { db } from "@/lib/db";
import {
  createEnvelope,
  getSigningUrl,
  getEnvelopeStatus,
  voidEnvelope,
  downloadSignedDocument,
  SignatureRecipient,
} from "./docusign";

export interface CreateSignatureRequestInput {
  documentId: string;
  organizationId: string;
  requestedById: string;
  recipients: {
    email: string;
    name: string;
  }[];
  emailSubject?: string;
  emailBody?: string;
  returnUrl?: string;
}

export interface SignatureRequestResult {
  id: string;
  envelopeId: string;
  status: string;
  signingUrls: { email: string; url: string }[];
}

export async function createSignatureRequest(
  input: CreateSignatureRequestInput
): Promise<SignatureRequestResult> {
  // Get the document
  const document = await db.document.findUnique({
    where: { id: input.documentId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.organizationId !== input.organizationId) {
    throw new Error("Document does not belong to this organization");
  }

  // Download document content from storage
  // In production, this would fetch from S3 or your storage provider
  const documentContent = await getDocumentContent(document.key);
  const documentBase64 = documentContent.toString("base64");

  // Prepare recipients
  const recipients: SignatureRecipient[] = input.recipients.map((r, index) => ({
    email: r.email,
    name: r.name,
    recipientId: String(index + 1),
    routingOrder: index + 1,
  }));

  // Create envelope in DocuSign
  const envelope = await createEnvelope({
    documentBase64,
    documentName: document.name,
    recipients,
    emailSubject: input.emailSubject || `Please sign: ${document.name}`,
    emailBody: input.emailBody,
    returnUrl: input.returnUrl,
    webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/docusign`,
  });

  // Store signature request in database
  const signatureRequest = await db.auditLog.create({
    data: {
      action: "esign.request.created",
      entityType: "signature_request",
      entityId: envelope.envelopeId,
      organizationId: input.organizationId,
      userId: input.requestedById,
      metadata: {
        documentId: input.documentId,
        documentName: document.name,
        envelopeId: envelope.envelopeId,
        recipients: input.recipients,
        status: envelope.status,
      } as any,
    },
  });

  // Get signing URLs for embedded signing (if needed)
  const signingUrls: { email: string; url: string }[] = [];
  
  if (input.returnUrl) {
    for (const recipient of recipients) {
      try {
        const signingUrl = await getSigningUrl(
          envelope.envelopeId,
          recipient,
          input.returnUrl
        );
        signingUrls.push({
          email: recipient.email,
          url: signingUrl.url,
        });
      } catch (error) {
        console.error(`Failed to get signing URL for ${recipient.email}:`, error);
      }
    }
  }

  return {
    id: signatureRequest.id,
    envelopeId: envelope.envelopeId,
    status: envelope.status,
    signingUrls,
  };
}

export async function getSignatureRequestStatus(envelopeId: string): Promise<{
  status: string;
  completedAt?: Date;
  recipients: { email: string; status: string; signedAt?: Date }[];
}> {
  const envelope = await getEnvelopeStatus(envelopeId);

  return {
    status: envelope.status,
    completedAt: envelope.status === "completed" ? new Date(envelope.statusDateTime) : undefined,
    recipients: [], // Would need additional API call to get recipient status
  };
}

export async function cancelSignatureRequest(
  envelopeId: string,
  reason: string,
  userId: string,
  organizationId: string
): Promise<void> {
  await voidEnvelope(envelopeId, reason);

  // Log the cancellation
  await db.auditLog.create({
    data: {
      action: "esign.request.cancelled",
      entityType: "signature_request",
      entityId: envelopeId,
      organizationId,
      userId,
      metadata: {
        envelopeId,
        reason,
        cancelledAt: new Date().toISOString(),
      } as any,
    },
  });
}

export async function getSignedDocument(
  envelopeId: string,
  userId: string,
  organizationId: string
): Promise<Buffer> {
  const document = await downloadSignedDocument(envelopeId);

  // Log the download
  await db.auditLog.create({
    data: {
      action: "esign.document.downloaded",
      entityType: "signature_request",
      entityId: envelopeId,
      organizationId,
      userId,
      metadata: {
        envelopeId,
        downloadedAt: new Date().toISOString(),
      } as any,
    },
  });

  return document;
}

async function getDocumentContent(storageKey: string): Promise<Buffer> {
  // Placeholder - in production, fetch from S3 or storage provider
  // const { s3Client, BUCKET_NAME } = await import("@/lib/storage/s3");
  // const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  // const response = await s3Client.send(new GetObjectCommand({
  //   Bucket: BUCKET_NAME,
  //   Key: storageKey,
  // }));
  // return Buffer.from(await response.Body.transformToByteArray());
  
  throw new Error("Document storage not configured. Implement getDocumentContent for your storage provider.");
}

export async function handleWebhookEvent(payload: {
  event: string;
  envelopeId: string;
  status: string;
  recipientStatuses?: { email: string; status: string; signedDateTime?: string }[];
}): Promise<void> {
  const { event, envelopeId, status, recipientStatuses } = payload;

  // Log the webhook event
  await db.auditLog.create({
    data: {
      action: `esign.webhook.${event}`,
      entityType: "signature_request",
      entityId: envelopeId,
      metadata: {
        event,
        envelopeId,
        status,
        recipientStatuses,
        receivedAt: new Date().toISOString(),
      } as any,
    },
  });

  // Handle specific events
  if (status === "completed") {
    // All signatures collected - could trigger downstream actions
    console.log(`[E-Sign] Envelope ${envelopeId} completed`);
  } else if (status === "declined") {
    console.log(`[E-Sign] Envelope ${envelopeId} declined`);
  } else if (status === "voided") {
    console.log(`[E-Sign] Envelope ${envelopeId} voided`);
  }
}

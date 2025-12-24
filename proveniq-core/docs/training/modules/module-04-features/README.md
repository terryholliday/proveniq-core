# Module 4: Core Features & Data Models

## 🎯 Learning Objectives

By the end of this module, you will be able to:

1. Implement asset management workflows
2. Build verification processes with status tracking
3. Create secure document storage and retrieval
4. Implement notification systems with multiple channels
5. Configure webhooks for external integrations
6. Build search functionality across resources

## ⏱️ Duration: 8 hours

---

## Lesson 4.1: Asset Management System

### Asset Data Model

```prisma
model Asset {
  id             String       @id @default(cuid())
  externalId     String?      // External system reference
  name           String
  category       String       // equipment, property, vehicle, etc.
  status         AssetStatus  @default(PENDING)
  metadata       Json?        // Flexible additional data
  
  organizationId String
  
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  organization   Organization @relation(...)
  verifications  Verification[]
  
  @@unique([organizationId, externalId])
  @@index([organizationId, status])
  @@index([organizationId, category])
  @@map("assets")
}

enum AssetStatus {
  PENDING    // Awaiting verification
  VERIFIED   // Successfully verified
  FLAGGED    // Issues detected
  ARCHIVED   // No longer active
}
```

### Asset Service Layer

```typescript
// lib/assets/service.ts
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { AssetStatus } from "@prisma/client";

export interface CreateAssetInput {
  name: string;
  category: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
  organizationId: string;
  userId: string;
}

export interface UpdateAssetInput {
  name?: string;
  category?: string;
  status?: AssetStatus;
  metadata?: Record<string, unknown>;
}

export async function createAsset(input: CreateAssetInput) {
  const asset = await db.asset.create({
    data: {
      name: input.name,
      category: input.category,
      externalId: input.externalId,
      metadata: input.metadata as any,
      organizationId: input.organizationId,
    },
  });
  
  await audit.assetCreated(asset, input.userId);
  
  return asset;
}

export async function updateAsset(
  assetId: string,
  input: UpdateAssetInput,
  userId: string
) {
  const existing = await db.asset.findUnique({
    where: { id: assetId },
  });
  
  if (!existing) {
    throw new Error("Asset not found");
  }
  
  // Track changes for audit
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  
  if (input.name && input.name !== existing.name) {
    changes.name = { from: existing.name, to: input.name };
  }
  if (input.status && input.status !== existing.status) {
    changes.status = { from: existing.status, to: input.status };
  }
  
  const asset = await db.asset.update({
    where: { id: assetId },
    data: input,
  });
  
  await audit.assetUpdated(asset, userId, changes);
  
  return asset;
}

export async function getAssetWithVerifications(assetId: string) {
  return db.asset.findUnique({
    where: { id: assetId },
    include: {
      verifications: {
        orderBy: { requestedAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function listAssets(
  organizationId: string,
  options: {
    status?: AssetStatus;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const where: any = { organizationId };
  
  if (options.status) {
    where.status = options.status;
  }
  if (options.category) {
    where.category = options.category;
  }
  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { externalId: { contains: options.search, mode: "insensitive" } },
    ];
  }
  
  const [assets, total] = await Promise.all([
    db.asset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options.limit || 50,
      skip: options.offset || 0,
      include: {
        verifications: {
          take: 1,
          orderBy: { requestedAt: "desc" },
        },
      },
    }),
    db.asset.count({ where }),
  ]);
  
  return { assets, total };
}
```

### Asset Categories

```typescript
// lib/assets/categories.ts
export const ASSET_CATEGORIES = {
  equipment: {
    label: "Equipment",
    icon: "Wrench",
    fields: ["serialNumber", "manufacturer", "model", "purchaseDate"],
  },
  property: {
    label: "Real Estate",
    icon: "Building",
    fields: ["address", "squareFeet", "yearBuilt", "propertyType"],
  },
  vehicle: {
    label: "Vehicle",
    icon: "Car",
    fields: ["vin", "make", "model", "year", "mileage"],
  },
  inventory: {
    label: "Inventory",
    icon: "Package",
    fields: ["sku", "quantity", "location", "batchNumber"],
  },
  financial: {
    label: "Financial Instrument",
    icon: "DollarSign",
    fields: ["cusip", "isin", "maturityDate", "faceValue"],
  },
  intellectual: {
    label: "Intellectual Property",
    icon: "Lightbulb",
    fields: ["patentNumber", "filingDate", "jurisdiction"],
  },
} as const;

export type AssetCategory = keyof typeof ASSET_CATEGORIES;

export function getCategoryConfig(category: string) {
  return ASSET_CATEGORIES[category as AssetCategory] || {
    label: category,
    icon: "Box",
    fields: [],
  };
}
```

### Knowledge Check 4.1

1. What is the purpose of the `externalId` field on Asset?
2. How does the asset service track changes for audit logging?
3. What are the four asset statuses and when is each used?

---

## Lesson 4.2: Verification Workflows

### Verification Data Model

```prisma
model Verification {
  id             String             @id @default(cuid())
  assetId        String
  type           VerificationType
  status         VerificationStatus @default(PENDING)
  confidence     Float?             // 0-100 confidence score
  evidenceHash   String?            // Hash of evidence document
  metadata       Json?              // Type-specific data
  
  requestedAt    DateTime           @default(now())
  completedAt    DateTime?
  
  asset          Asset              @relation(...)
  
  @@index([assetId, requestedAt])
  @@index([status])
  @@map("verifications")
}

enum VerificationType {
  OWNERSHIP    // Verify who owns the asset
  CONDITION    // Verify physical condition
  LOCATION     // Verify current location
  EXISTENCE    // Verify asset exists
}

enum VerificationStatus {
  PENDING      // Awaiting processing
  PROCESSING   // Currently being verified
  VERIFIED     // Successfully verified
  FAILED       // Verification failed
  EXPIRED      // Verification expired
}
```

### Verification Workflow

```
┌─────────────────────────────────────────────────────────────┐
│              VERIFICATION WORKFLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐                                               │
│  │ REQUEST  │  User requests verification                   │
│  └────┬─────┘                                               │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                               │
│  │ PENDING  │  Verification queued                          │
│  └────┬─────┘                                               │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                               │
│  │PROCESSING│  Verification in progress                     │
│  └────┬─────┘                                               │
│       │                                                      │
│   ┌───┴───┐                                                 │
│   │       │                                                 │
│   ▼       ▼                                                 │
│ ┌────┐  ┌────┐                                             │
│ │PASS│  │FAIL│                                             │
│ └──┬─┘  └──┬─┘                                             │
│    │       │                                                │
│    ▼       ▼                                                │
│ ┌────────┐ ┌────────┐                                      │
│ │VERIFIED│ │ FAILED │                                      │
│ └────────┘ └────────┘                                      │
│                                                              │
│  After time period:                                         │
│  VERIFIED → EXPIRED (requires re-verification)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Verification Service

```typescript
// lib/verifications/service.ts
import { db } from "@/lib/db";
import { VerificationType, VerificationStatus } from "@prisma/client";
import { sendNotification } from "@/lib/notifications";
import { triggerWebhook } from "@/lib/webhooks";

export interface RequestVerificationInput {
  assetId: string;
  type: VerificationType;
  metadata?: Record<string, unknown>;
  userId: string;
}

export async function requestVerification(input: RequestVerificationInput) {
  // Get asset to verify organization
  const asset = await db.asset.findUnique({
    where: { id: input.assetId },
  });
  
  if (!asset) {
    throw new Error("Asset not found");
  }
  
  // Check for existing pending verification of same type
  const existing = await db.verification.findFirst({
    where: {
      assetId: input.assetId,
      type: input.type,
      status: { in: ["PENDING", "PROCESSING"] },
    },
  });
  
  if (existing) {
    throw new Error("Verification already in progress");
  }
  
  const verification = await db.verification.create({
    data: {
      assetId: input.assetId,
      type: input.type,
      metadata: input.metadata as any,
      status: "PENDING",
    },
  });
  
  // Trigger webhook
  await triggerWebhook(asset.organizationId, "verification.requested", {
    verificationId: verification.id,
    assetId: asset.id,
    type: input.type,
  });
  
  return verification;
}

export async function processVerification(
  verificationId: string,
  result: {
    status: "VERIFIED" | "FAILED";
    confidence?: number;
    evidenceHash?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const verification = await db.verification.update({
    where: { id: verificationId },
    data: {
      status: result.status,
      confidence: result.confidence,
      evidenceHash: result.evidenceHash,
      metadata: result.metadata as any,
      completedAt: new Date(),
    },
    include: {
      asset: true,
    },
  });
  
  // Update asset status based on verification result
  if (result.status === "VERIFIED") {
    await db.asset.update({
      where: { id: verification.assetId },
      data: { status: "VERIFIED" },
    });
  } else if (result.status === "FAILED") {
    await db.asset.update({
      where: { id: verification.assetId },
      data: { status: "FLAGGED" },
    });
  }
  
  // Send notification
  await sendNotification({
    type: "VERIFICATION",
    title: `Verification ${result.status.toLowerCase()}`,
    message: `${verification.type} verification for ${verification.asset.name} has ${result.status.toLowerCase()}.`,
    organizationId: verification.asset.organizationId,
  });
  
  // Trigger webhook
  await triggerWebhook(
    verification.asset.organizationId,
    `verification.${result.status.toLowerCase()}`,
    {
      verificationId: verification.id,
      assetId: verification.assetId,
      type: verification.type,
      confidence: result.confidence,
    }
  );
  
  return verification;
}

export async function getVerificationHistory(
  assetId: string,
  options: { limit?: number; offset?: number } = {}
) {
  return db.verification.findMany({
    where: { assetId },
    orderBy: { requestedAt: "desc" },
    take: options.limit || 20,
    skip: options.offset || 0,
  });
}
```

### Verification Types Configuration

```typescript
// lib/verifications/types.ts
export const VERIFICATION_TYPES = {
  OWNERSHIP: {
    label: "Ownership Verification",
    description: "Verify the legal owner of the asset",
    requiredEvidence: ["title", "registration", "bill_of_sale"],
    expirationDays: 365,
  },
  CONDITION: {
    label: "Condition Assessment",
    description: "Verify the physical condition of the asset",
    requiredEvidence: ["photos", "inspection_report"],
    expirationDays: 90,
  },
  LOCATION: {
    label: "Location Verification",
    description: "Verify the current location of the asset",
    requiredEvidence: ["gps_coordinates", "photos", "address_proof"],
    expirationDays: 30,
  },
  EXISTENCE: {
    label: "Existence Verification",
    description: "Verify the asset physically exists",
    requiredEvidence: ["photos", "serial_number_photo", "witness_statement"],
    expirationDays: 180,
  },
} as const;
```

### Knowledge Check 4.2

1. What are the five verification statuses?
2. What happens to an asset's status when verification fails?
3. Why might a verification expire?

---

## Lesson 4.3: Document Vault & Storage

### Document Data Model

```prisma
model Document {
  id             String         @id @default(cuid())
  name           String
  key            String         // Storage key (S3 path)
  contentType    String         // MIME type
  size           Int            // File size in bytes
  status         DocumentStatus @default(PENDING)
  url            String?        // Signed URL (temporary)
  metadata       Json?
  
  organizationId String
  userId         String?        // Uploader
  
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  
  organization   Organization   @relation(...)
  user           User?          @relation(...)
  
  @@index([organizationId, status])
  @@map("documents")
}

enum DocumentStatus {
  PENDING     // Upload initiated
  UPLOADED    // File received
  PROCESSING  // Being processed (virus scan, etc.)
  READY       // Available for download
  FAILED      // Upload/processing failed
}
```

### Document Service

```typescript
// lib/documents/service.ts
import { db } from "@/lib/db";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;

export interface InitiateUploadInput {
  name: string;
  contentType: string;
  size: number;
  organizationId: string;
  userId: string;
}

export async function initiateUpload(input: InitiateUploadInput) {
  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  
  if (!allowedTypes.includes(input.contentType)) {
    throw new Error("File type not allowed");
  }
  
  // Validate file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (input.size > maxSize) {
    throw new Error("File too large (max 50MB)");
  }
  
  // Generate unique key
  const key = `${input.organizationId}/${crypto.randomUUID()}/${input.name}`;
  
  // Create document record
  const document = await db.document.create({
    data: {
      name: input.name,
      key,
      contentType: input.contentType,
      size: input.size,
      status: "PENDING",
      organizationId: input.organizationId,
      userId: input.userId,
    },
  });
  
  // Generate presigned upload URL
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.size,
  });
  
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  
  return {
    documentId: document.id,
    uploadUrl,
    expiresAt: new Date(Date.now() + 3600 * 1000),
  };
}

export async function confirmUpload(documentId: string) {
  const document = await db.document.findUnique({
    where: { id: documentId },
  });
  
  if (!document) {
    throw new Error("Document not found");
  }
  
  // Verify file exists in S3
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: document.key,
    });
    await s3.send(command);
  } catch {
    throw new Error("File not found in storage");
  }
  
  // Update status
  return db.document.update({
    where: { id: documentId },
    data: { status: "READY" },
  });
}

export async function getDownloadUrl(documentId: string) {
  const document = await db.document.findUnique({
    where: { id: documentId },
  });
  
  if (!document || document.status !== "READY") {
    throw new Error("Document not available");
  }
  
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: document.key,
  });
  
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  
  return { url, expiresAt: new Date(Date.now() + 3600 * 1000) };
}

export async function deleteDocument(documentId: string, userId: string) {
  const document = await db.document.findUnique({
    where: { id: documentId },
  });
  
  if (!document) {
    throw new Error("Document not found");
  }
  
  // Delete from S3
  // Note: In production, consider soft delete first
  
  // Delete from database
  await db.document.delete({
    where: { id: documentId },
  });
  
  return true;
}
```

### Document Security

```typescript
// lib/documents/security.ts

// Virus scanning (placeholder - integrate with ClamAV or similar)
export async function scanDocument(key: string): Promise<boolean> {
  // In production, send to virus scanning service
  console.log(`[Document Security] Scanning ${key}`);
  return true; // Assume clean for now
}

// Content validation
export function validateContentType(
  declaredType: string,
  actualType: string
): boolean {
  // Verify the actual content matches declared type
  // This prevents disguised malicious files
  return declaredType === actualType;
}

// Generate content hash for integrity verification
export async function generateContentHash(
  buffer: Buffer
): Promise<string> {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
```

### Knowledge Check 4.3

1. What is the purpose of presigned URLs?
2. How does the document service validate file uploads?
3. What security measures should be applied to uploaded documents?

---

## Lesson 4.4: Notification System

### Notification Data Model

```prisma
model Notification {
  id             String           @id @default(cuid())
  type           NotificationType
  title          String
  message        String
  metadata       Json?
  
  userId         String?          // Target user (null = org-wide)
  organizationId String?
  
  readAt         DateTime?
  createdAt      DateTime         @default(now())
  
  user           User?            @relation(...)
  
  @@index([userId, readAt, createdAt])
  @@map("notifications")
}

enum NotificationType {
  INFO
  SUCCESS
  WARNING
  ERROR
  VERIFICATION
  SYSTEM
}
```

### Notification Service

```typescript
// lib/notifications/service.ts
import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";
import { sendEventToUser } from "@/app/api/events/route";

export interface SendNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  organizationId?: string;
}

export async function sendNotification(input: SendNotificationInput) {
  // If targeting organization, get all member user IDs
  let userIds: string[] = [];
  
  if (input.userId) {
    userIds = [input.userId];
  } else if (input.organizationId) {
    const members = await db.organizationMember.findMany({
      where: { organizationId: input.organizationId },
      select: { userId: true },
    });
    userIds = members.map((m) => m.userId);
  }
  
  // Create notifications for all target users
  const notifications = await Promise.all(
    userIds.map((userId) =>
      db.notification.create({
        data: {
          type: input.type,
          title: input.title,
          message: input.message,
          metadata: input.metadata as any,
          userId,
          organizationId: input.organizationId,
        },
      })
    )
  );
  
  // Send real-time updates
  for (const userId of userIds) {
    sendEventToUser(userId, {
      type: "notification",
      data: {
        id: notifications.find((n) => n.userId === userId)?.id,
        type: input.type,
        title: input.title,
        message: input.message,
      },
    });
  }
  
  return notifications;
}

export async function markAsRead(notificationId: string, userId: string) {
  return db.notification.update({
    where: {
      id: notificationId,
      userId, // Ensure user owns notification
    },
    data: { readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string) {
  return db.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });
}

export async function getUserNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
) {
  const where: any = { userId };
  
  if (options.unreadOnly) {
    where.readAt = null;
  }
  
  return db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options.limit || 50,
    skip: options.offset || 0,
  });
}
```

### Email Notifications

```typescript
// lib/notifications/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailNotificationInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmailNotification(input: EmailNotificationInput) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[Email] Skipping - no API key configured");
    return;
  }
  
  await resend.emails.send({
    from: "Proveniq <notifications@proveniq.com>",
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

// Email templates
export const emailTemplates = {
  verificationComplete: (assetName: string, status: string) => ({
    subject: `Verification ${status} - ${assetName}`,
    html: `
      <h1>Verification ${status}</h1>
      <p>The verification for <strong>${assetName}</strong> has been ${status.toLowerCase()}.</p>
      <p><a href="${process.env.NEXTAUTH_URL}/assets">View Details</a></p>
    `,
  }),
  
  memberInvited: (orgName: string, inviterName: string) => ({
    subject: `You've been invited to ${orgName}`,
    html: `
      <h1>Organization Invitation</h1>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on Proveniq.</p>
      <p><a href="${process.env.NEXTAUTH_URL}/invitations">Accept Invitation</a></p>
    `,
  }),
};
```

### Knowledge Check 4.4

1. How are organization-wide notifications handled?
2. What is the purpose of real-time notification delivery?
3. How would you add a new notification channel (e.g., SMS)?

---

## Lesson 4.5: Webhook Integration

### Webhook Data Model

```prisma
model Webhook {
  id             String          @id @default(cuid())
  url            String
  secret         String          // For signature verification
  events         String[]        // Events to subscribe to
  isActive       Boolean         @default(true)
  
  organizationId String
  
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  
  organization   Organization    @relation(...)
  deliveries     WebhookDelivery[]
  
  @@map("webhooks")
}

model WebhookDelivery {
  id             String   @id @default(cuid())
  webhookId      String
  event          String
  payload        Json
  statusCode     Int?
  response       String?
  attempts       Int      @default(1)
  deliveredAt    DateTime?
  
  createdAt      DateTime @default(now())
  
  webhook        Webhook  @relation(...)
  
  @@index([webhookId, createdAt])
  @@map("webhook_deliveries")
}
```

### Webhook Service

```typescript
// lib/webhooks/service.ts
import { db } from "@/lib/db";
import crypto from "crypto";

export const WEBHOOK_EVENTS = [
  "asset.created",
  "asset.updated",
  "asset.deleted",
  "verification.requested",
  "verification.completed",
  "verification.failed",
  "document.uploaded",
  "document.deleted",
  "member.added",
  "member.removed",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export async function createWebhook(
  organizationId: string,
  url: string,
  events: WebhookEvent[]
) {
  // Generate secret for signature verification
  const secret = crypto.randomBytes(32).toString("hex");
  
  return db.webhook.create({
    data: {
      url,
      secret,
      events,
      organizationId,
    },
  });
}

export async function triggerWebhook(
  organizationId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
) {
  // Find all active webhooks subscribed to this event
  const webhooks = await db.webhook.findMany({
    where: {
      organizationId,
      isActive: true,
      events: { has: event },
    },
  });
  
  // Deliver to each webhook
  await Promise.all(
    webhooks.map((webhook) => deliverWebhook(webhook, event, payload))
  );
}

async function deliverWebhook(
  webhook: { id: string; url: string; secret: string },
  event: string,
  payload: Record<string, unknown>
) {
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });
  
  // Generate signature
  const signature = crypto
    .createHmac("sha256", webhook.secret)
    .update(body)
    .digest("hex");
  
  // Create delivery record
  const delivery = await db.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      event,
      payload: payload as any,
    },
  });
  
  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event,
        "X-Webhook-Delivery": delivery.id,
      },
      body,
    });
    
    await db.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        statusCode: response.status,
        response: await response.text().catch(() => null),
        deliveredAt: new Date(),
      },
    });
    
    if (!response.ok) {
      // Schedule retry
      await scheduleRetry(delivery.id);
    }
  } catch (error) {
    await db.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        response: error instanceof Error ? error.message : "Unknown error",
      },
    });
    
    await scheduleRetry(delivery.id);
  }
}

async function scheduleRetry(deliveryId: string) {
  // In production, use a job queue (Bull, etc.)
  const delivery = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
  });
  
  if (!delivery || delivery.attempts >= 5) {
    return; // Max retries reached
  }
  
  // Exponential backoff: 1min, 5min, 30min, 2hr, 24hr
  const delays = [60, 300, 1800, 7200, 86400];
  const delay = delays[delivery.attempts - 1] || delays[delays.length - 1];
  
  console.log(`[Webhook] Scheduling retry for ${deliveryId} in ${delay}s`);
  
  // In production, add to job queue with delay
}
```

### Webhook Signature Verification

```typescript
// lib/webhooks/verify.ts
import crypto from "crypto";

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### Knowledge Check 4.5

1. How are webhook signatures generated and verified?
2. What is exponential backoff and why is it used for retries?
3. What information should be included in a webhook payload?

---

## Lesson 4.6: Search & Indexing

### Search Architecture

```typescript
// lib/search/index.ts
import { db } from "@/lib/db";

export interface SearchResult {
  id: string;
  type: "asset" | "document" | "verification";
  title: string;
  description?: string;
  url: string;
  score: number;
}

export async function search(
  query: string,
  organizationId: string,
  options: {
    types?: string[];
    limit?: number;
  } = {}
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const types = options.types || ["asset", "document"];
  const limit = options.limit || 20;
  
  // Search assets
  if (types.includes("asset")) {
    const assets = await db.asset.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { externalId: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
    });
    
    results.push(
      ...assets.map((asset) => ({
        id: asset.id,
        type: "asset" as const,
        title: asset.name,
        description: `${asset.category} - ${asset.status}`,
        url: `/assets/${asset.id}`,
        score: calculateScore(query, asset.name),
      }))
    );
  }
  
  // Search documents
  if (types.includes("document")) {
    const documents = await db.document.findMany({
      where: {
        organizationId,
        name: { contains: query, mode: "insensitive" },
        status: "READY",
      },
      take: limit,
    });
    
    results.push(
      ...documents.map((doc) => ({
        id: doc.id,
        type: "document" as const,
        title: doc.name,
        description: doc.contentType,
        url: `/documents/${doc.id}`,
        score: calculateScore(query, doc.name),
      }))
    );
  }
  
  // Sort by score and limit
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function calculateScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  
  // Exact match
  if (t === q) return 100;
  
  // Starts with
  if (t.startsWith(q)) return 80;
  
  // Contains
  if (t.includes(q)) return 60;
  
  // Fuzzy match (simple)
  const words = q.split(" ");
  const matches = words.filter((w) => t.includes(w)).length;
  return (matches / words.length) * 40;
}
```

### Full-Text Search with PostgreSQL

```typescript
// lib/search/fulltext.ts
import { db } from "@/lib/db";

// Using PostgreSQL full-text search
export async function fullTextSearch(
  query: string,
  organizationId: string
) {
  // Raw query for full-text search
  const results = await db.$queryRaw`
    SELECT 
      id,
      name,
      'asset' as type,
      ts_rank(
        to_tsvector('english', name || ' ' || COALESCE(category, '')),
        plainto_tsquery('english', ${query})
      ) as rank
    FROM assets
    WHERE 
      organization_id = ${organizationId}
      AND to_tsvector('english', name || ' ' || COALESCE(category, ''))
          @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT 20
  `;
  
  return results;
}
```

### Knowledge Check 4.6

1. What factors affect search result scoring?
2. How does PostgreSQL full-text search differ from simple LIKE queries?
3. What types of content should be searchable in the platform?

---

## 🔬 Lab 4: Building an Asset Verification Flow

### Objective
Build a complete asset verification workflow from request to completion.

### Requirements
1. Create asset with initial PENDING status
2. Request verification of specific type
3. Process verification (simulate external service)
4. Update asset status based on result
5. Send notifications and trigger webhooks

### Verification Checklist

- [ ] Assets can be created with metadata
- [ ] Verifications can be requested for assets
- [ ] Verification status updates correctly
- [ ] Asset status reflects verification result
- [ ] Notifications are sent on completion
- [ ] Webhooks are triggered with correct payload

---

## 📝 Module 4 Assessment

Complete the following to finish Module 4:

1. **Knowledge Test** (30 questions, 70% to pass)
2. **Lab Completion** (verified by checklist)
3. **Integration Exercise**: Connect all features in a working flow

---

**Next Module**: [Module 5: API Integration & GraphQL](../module-05-api/README.md)

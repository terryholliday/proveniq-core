import { db } from "@/lib/db";
import { isGdprEnabled } from "./config";

export interface UserDataExport {
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  };
  organizations: {
    id: string;
    name: string;
    role: string;
    joinedAt: Date;
  }[];
  apiKeys: {
    id: string;
    name: string;
    createdAt: Date;
    lastUsedAt: Date | null;
  }[];
  auditLogs: {
    action: string;
    entityType: string;
    createdAt: Date;
  }[];
  documents: {
    id: string;
    name: string;
    createdAt: Date;
  }[];
  exportedAt: Date;
}

export async function exportUserData(userId: string): Promise<UserDataExport | null> {
  if (!isGdprEnabled()) {
    throw new Error("GDPR features are not enabled");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      organizations: {
        include: {
          organization: true,
        },
      },
      apiKeys: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          lastUsedAt: true,
        },
      },
      auditLogs: {
        select: {
          action: true,
          entityType: true,
          createdAt: true,
        },
        take: 1000,
        orderBy: { createdAt: "desc" },
      },
      documents: {
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    organizations: user.organizations.map((om: any) => ({
      id: om.organization.id,
      name: om.organization.name,
      role: om.role,
      joinedAt: om.createdAt,
    })),
    apiKeys: user.apiKeys.map((key: any) => ({
      id: key.id,
      name: key.name,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
    })),
    auditLogs: user.auditLogs.map((log: any) => ({
      action: log.action,
      entityType: log.entityType,
      createdAt: log.createdAt,
    })),
    documents: user.documents.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      createdAt: doc.createdAt,
    })),
    exportedAt: new Date(),
  };
}

export async function deleteUserData(userId: string): Promise<{
  success: boolean;
  deletedItems: {
    apiKeys: number;
    documents: number;
    auditLogs: number;
    organizationMemberships: number;
  };
}> {
  if (!isGdprEnabled()) {
    throw new Error("GDPR features are not enabled");
  }

  // Delete in order to respect foreign key constraints
  const apiKeys = await db.apiKey.deleteMany({
    where: { userId },
  });

  const documents = await db.document.deleteMany({
    where: { userId },
  });

  // Anonymize audit logs instead of deleting
  const auditLogs = await db.auditLog.updateMany({
    where: { userId },
    data: { userId: null },
  });

  const memberships = await db.organizationMember.deleteMany({
    where: { userId },
  });

  // Finally delete the user
  await db.user.delete({
    where: { id: userId },
  });

  return {
    success: true,
    deletedItems: {
      apiKeys: apiKeys.count,
      documents: documents.count,
      auditLogs: auditLogs.count,
      organizationMemberships: memberships.count,
    },
  };
}

export async function anonymizeUserData(userId: string): Promise<boolean> {
  if (!isGdprEnabled()) {
    throw new Error("GDPR features are not enabled");
  }

  const anonymizedEmail = `deleted-${userId}@anonymized.local`;
  
  await db.user.update({
    where: { id: userId },
    data: {
      email: anonymizedEmail,
      name: "Deleted User",
      image: null,
      passwordHash: null,
    },
  });

  // Anonymize audit logs
  await db.auditLog.updateMany({
    where: { userId },
    data: {
      metadata: { anonymized: true } as any,
    },
  });

  return true;
}

export interface ConsentRecord {
  userId: string;
  consentType: string;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
}

export async function recordConsent(consent: ConsentRecord): Promise<void> {
  await db.auditLog.create({
    data: {
      action: "consent.recorded",
      entityType: "consent",
      userId: consent.userId,
      metadata: {
        consentType: consent.consentType,
        granted: consent.granted,
        timestamp: consent.timestamp.toISOString(),
      } as any,
      ipAddress: consent.ipAddress,
    },
  });
}

export async function getConsentHistory(userId: string): Promise<ConsentRecord[]> {
  const logs = await db.auditLog.findMany({
    where: {
      userId,
      action: "consent.recorded",
    },
    orderBy: { createdAt: "desc" },
  });

  return logs.map((log: any) => {
    const metadata = log.metadata as any;
    return {
      userId: log.userId!,
      consentType: metadata?.consentType || "unknown",
      granted: metadata?.granted || false,
      timestamp: new Date(metadata?.timestamp || log.createdAt),
      ipAddress: log.ipAddress || undefined,
    };
  });
}

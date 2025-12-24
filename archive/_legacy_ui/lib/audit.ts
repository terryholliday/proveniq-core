import { db } from "@/lib/db";
import { headers } from "next/headers";

export type AuditAction =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "user.login"
  | "user.logout"
  | "user.password_changed"
  | "user.2fa_enabled"
  | "user.2fa_disabled"
  | "organization.created"
  | "organization.updated"
  | "organization.deleted"
  | "organization.member_added"
  | "organization.member_removed"
  | "organization.member_role_changed"
  | "asset.created"
  | "asset.updated"
  | "asset.deleted"
  | "asset.verified"
  | "verification.requested"
  | "verification.completed"
  | "verification.failed"
  | "api_key.created"
  | "api_key.revoked"
  | "api_key.used"
  | "webhook.created"
  | "webhook.updated"
  | "webhook.deleted"
  | "webhook.triggered"
  | "settings.updated";

export type EntityType =
  | "user"
  | "organization"
  | "asset"
  | "verification"
  | "api_key"
  | "webhook"
  | "settings";

export interface AuditLogInput {
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(input: AuditLogInput) {
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? 
                    headersList.get("x-real-ip") ?? 
                    "unknown";
  const userAgent = headersList.get("user-agent") ?? undefined;

  return db.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId,
      organizationId: input.organizationId,
      metadata: input.metadata as object | undefined,
      ipAddress,
      userAgent,
    },
  });
}

export async function getAuditLogs(options: {
  userId?: string;
  organizationId?: string;
  entityType?: EntityType;
  entityId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const {
    userId,
    organizationId,
    entityType,
    entityId,
    action,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = options;

  const where: Record<string, unknown> = {};

  if (userId) where.userId = userId;
  if (organizationId) where.organizationId = organizationId;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (action) where.action = action;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit,
    offset,
    hasMore: offset + logs.length < total,
  };
}

export async function getEntityAuditTrail(entityType: EntityType, entityId: string) {
  return db.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function exportAuditLogs(options: {
  organizationId?: string;
  startDate: Date;
  endDate: Date;
}) {
  const { organizationId, startDate, endDate } = options;

  const where: Record<string, unknown> = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (organizationId) where.organizationId = organizationId;

  return db.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

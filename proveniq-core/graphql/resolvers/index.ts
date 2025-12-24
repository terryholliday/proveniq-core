import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission, Role } from "@/lib/rbac/roles";
import { createApiKey, listApiKeys, revokeApiKey, deleteApiKey } from "@/lib/apiKeys";
import { createSignatureRequest, cancelSignatureRequest } from "@/lib/esign/request";
import { search as searchIndex } from "@/lib/search/index";

export interface Context {
  userId?: string;
  userRole?: Role;
}

export async function createContext(): Promise<Context> {
  const session = await getServerSession(authOptions);
  return {
    userId: session?.user?.id,
    userRole: (session?.user?.role as Role) || undefined,
  };
}

function requireAuth(ctx: Context): string {
  if (!ctx.userId) {
    throw new Error("Authentication required");
  }
  return ctx.userId;
}

function requirePermission(ctx: Context, permission: string): void {
  if (!ctx.userRole || !hasPermission(ctx.userRole, permission as any)) {
    throw new Error("Permission denied");
  }
}

async function requireOrgAccess(ctx: Context, organizationId: string): Promise<void> {
  const userId = requireAuth(ctx);
  const membership = await db.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (!membership) {
    throw new Error("Organization access denied");
  }
}

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: Context) => {
      const userId = requireAuth(ctx);
      return db.user.findUnique({ where: { id: userId } });
    },

    user: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireAuth(ctx);
      return db.user.findUnique({ where: { id } });
    },

    organizations: async (_: unknown, __: unknown, ctx: Context) => {
      const userId = requireAuth(ctx);
      const memberships = await db.organizationMember.findMany({
        where: { userId },
        include: { organization: true },
      });
      return memberships.map((m: any) => m.organization);
    },

    organization: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      await requireOrgAccess(ctx, id);
      return db.organization.findUnique({ where: { id } });
    },

    organizationBySlug: async (_: unknown, { slug }: { slug: string }, ctx: Context) => {
      requireAuth(ctx);
      const org = await db.organization.findUnique({ where: { slug } });
      if (org) await requireOrgAccess(ctx, org.id);
      return org;
    },

    assets: async (
      _: unknown,
      { organizationId, status, limit = 50, offset = 0 }: any,
      ctx: Context
    ) => {
      await requireOrgAccess(ctx, organizationId);
      const where: any = { organizationId };
      if (status) where.status = status;

      const [assets, total] = await Promise.all([
        db.asset.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
        }),
        db.asset.count({ where }),
      ]);

      return {
        edges: assets.map((a: any, i: number) => ({
          node: a,
          cursor: Buffer.from(`${offset + i}`).toString("base64"),
        })),
        pageInfo: {
          hasNextPage: offset + assets.length < total,
          hasPreviousPage: offset > 0,
          totalCount: total,
        },
      };
    },

    asset: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const asset = await db.asset.findUnique({ where: { id } });
      if (asset) await requireOrgAccess(ctx, asset.organizationId);
      return asset;
    },

    verifications: async (
      _: unknown,
      { assetId, limit = 50, offset = 0 }: any,
      ctx: Context
    ) => {
      const asset = await db.asset.findUnique({ where: { id: assetId } });
      if (!asset) throw new Error("Asset not found");
      await requireOrgAccess(ctx, asset.organizationId);

      const [verifications, total] = await Promise.all([
        db.verification.findMany({
          where: { assetId },
          take: limit,
          skip: offset,
          orderBy: { requestedAt: "desc" },
        }),
        db.verification.count({ where: { assetId } }),
      ]);

      return {
        edges: verifications.map((v: any, i: number) => ({
          node: v,
          cursor: Buffer.from(`${offset + i}`).toString("base64"),
        })),
        pageInfo: {
          hasNextPage: offset + verifications.length < total,
          hasPreviousPage: offset > 0,
          totalCount: total,
        },
      };
    },

    verification: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireAuth(ctx);
      return db.verification.findUnique({ where: { id } });
    },

    documents: async (
      _: unknown,
      { organizationId, limit = 50, offset = 0 }: any,
      ctx: Context
    ) => {
      await requireOrgAccess(ctx, organizationId);

      const [documents, total] = await Promise.all([
        db.document.findMany({
          where: { organizationId },
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
        }),
        db.document.count({ where: { organizationId } }),
      ]);

      return {
        edges: documents.map((d: any, i: number) => ({
          node: d,
          cursor: Buffer.from(`${offset + i}`).toString("base64"),
        })),
        pageInfo: {
          hasNextPage: offset + documents.length < total,
          hasPreviousPage: offset > 0,
          totalCount: total,
        },
      };
    },

    document: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const doc = await db.document.findUnique({ where: { id } });
      if (doc) await requireOrgAccess(ctx, doc.organizationId);
      return doc;
    },

    apiKeys: async (_: unknown, { organizationId }: any, ctx: Context) => {
      const userId = requireAuth(ctx);
      return listApiKeys({ userId, organizationId });
    },

    apiKey: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireAuth(ctx);
      return db.apiKey.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          scopes: true,
          lastUsedAt: true,
          expiresAt: true,
          createdAt: true,
          revokedAt: true,
        },
      });
    },

    notifications: async (
      _: unknown,
      { unreadOnly, limit = 50, offset = 0 }: any,
      ctx: Context
    ) => {
      const userId = requireAuth(ctx);
      const where: any = { userId };
      if (unreadOnly) where.readAt = null;

      const [notifications, total] = await Promise.all([
        db.notification.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
        }),
        db.notification.count({ where }),
      ]);

      return {
        edges: notifications.map((n: any, i: number) => ({
          node: n,
          cursor: Buffer.from(`${offset + i}`).toString("base64"),
        })),
        pageInfo: {
          hasNextPage: offset + notifications.length < total,
          hasPreviousPage: offset > 0,
          totalCount: total,
        },
      };
    },

    unreadNotificationCount: async (_: unknown, __: unknown, ctx: Context) => {
      const userId = requireAuth(ctx);
      return db.notification.count({ where: { userId, readAt: null } });
    },

    auditLogs: async (
      _: unknown,
      { organizationId, entityType, action, limit = 50, offset = 0 }: any,
      ctx: Context
    ) => {
      requirePermission(ctx, "audit:read");
      const where: any = {};
      if (organizationId) where.organizationId = organizationId;
      if (entityType) where.entityType = entityType;
      if (action) where.action = { contains: action };

      const [logs, total] = await Promise.all([
        db.auditLog.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
        }),
        db.auditLog.count({ where }),
      ]);

      return {
        edges: logs.map((l: any, i: number) => ({
          node: l,
          cursor: Buffer.from(`${offset + i}`).toString("base64"),
        })),
        pageInfo: {
          hasNextPage: offset + logs.length < total,
          hasPreviousPage: offset > 0,
          totalCount: total,
        },
      };
    },

    search: async (
      _: unknown,
      { query, types, limit = 20 }: any,
      ctx: Context
    ) => {
      requireAuth(ctx);
      return searchIndex(query);
    },
  },

  Mutation: {
    createOrganization: async (
      _: unknown,
      { input }: { input: { name: string; slug: string } },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx);
      const org = await db.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          members: {
            create: { userId, role: "OWNER" },
          },
        },
      });
      return org;
    },

    updateOrganization: async (
      _: unknown,
      { id, input }: { id: string; input: { name?: string } },
      ctx: Context
    ) => {
      await requireOrgAccess(ctx, id);
      return db.organization.update({
        where: { id },
        data: input,
      });
    },

    deleteOrganization: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      await requireOrgAccess(ctx, id);
      await db.organization.delete({ where: { id } });
      return true;
    },

    createAsset: async (_: unknown, { input }: any, ctx: Context) => {
      await requireOrgAccess(ctx, input.organizationId);
      return db.asset.create({ data: input });
    },

    updateAsset: async (_: unknown, { id, input }: any, ctx: Context) => {
      const asset = await db.asset.findUnique({ where: { id } });
      if (!asset) throw new Error("Asset not found");
      await requireOrgAccess(ctx, asset.organizationId);
      return db.asset.update({ where: { id }, data: input });
    },

    deleteAsset: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const asset = await db.asset.findUnique({ where: { id } });
      if (!asset) throw new Error("Asset not found");
      await requireOrgAccess(ctx, asset.organizationId);
      await db.asset.delete({ where: { id } });
      return true;
    },

    requestVerification: async (
      _: unknown,
      { assetId, type }: { assetId: string; type: string },
      ctx: Context
    ) => {
      const asset = await db.asset.findUnique({ where: { id: assetId } });
      if (!asset) throw new Error("Asset not found");
      await requireOrgAccess(ctx, asset.organizationId);
      return db.verification.create({
        data: { assetId, type: type as any, status: "PENDING" },
      });
    },

    createApiKey: async (_: unknown, { input }: any, ctx: Context) => {
      const userId = requireAuth(ctx);
      return createApiKey({
        name: input.name,
        scopes: input.scopes,
        userId,
        organizationId: input.organizationId,
        expiresAt: input.expiresInDays
          ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
          : undefined,
      });
    },

    revokeApiKey: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const userId = requireAuth(ctx);
      return revokeApiKey(id, userId);
    },

    deleteApiKey: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const userId = requireAuth(ctx);
      return deleteApiKey(id, userId);
    },

    markNotificationRead: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const userId = requireAuth(ctx);
      return db.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });
    },

    markAllNotificationsRead: async (_: unknown, __: unknown, ctx: Context) => {
      const userId = requireAuth(ctx);
      const result = await db.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });
      return result.count;
    },

    deleteNotification: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireAuth(ctx);
      await db.notification.delete({ where: { id } });
      return true;
    },

    requestSignature: async (_: unknown, { input }: any, ctx: Context) => {
      const userId = requireAuth(ctx);
      await requireOrgAccess(ctx, input.organizationId);
      return createSignatureRequest({
        documentId: input.documentId,
        organizationId: input.organizationId,
        requestedById: userId,
        recipients: input.recipients,
        emailSubject: input.emailSubject,
        emailBody: input.emailBody,
      });
    },

    cancelSignatureRequest: async (
      _: unknown,
      { envelopeId, reason }: { envelopeId: string; reason: string },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx);
      // Would need to look up the organization from the envelope
      await cancelSignatureRequest(envelopeId, reason, userId, "");
      return true;
    },
  },

  // Field resolvers
  User: {
    organizations: async (user: any) => {
      const memberships = await db.organizationMember.findMany({
        where: { userId: user.id },
        include: { organization: true },
      });
      return memberships;
    },
  },

  Organization: {
    members: async (org: any) => {
      return db.organizationMember.findMany({
        where: { organizationId: org.id },
        include: { user: true },
      });
    },
    assets: async (org: any) => {
      return db.asset.findMany({ where: { organizationId: org.id } });
    },
    apiKeys: async (org: any) => {
      return db.apiKey.findMany({ where: { organizationId: org.id } });
    },
  },

  OrganizationMember: {
    user: async (member: any) => {
      return db.user.findUnique({ where: { id: member.userId } });
    },
    organization: async (member: any) => {
      return db.organization.findUnique({ where: { id: member.organizationId } });
    },
  },

  Asset: {
    organization: async (asset: any) => {
      return db.organization.findUnique({ where: { id: asset.organizationId } });
    },
    verifications: async (asset: any) => {
      return db.verification.findMany({ where: { assetId: asset.id } });
    },
  },

  Verification: {
    asset: async (verification: any) => {
      return db.asset.findUnique({ where: { id: verification.assetId } });
    },
  },

  Document: {
    organization: async (doc: any) => {
      return db.organization.findUnique({ where: { id: doc.organizationId } });
    },
    uploadedBy: async (doc: any) => {
      return doc.userId ? db.user.findUnique({ where: { id: doc.userId } }) : null;
    },
  },

  AuditLog: {
    user: async (log: any) => {
      return log.userId ? db.user.findUnique({ where: { id: log.userId } }) : null;
    },
    organization: async (log: any) => {
      return log.organizationId
        ? db.organization.findUnique({ where: { id: log.organizationId } })
        : null;
    },
  },
};

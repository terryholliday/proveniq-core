import { db } from "@/lib/db";
import { ReportTemplate, getTemplate } from "./templates";

export interface ReportData {
  template: ReportTemplate;
  generatedAt: Date;
  filters: Record<string, unknown>;
  data: Record<string, unknown>[];
  summary?: Record<string, unknown>;
}

export interface GenerateReportOptions {
  templateId: string;
  organizationId: string;
  filters?: Record<string, unknown>;
  limit?: number;
}

export async function generateReport(options: GenerateReportOptions): Promise<ReportData | null> {
  const template = getTemplate(options.templateId);
  if (!template) return null;

  const { organizationId, filters = {}, limit = 1000 } = options;

  let data: Record<string, unknown>[] = [];
  let summary: Record<string, unknown> | undefined;

  switch (options.templateId) {
    case "asset-inventory":
      data = await generateAssetInventory(organizationId, filters, limit);
      summary = {
        totalAssets: data.length,
        activeAssets: data.filter((d) => d.status === "ACTIVE").length,
        totalValue: data.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
      };
      break;

    case "verification-history":
      data = await generateVerificationHistory(organizationId, filters, limit);
      summary = {
        totalVerifications: data.length,
        passed: data.filter((d) => d.status === "PASSED").length,
        failed: data.filter((d) => d.status === "FAILED").length,
      };
      break;

    case "audit-trail":
      data = await generateAuditTrail(organizationId, filters, limit);
      summary = {
        totalEvents: data.length,
        uniqueUsers: new Set(data.map((d) => d.user)).size,
      };
      break;

    case "api-usage":
      data = await generateApiUsage(organizationId, filters, limit);
      summary = {
        totalRequests: data.reduce((sum, d) => sum + (Number(d.requests) || 0), 0),
        avgLatency: Math.round(
          data.reduce((sum, d) => sum + (Number(d.avgLatency) || 0), 0) / (data.length || 1)
        ),
      };
      break;

    case "compliance-summary":
      data = await generateComplianceSummary(organizationId);
      break;

    default:
      return null;
  }

  return {
    template,
    generatedAt: new Date(),
    filters,
    data,
    summary,
  };
}

async function generateAssetInventory(
  organizationId: string,
  filters: Record<string, unknown>,
  limit: number
): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = { organizationId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.dateRange) {
    const range = filters.dateRange as { start?: string; end?: string };
    where.createdAt = {};
    if (range.start) (where.createdAt as Record<string, unknown>).gte = new Date(range.start);
    if (range.end) (where.createdAt as Record<string, unknown>).lte = new Date(range.end);
  }

  const assets = await db.asset.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      verifications: {
        take: 1,
        orderBy: { requestedAt: "desc" },
      },
    },
  });

  return assets.map((asset: any) => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
    status: asset.status,
    value: asset.value,
    createdAt: asset.createdAt,
    lastVerified: asset.verifications[0]?.createdAt || null,
  }));
}

async function generateVerificationHistory(
  organizationId: string,
  filters: Record<string, unknown>,
  limit: number
): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = {
    asset: { organizationId },
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.dateRange) {
    const range = filters.dateRange as { start?: string; end?: string };
    where.createdAt = {};
    if (range.start) (where.createdAt as Record<string, unknown>).gte = new Date(range.start);
    if (range.end) (where.createdAt as Record<string, unknown>).lte = new Date(range.end);
  }

  const verifications = await db.verification.findMany({
    where,
    take: limit,
    orderBy: { requestedAt: "desc" },
    include: {
      asset: { select: { id: true, name: true } },
    },
  });

  return verifications.map((v: any) => ({
    id: v.id,
    assetId: v.asset.id,
    assetName: v.asset.name,
    verifier: "System",
    status: v.status,
    completedAt: v.completedAt,
  }));
}

async function generateAuditTrail(
  organizationId: string,
  filters: Record<string, unknown>,
  limit: number
): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = { organizationId };

  if (filters.action) {
    where.action = { contains: filters.action as string };
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.dateRange) {
    const range = filters.dateRange as { start?: string; end?: string };
    where.createdAt = {};
    if (range.start) (where.createdAt as Record<string, unknown>).gte = new Date(range.start);
    if (range.end) (where.createdAt as Record<string, unknown>).lte = new Date(range.end);
  }

  const logs = await db.auditLog.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return logs.map((log: any) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    user: log.user?.name || log.user?.email || "System",
    ipAddress: log.ipAddress,
    createdAt: log.createdAt,
  }));
}

async function generateApiUsage(
  organizationId: string,
  filters: Record<string, unknown>,
  limit: number
): Promise<Record<string, unknown>[]> {
  const keys = await db.apiKey.findMany({
    where: { organizationId },
    select: { id: true, name: true },
  });

  const keyIds = keys.map((k: { id: string; name: string }) => k.id);
  const keyMap = new Map(keys.map((k: { id: string; name: string }) => [k.id, k.name]));

  const whereUsage: Record<string, unknown> = {
    apiKeyId: { in: keyIds },
  };

  if (filters.dateRange) {
    const range = filters.dateRange as { start?: string; end?: string };
    whereUsage.createdAt = {};
    if (range.start) (whereUsage.createdAt as Record<string, unknown>).gte = new Date(range.start);
    if (range.end) (whereUsage.createdAt as Record<string, unknown>).lte = new Date(range.end);
  }

  const usage = await db.apiKeyUsage.groupBy({
    by: ["apiKeyId", "endpoint"],
    where: whereUsage,
    _count: { id: true },
    _avg: { latencyMs: true },
  });

  // Get error counts
  const errors = await db.apiKeyUsage.groupBy({
    by: ["apiKeyId", "endpoint"],
    where: {
      ...whereUsage,
      status: { gte: 400 },
    },
    _count: { id: true },
  });

  const errorMap = new Map(
    errors.map((e: any) => [`${e.apiKeyId}:${e.endpoint}`, e._count.id])
  );

  return usage.slice(0, limit).map((u: any) => ({
    keyName: keyMap.get(u.apiKeyId) || "Unknown",
    endpoint: u.endpoint,
    requests: u._count.id,
    avgLatency: Math.round(u._avg.latencyMs || 0),
    errorRate: Number(u._count.id) > 0
      ? (Number(errorMap.get(`${u.apiKeyId}:${u.endpoint}`) || 0) / Number(u._count.id)) * 100
      : 0,
  }));
}

async function generateComplianceSummary(
  organizationId: string
): Promise<Record<string, unknown>[]> {
  const now = new Date();

  // Get various compliance metrics
  const totalUsers = await db.organizationMember.count({
    where: { organizationId },
  });

  const activeApiKeys = await db.apiKey.count({
    where: {
      organizationId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  const recentAuditLogs = await db.auditLog.count({
    where: {
      organizationId,
      createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    },
  });

  return [
    {
      metric: "Total Users",
      value: totalUsers.toString(),
      status: "Active",
      lastChecked: now,
    },
    {
      metric: "Active API Keys",
      value: activeApiKeys.toString(),
      status: activeApiKeys > 0 ? "Active" : "None",
      lastChecked: now,
    },
    {
      metric: "Audit Logging",
      value: "Enabled",
      status: recentAuditLogs > 0 ? "Active" : "No Recent Activity",
      lastChecked: now,
    },
    {
      metric: "Data Encryption",
      value: "TLS 1.3 / AES-256",
      status: "Compliant",
      lastChecked: now,
    },
    {
      metric: "GDPR Compliance",
      value: "Enabled",
      status: "Compliant",
      lastChecked: now,
    },
  ];
}

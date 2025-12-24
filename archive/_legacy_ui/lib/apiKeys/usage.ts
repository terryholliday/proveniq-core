import { db } from "@/lib/db";

export interface UsageRecord {
  apiKeyId: string;
  endpoint: string;
  method: string;
  status: number;
  latencyMs: number;
}

const usageBuffer: UsageRecord[] = [];
const FLUSH_INTERVAL = 30000; // 30 seconds
const BUFFER_SIZE = 50;

let flushTimer: NodeJS.Timeout | null = null;

export function recordUsage(record: UsageRecord) {
  usageBuffer.push(record);

  if (usageBuffer.length >= BUFFER_SIZE) {
    flushUsageBuffer();
  }

  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushUsageBuffer();
      flushTimer = null;
    }, FLUSH_INTERVAL);
  }
}

async function flushUsageBuffer() {
  if (usageBuffer.length === 0) return;

  const records = usageBuffer.splice(0, usageBuffer.length);

  try {
    await db.apiKeyUsage.createMany({
      data: records,
    });
  } catch (error) {
    console.error("[ApiKeyUsage] Failed to flush buffer:", error);
  }
}

export interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  requestsByEndpoint: Record<string, number>;
  requestsByDay: { date: string; count: number }[];
}

export async function getUsageStats(
  apiKeyId: string,
  days: number = 30
): Promise<UsageStats> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const usage = await db.apiKeyUsage.findMany({
    where: {
      apiKeyId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalRequests = usage.length;
  const successfulRequests = usage.filter((u: { status: number }) => u.status < 400).length;
  const failedRequests = totalRequests - successfulRequests;
  const avgLatencyMs =
    totalRequests > 0
      ? Math.round(usage.reduce((sum: number, u: { latencyMs: number }) => sum + u.latencyMs, 0) / totalRequests)
      : 0;

  // Group by endpoint
  const requestsByEndpoint: Record<string, number> = {};
  for (const u of usage) {
    requestsByEndpoint[u.endpoint] = (requestsByEndpoint[u.endpoint] || 0) + 1;
  }

  // Group by day
  const requestsByDayMap = new Map<string, number>();
  for (const u of usage) {
    const date = u.createdAt.toISOString().split("T")[0];
    requestsByDayMap.set(date, (requestsByDayMap.get(date) || 0) + 1);
  }
  const requestsByDay = Array.from(requestsByDayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    avgLatencyMs,
    requestsByEndpoint,
    requestsByDay,
  };
}

export async function getAggregatedUsage(
  organizationId: string,
  days: number = 30
): Promise<{
  totalRequests: number;
  byKey: { keyId: string; keyName: string; requests: number }[];
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const keys = await db.apiKey.findMany({
    where: { organizationId },
    select: { id: true, name: true },
  });

  const keyIds = keys.map((k: { id: string }) => k.id);

  const usage = await db.apiKeyUsage.groupBy({
    by: ["apiKeyId"],
    where: {
      apiKeyId: { in: keyIds },
      createdAt: { gte: since },
    },
    _count: { id: true },
  });

  const keyMap = new Map(keys.map((k: { id: string; name: string }) => [k.id, k.name]));

  return {
    totalRequests: usage.reduce((sum: number, u: { _count: { id: number } }) => sum + u._count.id, 0),
    byKey: usage.map((u: { apiKeyId: string; _count: { id: number } }) => ({
      keyId: u.apiKeyId,
      keyName: keyMap.get(u.apiKeyId) || "Unknown",
      requests: u._count.id,
    })),
  };
}

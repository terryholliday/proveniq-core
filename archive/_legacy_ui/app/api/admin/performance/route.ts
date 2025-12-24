import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission, Role } from "@/lib/rbac/roles";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permission
    const userRole = (session.user.role || "USER") as Role;
    const canView = hasPermission(userRole, "audit:read");
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "24h";

    // Calculate time range
    const now = new Date();
    let since: Date;
    switch (range) {
      case "1h":
        since = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "7d":
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Fetch web vitals
    const vitalsLogs = await db.auditLog.findMany({
      where: {
        action: { startsWith: "vitals." },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // Aggregate vitals by metric name
    const vitalsMap = new Map<string, { values: number[]; ratings: string[] }>();
    for (const log of vitalsLogs) {
      const metadata = log.metadata as any;
      if (!metadata?.metric) continue;

      const existing = vitalsMap.get(metadata.metric) || { values: [], ratings: [] };
      existing.values.push(metadata.value);
      existing.ratings.push(metadata.rating);
      vitalsMap.set(metadata.metric, existing);
    }

    const vitals = Array.from(vitalsMap.entries()).map(([name, data]) => {
      const avgValue = data.values.reduce((a, b) => a + b, 0) / data.values.length;
      const goodCount = data.ratings.filter((r) => r === "good").length;
      const poorCount = data.ratings.filter((r) => r === "poor").length;

      let rating: "good" | "needs-improvement" | "poor";
      if (goodCount > data.ratings.length * 0.75) rating = "good";
      else if (poorCount > data.ratings.length * 0.25) rating = "poor";
      else rating = "needs-improvement";

      return {
        name,
        value: avgValue,
        rating,
        count: data.values.length,
      };
    });

    // Fetch API latency
    const latencyLogs = await db.auditLog.findMany({
      where: {
        action: "api.latency",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    // Aggregate latency by path
    const latencyMap = new Map<string, {
      durations: number[];
      errorCount: number;
      method: string;
    }>();

    for (const log of latencyLogs) {
      const metadata = log.metadata as any;
      if (!metadata?.path) continue;

      const key = `${metadata.method}:${metadata.path}`;
      const existing = latencyMap.get(key) || {
        durations: [] as number[],
        errorCount: 0,
        method: metadata.method as string,
      };

      existing.durations.push(metadata.avgDuration || 0);
      existing.errorCount += metadata.errorCount || 0;
      latencyMap.set(key, existing);
    }

    const latency = Array.from(latencyMap.entries())
      .map(([key, data]) => {
        const [method, path] = key.split(":");
        const totalRequests = data.durations.length;
        const avgDuration = Math.round(
          data.durations.reduce((a, b) => a + b, 0) / totalRequests
        );

        return {
          path,
          method,
          avgDuration,
          count: totalRequests,
          errorRate: totalRequests > 0 ? (data.errorCount / totalRequests) * 100 : 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return NextResponse.json({ vitals, latency });
  } catch (error) {
    console.error("[Performance] API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

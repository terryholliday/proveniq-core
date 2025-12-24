import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export interface LatencyRecord {
  path: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: string;
  userId?: string;
}

const latencyBuffer: LatencyRecord[] = [];
const FLUSH_INTERVAL = 60000; // 1 minute
const BUFFER_SIZE = 100;

let flushTimer: NodeJS.Timeout | null = null;

export function recordLatency(record: LatencyRecord) {
  latencyBuffer.push(record);

  // Flush if buffer is full
  if (latencyBuffer.length >= BUFFER_SIZE) {
    flushLatencyBuffer();
  }

  // Start flush timer if not running
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushLatencyBuffer();
      flushTimer = null;
    }, FLUSH_INTERVAL);
  }
}

async function flushLatencyBuffer() {
  if (latencyBuffer.length === 0) return;

  const records = latencyBuffer.splice(0, latencyBuffer.length);

  try {
    // Aggregate by path and method
    const aggregated = new Map<string, {
      count: number;
      totalDuration: number;
      minDuration: number;
      maxDuration: number;
      errorCount: number;
    }>();

    for (const record of records) {
      const key = `${record.method}:${record.path}`;
      const existing = aggregated.get(key) || {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errorCount: 0,
      };

      existing.count++;
      existing.totalDuration += record.duration;
      existing.minDuration = Math.min(existing.minDuration, record.duration);
      existing.maxDuration = Math.max(existing.maxDuration, record.duration);
      if (record.statusCode >= 400) existing.errorCount++;

      aggregated.set(key, existing);
    }

    // Store aggregated metrics
    for (const [key, metrics] of aggregated) {
      const [method, path] = key.split(":");
      await db.auditLog.create({
        data: {
          action: "api.latency",
          entityType: "performance",
          metadata: {
            type: "api_latency",
            path,
            method,
            count: metrics.count,
            avgDuration: Math.round(metrics.totalDuration / metrics.count),
            minDuration: metrics.minDuration,
            maxDuration: metrics.maxDuration,
            errorCount: metrics.errorCount,
            timestamp: new Date().toISOString(),
          } as any,
        },
      });
    }
  } catch (error) {
    console.error("[Latency] Failed to flush buffer:", error);
  }
}

export function withLatencyTracking<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (req: NextRequest, ...args: any[]) => {
    const start = performance.now();
    const response = await handler(req, ...args);
    const duration = Math.round(performance.now() - start);

    recordLatency({
      path: new URL(req.url).pathname,
      method: req.method,
      duration,
      statusCode: response.status,
      timestamp: new Date().toISOString(),
    });

    // Add timing header
    response.headers.set("Server-Timing", `total;dur=${duration}`);

    return response;
  }) as T;
}

export function createLatencyMiddleware() {
  return async function latencyMiddleware(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const start = performance.now();
    const response = await handler();
    const duration = Math.round(performance.now() - start);

    recordLatency({
      path: new URL(req.url).pathname,
      method: req.method,
      duration,
      statusCode: response.status,
      timestamp: new Date().toISOString(),
    });

    response.headers.set("Server-Timing", `total;dur=${duration}`);

    return response;
  };
}

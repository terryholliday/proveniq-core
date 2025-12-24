import { db } from "@/lib/db";

export interface ErrorPayload {
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export async function trackError(payload: ErrorPayload) {
  const { message, stack, componentStack, url, userId, metadata } = payload;

  // Store in database
  await db.auditLog.create({
    data: {
      action: "error.client",
      entityType: "error",
      userId: userId || null,
      metadata: {
        type: "error",
        message,
        stack,
        componentStack,
        url,
        ...metadata,
        timestamp: new Date().toISOString(),
      } as any,
    },
  });

  // Forward to external error tracking service if configured
  if (process.env.SENTRY_DSN) {
    await forwardToSentry(payload);
  }

  return { success: true };
}

async function forwardToSentry(payload: ErrorPayload) {
  // Sentry SDK would typically be initialized at app startup
  // This is a placeholder for manual API forwarding
  try {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) return;

    // Parse DSN to get project ID and key
    const match = dsn.match(/https:\/\/(.+)@(.+)\.ingest\.sentry\.io\/(.+)/);
    if (!match) return;

    const [, publicKey, , projectId] = match;

    await fetch(`https://sentry.io/api/${projectId}/store/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${publicKey}`,
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ""),
        timestamp: new Date().toISOString(),
        platform: "javascript",
        level: "error",
        message: payload.message,
        exception: payload.stack
          ? {
              values: [
                {
                  type: "Error",
                  value: payload.message,
                  stacktrace: { frames: parseStackTrace(payload.stack) },
                },
              ],
            }
          : undefined,
        user: payload.userId ? { id: payload.userId } : undefined,
        request: payload.url ? { url: payload.url } : undefined,
        extra: payload.metadata,
      }),
    });
  } catch (error) {
    console.error("[ErrorTracking] Sentry forward failed:", error);
  }
}

function parseStackTrace(stack: string) {
  return stack
    .split("\n")
    .slice(1)
    .map((line) => {
      const match = line.match(/at (.+) \((.+):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          filename: match[2],
          lineno: parseInt(match[3], 10),
          colno: parseInt(match[4], 10),
        };
      }
      return { function: line.trim() };
    })
    .reverse();
}

export function createErrorHandler(userId?: string) {
  return (error: Error, componentStack?: string) => {
    trackError({
      message: error.message,
      stack: error.stack,
      componentStack,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userId,
    });
  };
}

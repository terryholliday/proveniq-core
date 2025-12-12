import { db } from "@/lib/db";

export interface TrackEventPayload {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
  anonymousId?: string;
  timestamp?: string;
}

export interface IdentifyPayload {
  userId: string;
  traits?: Record<string, unknown>;
  timestamp?: string;
}

export interface PageViewPayload {
  name?: string;
  properties?: Record<string, unknown>;
  userId?: string;
  anonymousId?: string;
  timestamp?: string;
}

export async function trackEvent(payload: TrackEventPayload) {
  const { event, properties, userId, anonymousId, timestamp } = payload;

  // Store in database for internal analytics
  await db.auditLog.create({
    data: {
      action: `analytics.${event}`,
      entityType: "analytics",
      userId: userId || null,
      metadata: {
        type: "analytics_event",
        event,
        properties,
        anonymousId,
        timestamp: timestamp || new Date().toISOString(),
      } as any,
    },
  });

  // Forward to external analytics provider if configured
  if (process.env.ANALYTICS_PROVIDER === "segment") {
    await forwardToSegment("track", payload);
  } else if (process.env.ANALYTICS_PROVIDER === "mixpanel") {
    await forwardToMixpanel("track", payload);
  }

  return { success: true };
}

export async function identifyUser(payload: IdentifyPayload) {
  const { userId, traits, timestamp } = payload;

  await db.auditLog.create({
    data: {
      action: "analytics.identify",
      entityType: "analytics",
      userId,
      metadata: {
        type: "analytics_identify",
        traits,
        timestamp: timestamp || new Date().toISOString(),
      } as any,
    },
  });

  if (process.env.ANALYTICS_PROVIDER === "segment") {
    await forwardToSegment("identify", payload);
  } else if (process.env.ANALYTICS_PROVIDER === "mixpanel") {
    await forwardToMixpanel("identify", payload);
  }

  return { success: true };
}

export async function trackPageView(payload: PageViewPayload) {
  const { name, properties, userId, anonymousId, timestamp } = payload;

  await db.auditLog.create({
    data: {
      action: "analytics.page",
      entityType: "analytics",
      userId: userId || null,
      metadata: {
        type: "analytics_page",
        name,
        properties,
        anonymousId,
        timestamp: timestamp || new Date().toISOString(),
      } as any,
    },
  });

  if (process.env.ANALYTICS_PROVIDER === "segment") {
    await forwardToSegment("page", payload);
  } else if (process.env.ANALYTICS_PROVIDER === "mixpanel") {
    await forwardToMixpanel("page", payload);
  }

  return { success: true };
}

async function forwardToSegment(type: string, payload: unknown) {
  const writeKey = process.env.SEGMENT_WRITE_KEY;
  if (!writeKey) return;

  try {
    await fetch(`https://api.segment.io/v1/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(writeKey + ":").toString("base64")}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[Analytics] Segment forward failed:", error);
  }
}

async function forwardToMixpanel(type: string, payload: unknown) {
  const token = process.env.MIXPANEL_TOKEN;
  if (!token) return;

  try {
    const data = Buffer.from(JSON.stringify({ ...payload as object, token })).toString("base64");
    await fetch(`https://api.mixpanel.com/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${data}`,
    });
  } catch (error) {
    console.error("[Analytics] Mixpanel forward failed:", error);
  }
}

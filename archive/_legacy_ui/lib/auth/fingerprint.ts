import { createHash } from "crypto";
import { headers } from "next/headers";

export interface SessionFingerprint {
  hash: string;
  userAgent: string;
  acceptLanguage: string;
  ip: string;
  timestamp: number;
}

export async function generateFingerprint(): Promise<SessionFingerprint> {
  const headersList = await headers();
  
  const userAgent = headersList.get("user-agent") ?? "unknown";
  const acceptLanguage = headersList.get("accept-language") ?? "unknown";
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? 
             headersList.get("x-real-ip") ?? 
             "unknown";
  
  const fingerprintData = [
    userAgent,
    acceptLanguage,
    ip,
  ].join("|");
  
  const hash = createHash("sha256").update(fingerprintData).digest("hex");
  
  return {
    hash,
    userAgent,
    acceptLanguage,
    ip,
    timestamp: Date.now(),
  };
}

export function compareFingerprints(
  stored: SessionFingerprint,
  current: SessionFingerprint,
  options: {
    allowIpChange?: boolean;
    allowUserAgentChange?: boolean;
    maxAgeMs?: number;
  } = {}
): { valid: boolean; reason?: string } {
  const {
    allowIpChange = false,
    allowUserAgentChange = false,
    maxAgeMs = 24 * 60 * 60 * 1000, // 24 hours
  } = options;

  // Check age
  if (current.timestamp - stored.timestamp > maxAgeMs) {
    return { valid: false, reason: "fingerprint_expired" };
  }

  // Check IP if not allowed to change
  if (!allowIpChange && stored.ip !== current.ip) {
    return { valid: false, reason: "ip_changed" };
  }

  // Check user agent if not allowed to change
  if (!allowUserAgentChange && stored.userAgent !== current.userAgent) {
    return { valid: false, reason: "user_agent_changed" };
  }

  // If strict mode, compare full hash
  if (!allowIpChange && !allowUserAgentChange) {
    if (stored.hash !== current.hash) {
      return { valid: false, reason: "fingerprint_mismatch" };
    }
  }

  return { valid: true };
}

export function hashFingerprint(fingerprint: SessionFingerprint): string {
  return createHash("sha256")
    .update(JSON.stringify(fingerprint))
    .digest("hex");
}

export interface FingerprintValidationResult {
  isValid: boolean;
  riskLevel: "low" | "medium" | "high";
  flags: string[];
}

export function assessFingerprintRisk(
  stored: SessionFingerprint,
  current: SessionFingerprint
): FingerprintValidationResult {
  const flags: string[] = [];
  let riskScore = 0;

  // Check IP change
  if (stored.ip !== current.ip) {
    flags.push("ip_changed");
    riskScore += 30;
  }

  // Check user agent change
  if (stored.userAgent !== current.userAgent) {
    flags.push("user_agent_changed");
    riskScore += 20;
  }

  // Check language change
  if (stored.acceptLanguage !== current.acceptLanguage) {
    flags.push("language_changed");
    riskScore += 10;
  }

  // Check time since last fingerprint
  const hoursSinceStored = (current.timestamp - stored.timestamp) / (1000 * 60 * 60);
  if (hoursSinceStored > 24) {
    flags.push("session_old");
    riskScore += 10;
  }

  let riskLevel: "low" | "medium" | "high";
  if (riskScore >= 50) {
    riskLevel = "high";
  } else if (riskScore >= 20) {
    riskLevel = "medium";
  } else {
    riskLevel = "low";
  }

  return {
    isValid: riskLevel !== "high",
    riskLevel,
    flags,
  };
}

export function serializeFingerprint(fingerprint: SessionFingerprint): string {
  return Buffer.from(JSON.stringify(fingerprint)).toString("base64");
}

export function deserializeFingerprint(serialized: string): SessionFingerprint | null {
  try {
    return JSON.parse(Buffer.from(serialized, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

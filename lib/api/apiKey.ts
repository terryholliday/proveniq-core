import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { unauthorized } from "./response";

export interface ApiKeyData {
  id: string;
  userId: string | null;
  organizationId: string | null;
  scopes: string[];
}

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `sk_live_${randomBytes(24).toString("hex")}`;
  const hash = hashApiKey(key);
  const prefix = key.slice(0, 12);
  return { key, hash, prefix };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function extractApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  
  const apiKeyHeader = request.headers.get("x-api-key");
  if (apiKeyHeader) {
    return apiKeyHeader;
  }
  
  return null;
}

export async function validateApiKey(
  request: NextRequest
): Promise<{ valid: false; response: Response } | { valid: true; data: ApiKeyData }> {
  const key = extractApiKey(request);
  
  if (!key) {
    return {
      valid: false,
      response: unauthorized("API key required"),
    };
  }
  
  const keyHash = hashApiKey(key);
  
  const apiKey = await db.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      userId: true,
      organizationId: true,
      scopes: true,
      expiresAt: true,
      revokedAt: true,
    },
  });
  
  if (!apiKey) {
    return {
      valid: false,
      response: unauthorized("Invalid API key"),
    };
  }
  
  if (apiKey.revokedAt) {
    return {
      valid: false,
      response: unauthorized("API key has been revoked"),
    };
  }
  
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return {
      valid: false,
      response: unauthorized("API key has expired"),
    };
  }
  
  // Update last used timestamp (fire and forget)
  db.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});
  
  return {
    valid: true,
    data: {
      id: apiKey.id,
      userId: apiKey.userId,
      organizationId: apiKey.organizationId,
      scopes: apiKey.scopes,
    },
  };
}

export function hasScope(data: ApiKeyData, requiredScope: string): boolean {
  if (data.scopes.includes("*")) return true;
  return data.scopes.includes(requiredScope);
}

export function requireScopes(...scopes: string[]) {
  return (data: ApiKeyData): boolean => {
    return scopes.every((scope) => hasScope(data, scope));
  };
}

import { db } from "@/lib/db";
import crypto from "crypto";

const API_KEY_PREFIX = "piq_";
const KEY_LENGTH = 32;

export interface CreateApiKeyInput {
  name: string;
  scopes: string[];
  userId?: string;
  organizationId?: string;
  expiresAt?: Date;
}

export interface ApiKeyWithSecret {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt: Date | null;
  createdAt: Date;
  secret: string; // Only returned on creation
}

function generateApiKey(): { key: string; hash: string; prefix: string } {
  const randomBytes = crypto.randomBytes(KEY_LENGTH);
  const key = API_KEY_PREFIX + randomBytes.toString("base64url");
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const prefix = key.substring(0, 12);
  
  return { key, hash, prefix };
}

export async function createApiKey(input: CreateApiKeyInput): Promise<ApiKeyWithSecret> {
  const { key, hash, prefix } = generateApiKey();

  const apiKey = await db.apiKey.create({
    data: {
      name: input.name,
      keyHash: hash,
      keyPrefix: prefix,
      scopes: input.scopes,
      userId: input.userId,
      organizationId: input.organizationId,
      expiresAt: input.expiresAt,
    },
  });

  return {
    id: apiKey.id,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    scopes: apiKey.scopes,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
    secret: key,
  };
}

export async function validateApiKey(key: string): Promise<{
  valid: boolean;
  apiKey?: {
    id: string;
    userId: string | null;
    organizationId: string | null;
    scopes: string[];
  };
  error?: string;
}> {
  if (!key.startsWith(API_KEY_PREFIX)) {
    return { valid: false, error: "Invalid key format" };
  }

  const hash = crypto.createHash("sha256").update(key).digest("hex");

  const apiKey = await db.apiKey.findUnique({
    where: { keyHash: hash },
  });

  if (!apiKey) {
    return { valid: false, error: "Key not found" };
  }

  if (apiKey.revokedAt) {
    return { valid: false, error: "Key has been revoked" };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: "Key has expired" };
  }

  // Update last used timestamp
  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    valid: true,
    apiKey: {
      id: apiKey.id,
      userId: apiKey.userId,
      organizationId: apiKey.organizationId,
      scopes: apiKey.scopes,
    },
  };
}

export async function listApiKeys(options: {
  userId?: string;
  organizationId?: string;
}): Promise<{
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
}[]> {
  const where: Record<string, unknown> = {};
  
  if (options.userId) {
    where.userId = options.userId;
  }
  if (options.organizationId) {
    where.organizationId = options.organizationId;
  }

  const keys = await db.apiKey.findMany({
    where,
    orderBy: { createdAt: "desc" },
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

  return keys;
}

export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  const apiKey = await db.apiKey.findUnique({
    where: { id: keyId },
  });

  if (!apiKey) {
    return false;
  }

  // Check ownership
  if (apiKey.userId !== userId) {
    return false;
  }

  await db.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });

  return true;
}

export async function deleteApiKey(keyId: string, userId: string): Promise<boolean> {
  const apiKey = await db.apiKey.findUnique({
    where: { id: keyId },
  });

  if (!apiKey) {
    return false;
  }

  // Check ownership
  if (apiKey.userId !== userId) {
    return false;
  }

  await db.apiKey.delete({
    where: { id: keyId },
  });

  return true;
}

export function hasScope(scopes: string[], requiredScope: string): boolean {
  if (scopes.includes("*")) return true;
  if (scopes.includes(requiredScope)) return true;
  
  // Check wildcard patterns like "assets:*"
  const [resource] = requiredScope.split(":");
  if (scopes.includes(`${resource}:*`)) return true;
  
  return false;
}

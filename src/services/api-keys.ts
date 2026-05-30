import { desc, eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "../db/index.ts";
import { apiKeys } from "../db/schema.ts";

const KEY_PREFIX = "sk_tas_";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CreateApiKeyInput {
  name: string;
  description?: string;
  group?: string;
  scopes: string[];
  expiresAt: Date | null;
}

export interface ApiKeyListItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  group: string | null;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  revokedReason: string | null;
}

export interface ApiKeyPick {
  id: string;
  name: string;
  keyPrefix: string;
}

export interface CreatedApiKey {
  fullKey: string;
  id: string;
  name: string;
  prefix: string;
  description: string | null;
  group: string | null;
  scopes: string[];
  expiresAt: Date | null;
}

// ── Key generation ───────────────────────────────────────────────────────────

export function generateApiKey(): {
  fullKey: string;
  prefix: string;
  hash: string;
} {
  const randomBytes = crypto.randomBytes(32);
  const key = KEY_PREFIX + randomBytes.toString("base64url");
  const prefix = key.slice(0, 12);
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return { fullKey: key, prefix, hash };
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function createApiKey(
  input: CreateApiKeyInput,
): Promise<CreatedApiKey> {
  const { fullKey, prefix, hash } = generateApiKey();

  const [{ id }] = await db
    .insert(apiKeys)
    .values({
      name: input.name,
      description: input.description ?? null,
      keyPrefix: prefix,
      keyHash: hash,
      group: input.group ?? null,
      scopes: input.scopes,
      expiresAt: input.expiresAt,
    })
    .returning({ id: apiKeys.id });

  return {
    fullKey,
    id,
    name: input.name,
    prefix,
    description: input.description ?? null,
    group: input.group ?? null,
    scopes: input.scopes,
    expiresAt: input.expiresAt,
  };
}

export async function listApiKeys(): Promise<ApiKeyListItem[]> {
  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      isActive: apiKeys.isActive,
      group: apiKeys.group,
      createdAt: apiKeys.createdAt,
      expiresAt: apiKeys.expiresAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
      revokedReason: apiKeys.revokedReason,
    })
    .from(apiKeys)
    .orderBy(desc(apiKeys.createdAt));

  return keys;
}

export async function listActiveApiKeys(): Promise<ApiKeyPick[]> {
  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
    })
    .from(apiKeys)
    .where(eq(apiKeys.isActive, true))
    .orderBy(desc(apiKeys.createdAt));

  return keys;
}

export async function revokeApiKey(id: string, reason?: string): Promise<void> {
  await db
    .update(apiKeys)
    .set({
      isActive: false,
      revokedAt: new Date(),
      revokedReason: reason ?? null,
    })
    .where(eq(apiKeys.id, id));
}

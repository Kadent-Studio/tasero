import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(), // UUID v7

  // Identification
  name: text("name").notNull(), // Human-readable label
  description: text("description"), // Optional description
  keyPrefix: text("key_prefix").notNull(), // First 12 chars for display (e.g. "sk_tas_a1B2c...")
  keyHash: text("key_hash").notNull().unique(), // hash of the full key

  // Grouping
  group: text("group"), // Optional grouping (e.g. "team-1234" or "project-5678")

  // Permissions — JSON array of scope strings (e.g. ["read:items","write:items"])
  scopes: text("scopes").notNull().default("[]"),

  // Lifecycle
  isActive: int("is_active").notNull().default(1), // 0 = revoked, 1 = active
  expiresAt: int("expires_at"), // Unix epoch seconds, null = never expires
  lastUsedAt: int("last_used_at"), // Unix epoch seconds
  revokedAt: int("revoked_at"), // Unix epoch seconds, set when isActive flips to 0
  revokedReason: text("revoked_reason"), // Why the key was revoked

  // Timestamps (Unix epoch seconds)
  createdAt: int("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: int("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

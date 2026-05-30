import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";

export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey(), // UUID v7

  // Identification
  name: text("name").notNull(), // Human-readable label
  description: text("description"), // Optional description
  keyPrefix: text("key_prefix").notNull(), // First 12 chars for display (e.g. "sk_tas_a1B2c...")
  keyHash: text("key_hash").notNull().unique(), // hash of the full key

  // Grouping
  group: text("group"), // Optional grouping (e.g. "team-1234" or "project-5678")

  // Permissions — JSON array of scope strings (e.g. ["read:items","write:items"])
  scopes: jsonb("scopes").notNull().default([]),

  // Lifecycle
  isActive: boolean("is_active").notNull().default(true), // 0 = revoked, 1 = active
  expiresAt: integer("expires_at"), // Unix epoch seconds, null = never expires
  lastUsedAt: integer("last_used_at"), // Unix epoch seconds
  revokedAt: integer("revoked_at"), // Unix epoch seconds, set when isActive flips to 0
  revokedReason: text("revoked_reason"), // Why the key was revoked

  // Timestamps (Unix epoch seconds)
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(extract(epoch from now())::integer)`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(extract(epoch from now())::integer)`),
});

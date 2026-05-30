import { sql } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

export const apiKeys = pgTable("api_keys", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()), // UUID v7

  // Identification
  name: text("name").notNull(), // Human-readable label
  description: text("description"), // Optional description
  keyPrefix: text("key_prefix").notNull(), // First 12 chars for display (e.g. "sk_tas_a1B2c...")
  keyHash: text("key_hash").notNull().unique(), // hash of the full key

  // Grouping
  group: text("group"), // Optional grouping (e.g. "team-1234" or "project-5678")

  // Permissions — JSON array of scope strings (e.g. ["read:items","write:items"])
  scopes: jsonb("scopes").$type<string[]>().notNull().default([]),

  // Lifecycle
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }), // null = never expires
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }), // set when isActive flips to false
  revokedReason: text("revoked_reason"), // Why the key was revoked

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

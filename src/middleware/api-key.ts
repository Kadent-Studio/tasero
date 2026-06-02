import { waitUntil } from "@vercel/functions";
import { eq } from "drizzle-orm";
import { bearerAuth } from "hono/bearer-auth";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Db } from "../db/index.js";
import { apiKeys } from "../db/schema.js";
import { findApiKeyByToken, type ApiKeyInfo } from "../services/api-keys.js";

// ── Middleware factory ────────────────────────────────────────────────────────

/**
 * Creates a Hono middleware that validates an API key sent via the `x-api-key`
 * header (instead of `Authorization: Bearer`).
 *
 * Using a dedicated header allows CDNs to cache responses without conflicting with the standard `Authorization` header, which
 * many CDNs treat as a cache-buster.
 *
 * Usage:
 * ```
 * x-api-key: sk_tas_<full-key>
 * ```
 */
export function apiKeyMiddleware() {
  return bearerAuth<{
    Variables: { apiKey: ApiKeyInfo; db: Db };
  }>({
    headerName: "x-api-key",
    prefix: "",
    async verifyToken(token, c) {
      const record = await findApiKeyByToken(c.var.db, token);
      if (!record) return false;

      // Update last_used_at in the background (fire-and-forget)
      waitUntil(
        c.var.db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, record.id)),
      );

      c.set("apiKey", record);

      return true;
    },
  });
}

/**
 * Creates a Hono middleware that requires a valid API key with the specified
 * scope (or the wildcard `*` scope).
 *
 * The API key must be sent via the `x-api-key` header:
 * ```
 * x-api-key: sk_tas_<full-key>
 * ```
 *
 * Automatically updates `last_used_at` on the key upon successful validation.
 */
export function requireScope(requiredScope: string) {
  return createMiddleware<{
    Variables: { apiKey: ApiKeyInfo };
  }>(async (c, next) => {
    const record = c.var.apiKey;
    if (!record) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Scope check — wildcard `*` grants access to everything
    const hasScope = record.scopes.includes("*") || record.scopes.includes(requiredScope);
    if (!hasScope) {
      const status = 403;
      throw new HTTPException(status, {
        res: Response.json(
          { error: "Forbidden - insufficient scope" },
          {
            status,
            headers: {
              "Content-Type": "application/json",
              "WWW-Authenticate": `Bearer error="insufficient_scope", scope="${requiredScope}"`,
            },
          },
        ),
      });
    }

    return next();
  });
}

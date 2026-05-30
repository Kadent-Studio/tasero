import { waitUntil } from "@vercel/functions";
import { eq } from "drizzle-orm";
import { bearerAuth } from "hono/bearer-auth";
import { createMiddleware } from "hono/factory";
import { db } from "../db/index.ts";
import { apiKeys } from "../db/schema.ts";
import { findApiKeyByToken, type ApiKeyInfo } from "../services/api-keys.ts";
import { HTTPException } from "hono/http-exception";

// ── Types ────────────────────────────────────────────────────────────────────

// ── Middleware factory ────────────────────────────────────────────────────────

export function apiKeyMiddleware() {
  return bearerAuth<{
    Variables: { apiKey: ApiKeyInfo };
  }>({
    async verifyToken(token, c) {
      const record = await findApiKeyByToken(token);
      if (!record) return false;

      // Update last_used_at in the background (fire-and-forget)
      waitUntil(
        db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, record.id)),
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
 * The API key must be sent as a Bearer token in the `Authorization` header:
 * ```
 * Authorization: Bearer sk_tas_<full-key>
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

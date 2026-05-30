import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { apiKeyMiddleware, requireScope } from "../middleware/api-key.js";
import { createApiKey, listApiKeys, revokeApiKey } from "../services/api-keys.js";

const apiKeyCreateSchema = z.object({
  name: z.string().trim().nonempty("`name` is required"),
  description: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  group: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  scopes: z.array(z.string().min(1)).nonempty("`scopes` must be a non-empty array of strings"),
  expiresAt: z.preprocess((value) => {
    if (value == null || value === "") return null;
    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date;
    }
    return value;
  }, z.date().nullable()),
});

const apiKeyRevokeSchema = z.object({
  reason: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => value || null),
});

export const admin = new Hono().use(apiKeyMiddleware());

admin.get("/api-keys", requireScope("read:admin"), async (c) => {
  const keys = await listApiKeys();
  return c.json(keys);
});

admin.post(
  "/api-keys",
  requireScope("write:admin"),
  zValidator("json", apiKeyCreateSchema),
  async (c) => {
    const body = c.req.valid("json");
    const createdKey = await createApiKey(body);
    return c.json(createdKey, 201);
  },
);

admin.post(
  "/api-keys/:id/revoke",
  requireScope("write:admin"),
  zValidator("json", apiKeyRevokeSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");

    if (!id) {
      return c.json({ error: "`id` is required" }, 400);
    }

    await revokeApiKey(id, body.reason ?? undefined);
    return c.json({ id, revoked: true });
  },
);

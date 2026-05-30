import { Hono } from "hono";
import { getOrInsertCache } from "../lib/cache.js";
import { apiKeyMiddleware, requireScope } from "../middleware/api-key.js";
import { getBcvRates } from "../services/rates.js";

export const rates = new Hono().use(apiKeyMiddleware());

// ── Cache key ────────────────────────────────────────────────────────────────

const CACHE_KEY = "bcv-rates";
const CACHE_TTL_SECONDS = 10_800; // 3 horas
const CACHE_TAG = "rates";

rates.get("/bcv", requireScope("read:rates"), async (c) => {
  try {
    const result = await getOrInsertCache(CACHE_KEY, async () => await getBcvRates(), {
      ttl: CACHE_TTL_SECONDS,
      tags: [CACHE_TAG],
    });
    return c.json(result);
  } catch (error) {
    console.error("Error scraping BCV:", error);
    return c.json({ error: "Error al obtener la tasa de cambio del BCV" }, 500);
  }
});

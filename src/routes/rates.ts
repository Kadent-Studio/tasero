import { Hono } from "hono";
import { getOrInsertCache } from "../lib/cache.js";
import { apiKeyMiddleware, requireScope } from "../middleware/api-key.js";
import { getBcvRates } from "../services/rates/bcv.js";
import { getBinanceP2PRates } from "../services/rates/binance-p2p.js";

export const rates = new Hono().use(apiKeyMiddleware());

// ── Cache config ─────────────────────────────────────────────────────────────

const CACHE_BCV_KEY = "bcv-rates";
const CACHE_BCV_TTL = 10_800; // 3 horas
const CACHE_BINANCE_KEY = "binance-p2p-rates";
const CACHE_BINANCE_TTL = 30; // 30 segundos — frecuencia de actualización P2P
const CACHE_TAG = "rates";

// ── BCV ──────────────────────────────────────────────────────────────────────

rates.get("/bcv", requireScope("read:rates"), async (c) => {
  try {
    const result = await getOrInsertCache(CACHE_BCV_KEY, async () => await getBcvRates(), {
      ttl: CACHE_BCV_TTL,
      tags: [CACHE_TAG],
    });
    return c.json(result);
  } catch (error) {
    console.error("Error scraping BCV:", error);
    return c.json({ error: "Error al obtener la tasa de cambio del BCV" }, 500);
  }
});

// ── Binance P2P ──────────────────────────────────────────────────────────────

rates.get("/binance-p2p", requireScope("read:rates"), async (c) => {
  try {
    const result = await getOrInsertCache(
      CACHE_BINANCE_KEY,
      async () => await getBinanceP2PRates(),
      {
        ttl: CACHE_BINANCE_TTL,
        tags: [CACHE_TAG],
      },
    );
    return c.json(result);
  } catch (error) {
    console.error("Error fetching Binance P2P rates:", error);
    return c.json({ error: "Error al obtener la tasa de cambio de Binance P2P" }, 500);
  }
});

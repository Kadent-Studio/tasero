import { Hono } from "hono";
import { apiKeyMiddleware, requireScope } from "../middleware/api-key.js";
import { getBcvRates } from "../services/rates/bcv.js";
import { getBinanceP2PRates } from "../services/rates/binance-p2p.js";
import { getOrInsertCache } from "../lib/cache.js";

export const rates = new Hono().use(apiKeyMiddleware());

const CACHE_BCV_TTL = 10_800; // 3 horas
const CACHE_BCV_SWR = 3_600; // 1 hora de stale-while-revalidate
const CACHE_BINANCE_TTL = 20; // 30 segundos — frecuencia de actualización P2P
const CACHE_BINANCE_SWR = 10; // 5 minutos de stale-while-revalidate
const CACHE_BINANCE_KEY = "binance-p2p-rates";
const CACHE_TAGS = ["rates"];

/**
 * Vercel CDN cache headers builder.
 *
 * - `s-maxage` controls how long Vercel's edge cache stores the response.
 * - `stale-while-revalidate` allows serving stale content while revalidating.
 */
function cacheHeaders(ttl: number, swr: number = ttl) {
  return {
    "Cache-Control": `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=${swr}`,
  } as const;
}

rates.get("/bcv", requireScope("read:rates"), async (c) => {
  try {
    const result = await getBcvRates(c.req.raw.signal);
    return c.json(result, 200, cacheHeaders(CACHE_BCV_TTL, CACHE_BCV_SWR));
  } catch (error) {
    console.error("Error scraping BCV:", error);
    return c.json({ error: "Error al obtener la tasa de cambio del BCV" }, 500);
  }
});

rates.get("/binance-p2p", requireScope("read:rates"), async (c) => {
  try {
    const result = await getOrInsertCache(
      CACHE_BINANCE_KEY,
      async () =>
        await getBinanceP2PRates({
          signal: c.req.raw.signal,
          asset: "USDT",
          fiat: "VES",
        }),
      {
        ttl: CACHE_BINANCE_TTL,
        tags: CACHE_TAGS,
      },
    );
    return c.json(result, 200, cacheHeaders(CACHE_BINANCE_TTL, CACHE_BINANCE_SWR));
  } catch (error) {
    console.error("Error fetching Binance P2P rates:", error);
    return c.json({ error: "Error al obtener la tasa de cambio de Binance P2P" }, 500);
  }
});

import * as cheerio from "cheerio";
import { get } from "node:https";
import { text } from "node:stream/consumers";
import { getOrInsertCache } from "../lib/cache.ts";

// ── Types ────────────────────────────────────────────────────────────────────

export interface BcvRate {
  currency: string;
  rate: number;
}

export interface BcvResult {
  date: string;
  rates: BcvRate[];
}

// ── Cache key ────────────────────────────────────────────────────────────────

const CACHE_KEY = "bcv-rates";
const CACHE_TTL_SECONDS = 10_800; // 3 horas

// ── Scraping ─────────────────────────────────────────────────────────────────

function fetchBcvHtml(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const req = get(
      "https://www.bcv.org.ve",
      {
        rejectUnauthorized: false,
      },
      (res) => {
        text(res).then(resolve, reject);
      },
    );

    req.on("error", reject);
    req.end();
  });
}

function findRateInHtml($: cheerio.CheerioAPI, selector: string, currency: string) {
  const raw = $(selector).text().trim();

  if (!raw) {
    throw new Error(`No se pudo encontrar la tasa de cambio para ${currency}`);
  }

  // Remove extra whitespace and normalize decimal separator
  const cleaned = raw.replace(/[^\d,.]/g, "").replace(",", ".");
  return { currency, rate: Number.parseFloat(cleaned) };
}

function parseBcvRates(html: string): BcvRate[] {
  const $ = cheerio.load(html);
  const dolarRate = findRateInHtml($, "#dolar", "USD");
  const euroRate = findRateInHtml($, "#euro", "EUR");

  return [dolarRate, euroRate];
}

// ── Business logic ───────────────────────────────────────────────────────────

export async function getBcvRates(): Promise<BcvResult> {
  return await getOrInsertCache(
    CACHE_KEY,
    async () => {
      const html = await fetchBcvHtml();
      const rates = parseBcvRates(html);

      return {
        date: new Date().toISOString(),
        rates,
      };
    },
    { ttl: CACHE_TTL_SECONDS, tags: ["rates"] },
  );
}

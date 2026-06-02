import * as cheerio from "cheerio";
import { Agent, fetch } from "undici";

// ── Types ────────────────────────────────────────────────────────────────────

export interface BcvRate {
  currency: string;
  rate: number;
}

export interface BcvResult {
  ratesDate: string;
  consultedAt: string;
  rates: BcvRate[];
}

// ── Scraping ─────────────────────────────────────────────────────────────────

const unsafeBcvAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

async function fetchBcvHtml(signal: AbortSignal): Promise<string> {
  const response = await fetch("https://www.bcv.org.ve", {
    dispatcher: unsafeBcvAgent,
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]), // 5 segundos timeout
  });

  if (!response.ok) {
    throw new Error(`Error fetching BCV page: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

function findRateInHtml($: cheerio.CheerioAPI, selector: string, currency: string) {
  const raw = $(selector).text().trim();

  if (!raw) {
    throw new Error(`No se pudo encontrar la tasa de cambio para ${currency}`);
  }

  // Remove extra whitespace and normalize decimal separator
  const cleaned = raw.replace(",", ".");
  return { currency, rate: Number.parseFloat(cleaned) };
}

function parseBcvRates($: cheerio.CheerioAPI): BcvRate[] {
  const dolarRate = findRateInHtml($, "#dolar strong", "USD");
  const euroRate = findRateInHtml($, "#euro strong", "EUR");
  const yuanRate = findRateInHtml($, "#yuan strong", "CNY");
  const liraRate = findRateInHtml($, "#lira strong", "TRY");
  const rubloRate = findRateInHtml($, "#rublo strong", "RUB");

  return [dolarRate, euroRate, yuanRate, liraRate, rubloRate];
}

// ── Business logic ───────────────────────────────────────────────────────────

export async function getBcvRates(signal: AbortSignal): Promise<BcvResult> {
  const html = await fetchBcvHtml(signal);
  const $ = cheerio.load(html);
  const rates = parseBcvRates($);

  const consultedAt = new Date().toISOString();
  const dateText = $("#dolar")
    .parent()
    .find('[datatype="xsd:dateTime"]')
    .attr("content")
    ?.split("T")[0]!;

  return {
    rates,
    ratesDate: dateText,
    consultedAt: consultedAt,
  };
}

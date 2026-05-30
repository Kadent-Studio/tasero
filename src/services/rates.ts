import * as cheerio from "cheerio";
import { get } from "node:https";
import { text } from "node:stream/consumers";

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

export async function getBcvRates(): Promise<BcvResult> {
  const html = await fetchBcvHtml();
  const $ = cheerio.load(html);
  const rates = parseBcvRates($);

  const consultedAt = new Date().toISOString();
  const dateText =
    $("#dolar").parent().find('[datatype="xsd:dateTime"]').attr("content") || consultedAt;

  return {
    rates,
    ratesDate: dateText,
    consultedAt: consultedAt,
  };
}

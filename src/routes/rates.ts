import * as cheerio from "cheerio";
import { Hono } from "hono";
import { get } from "node:https";
import { text } from "node:stream/consumers";

export const rates = new Hono();

function getBcvHtml() {
  return new Promise<string>((resolve, reject) => {
    const req = get(
      "https://www.bcv.org.ve",
      {
        method: "GET",
        rejectUnauthorized: false, // Disable SSL certificate validation for this request
      },
      (res) => {
        text(res).then(resolve, reject);
      },
    );

    req.on("error", reject);

    req.end();
  });
}

rates.get("/bcv", async (c) => {
  try {
    const html = await getBcvHtml();
    const $ = cheerio.load(html);
    const dolarRate = $("#dolar").text().trim();

    if (!dolarRate) {
      return c.json({ error: "No se pudo encontrar la tasa de cambio" }, 404);
    }

    // Clean up: remove extra whitespace and normalize decimal separator
    const cleaned = dolarRate.replace(/[^\d,.]/g, "").replace(",", ".");

    return c.json({
      date: new Date().toISOString(),
      rates: [
        {
          currency: "USD",
          rate: Number.parseFloat(cleaned),
        },
      ],
    });
  } catch (error) {
    console.error("Error scraping BCV:", error);
    return c.json({ error: "Error al obtener la tasa de cambio del BCV" }, 500);
  }
});

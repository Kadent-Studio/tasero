import * as cheerio from "cheerio";
import { Hono } from "hono";
import { Agent } from "undici";

export const rates = new Hono();
const agent = new Agent({
  // Disable SSL certificate validation for all requests made with this agent
  connect: { rejectUnauthorized: false },
});

rates.get("/bcv", async (c) => {
  try {
    const res = await fetch("https://www.bcv.org.ve", {
      dispatcher: agent as any,
    });
    if (!res.ok) {
      return c.json(
        { error: "Error al obtener la tasa de cambio del BCV" },
        502,
      );
    }

    const html = await res.text();
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

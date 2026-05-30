import { Hono } from "hono";
import { apiKeyMiddleware, requireScope } from "../middleware/api-key.js";
import { getBcvRates } from "../services/rates.js";

export const rates = new Hono().use(apiKeyMiddleware());

rates.get("/bcv", requireScope("read:rates"), async (c) => {
  try {
    const result = await getBcvRates();
    return c.json(result);
  } catch (error) {
    console.error("Error scraping BCV:", error);
    return c.json({ error: "Error al obtener la tasa de cambio del BCV" }, 500);
  }
});

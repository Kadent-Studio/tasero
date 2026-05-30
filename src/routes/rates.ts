import { Hono } from "hono";
import { getBcvRates } from "../services/rates.ts";

export const rates = new Hono();

rates.get("/bcv", async (c) => {
  try {
    const result = await getBcvRates();
    return c.json(result);
  } catch (error) {
    console.error("Error scraping BCV:", error);
    return c.json({ error: "Error al obtener la tasa de cambio del BCV" }, 500);
  }
});

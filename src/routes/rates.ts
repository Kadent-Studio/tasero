import { Hono } from "hono";

export const rates = new Hono<{ Bindings: CloudflareBindings }>();

rates.get("/bcv", async (c) => {
  try {
    const res = await fetch("https://www.bcv.org.ve");

    if (!res.ok) {
      return c.json(
        { error: "Error al obtener la tasa de cambio del BCV" },
        502,
      );
    }

    // Extract the value inside the element with id="dolar" using HTMLRewriter
    let dolarRate = "";

    await new HTMLRewriter()
      .on("div#dolar", {
        text(text) {
          dolarRate += text.text;
        },
      })
      // Transform the response stream to trigger the rewriter
      .transform(res)
      .arrayBuffer();

    dolarRate = dolarRate.trim();

    if (!dolarRate) {
      return c.json({ error: "No se pudo encontrar la tasa de cambio" }, 404);
    }

    // Clean up: remove extra whitespace and normalize decimal separator
    const cleaned = dolarRate.replace(/\s+/g, "").replace(",", ".");

    return c.json({
      tasa: cleaned,
      fecha: new Date().toISOString(),
      fuente: "Banco Central de Venezuela",
    });
  } catch (error) {
    console.error("Error scraping BCV:", error);
    return c.json({ error: "Error al obtener la tasa de cambio del BCV" }, 500);
  }
});

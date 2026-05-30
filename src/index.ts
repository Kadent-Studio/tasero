import { registerOTel } from "@vercel/otel";
import { Hono } from "hono";
import { dbMiddleware } from "./db/index.js";
import { otelMiddleware } from "./middleware/otel.js";
import { admin } from "./routes/admin.js";
import { rates } from "./routes/rates.js";

if (process.env.VERCEL_ENV === "production") {
  registerOTel({ serviceName: "tasero-api" });
}

const app = new Hono()
  .basePath("/api")
  .use(otelMiddleware, dbMiddleware)
  .route("/admin", admin)
  .route("/rates", rates);

export default app;

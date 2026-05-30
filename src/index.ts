import { httpInstrumentationMiddleware } from "@hono/otel";
import { Hono } from "hono";
import { dbMiddleware } from "./db/index.js";
import { admin } from "./routes/admin.js";
import { rates } from "./routes/rates.js";

const app = new Hono()
  .basePath("/api")
  .use(httpInstrumentationMiddleware({ serviceName: "tasero-api" }), dbMiddleware)
  .route("/admin", admin)
  .route("/rates", rates);

export default app;

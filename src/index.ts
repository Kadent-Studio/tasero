import { Hono } from "hono";
import { dbMiddleware } from "./db/index.ts";
import { admin } from "./routes/admin.ts";
import { rates } from "./routes/rates.ts";

const app = new Hono()
  .basePath("/api")
  .use(dbMiddleware)
  .route("/admin", admin)
  .route("/rates", rates);

export default app;

import { Hono } from "hono";
import { dbMiddleware } from "./db";
import { admin } from "./routes/admin";
import { rates } from "./routes/rates";

const app = new Hono<{ Bindings: CloudflareBindings }>()
  .basePath("/api")
  .use(dbMiddleware)
  .route("/admin", admin)
  .route("/rates", rates);

export default app;

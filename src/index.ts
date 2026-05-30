import { Hono } from "hono";
import { dbMiddleware } from "./db/index";
import { admin } from "./routes/admin";
import { rates } from "./routes/rates";

const app = new Hono()
  .basePath("/api")
  .use(dbMiddleware)
  .route("/admin", admin)
  .route("/rates", rates);

export default app;

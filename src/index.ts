import { Hono } from "hono";
import { dbMiddleware } from "./db";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(dbMiddleware);

app.get("/", (c) => {
  return c.text("Hello, Hono!");
});

export default app;

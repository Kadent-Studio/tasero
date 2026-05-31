import { instrumentDrizzleClient } from "@kubiks/otel-drizzle";
import { drizzle } from "drizzle-orm/neon-http";
import { createMiddleware } from "hono/factory";
import relations from "./relations.js";

export function createDb() {
  const db = drizzle(process.env.DATABASE_URL!, { relations });
  instrumentDrizzleClient(db, { dbName: "tasero-db", tracerName: "tasero-db-drizzle" });
  return db;
}

export type Db = ReturnType<typeof createDb>;

export const dbMiddleware = createMiddleware<{
  Variables: { db: Db };
}>((c, next) => {
  const db = createDb();
  c.set("db", db);
  return next();
});

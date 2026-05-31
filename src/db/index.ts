import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { createMiddleware } from "hono/factory";
import { Pool } from "pg";
import relations from "./relations.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
attachDatabasePool(pool);

export function createDb() {
  const db = drizzle({ client: pool, relations });
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

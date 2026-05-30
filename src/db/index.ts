import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { createMiddleware } from "hono/factory";
import relations from "./relations.ts";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, relations });

export type Db = typeof db;

export const dbMiddleware = createMiddleware<{
  Variables: { db: Db };
}>((c, next) => {
  c.set("db", db);
  return next();
});

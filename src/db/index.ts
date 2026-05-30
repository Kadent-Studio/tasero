import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema.ts";
import relations from "./relations.ts";
import { createMiddleware } from "hono/factory";

export function getDb(bindings: CloudflareBindings) {
  return drizzle(bindings.DB, { schema, relations });
}

export type DrizzleDb = ReturnType<typeof getDb>;

export const dbMiddleware = createMiddleware<{
  Bindings: CloudflareBindings;
  Variables: { db: DrizzleDb };
}>((c, next) => {
  const db = getDb(c.env);
  c.set("db", db);
  return next();
});

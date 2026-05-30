import { Hono } from "hono";
import { requireScope } from "../middleware/api-key.ts";

export const admin = new Hono();

// Apply scope-check to all admin routes
admin.use("*", requireScope("read:admin"));

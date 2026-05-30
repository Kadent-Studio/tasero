import { Hono } from "hono";
import { requireScope } from "../middleware/api-key.js";

export const admin = new Hono();

// Apply scope-check to all admin routes
admin.use("*", requireScope("read:admin"));

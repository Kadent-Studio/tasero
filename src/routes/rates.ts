import { Hono } from "hono";

export const rates = new Hono<{ Bindings: CloudflareBindings }>();

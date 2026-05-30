import { context, propagation } from "@opentelemetry/api";
import { createMiddleware } from "hono/factory";

export const otelMiddleware = createMiddleware((c, next) => {
  const inboundContext = propagation.extract(context.active(), c.req.header());
  return context.with(inboundContext, async () => await next());
});

import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { registerOTel } from "@vercel/otel";

registerOTel({ serviceName: "tasero-api", instrumentations: [new PgInstrumentation()] });

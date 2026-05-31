import { registerOTel } from "@vercel/otel";

registerOTel({ serviceName: "tasero-api" });

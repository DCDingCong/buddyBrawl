import cors from "@fastify/cors";
import Fastify from "fastify";
import { validateConfigs } from "@buddy-brawl/configs";
import { registerHealthRoutes } from "./routes/health.js";

export async function buildApp() {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: true
  });

  const configValidation = validateConfigs();
  if (!configValidation.ok) {
    throw new Error(`Config validation failed: ${configValidation.errors.join("; ")}`);
  }

  await registerHealthRoutes(app);

  return app;
}

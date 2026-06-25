import type { FastifyInstance } from "fastify";
import type { HealthResponse } from "@buddy-brawl/shared";

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (): Promise<HealthResponse> => {
    return {
      status: "ok",
      service: "buddy-brawl-api"
    };
  });
}

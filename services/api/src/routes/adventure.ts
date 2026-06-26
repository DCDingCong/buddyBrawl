import type { FastifyInstance } from "fastify";
import type { AdventureService } from "../modules/adventure/adventure-service.js";
import { getBearerToken, unauthorized } from "../modules/player/player-service.js";

export async function registerAdventureRoutes(
  app: FastifyInstance,
  adventureService: AdventureService
): Promise<void> {
  app.get("/adventure/status", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await adventureService.getStatus(playerId);
    if (!result.ok) {
      reply.code(404);
    }

    return result;
  });

  app.post("/adventure/claim", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await adventureService.claim(playerId);
    if (!result.ok) {
      reply.code(404);
    }

    return result;
  });

  app.post("/adventure/challenge", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await adventureService.challenge(playerId);
    if (!result.ok) {
      reply.code(404);
    }

    return result;
  });
}

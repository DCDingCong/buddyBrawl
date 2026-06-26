import type { FastifyInstance } from "fastify";
import type { ArenaChallengeRequest } from "@buddy-brawl/shared";
import type { ArenaService } from "../modules/arena/arena-service.js";
import { getBearerToken, unauthorized } from "../modules/player/player-service.js";

export async function registerArenaRoutes(app: FastifyInstance, arenaService: ArenaService): Promise<void> {
  app.get("/arena/opponents", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    return arenaService.getOpponents(playerId);
  });

  app.post<{ Body: ArenaChallengeRequest }>("/arena/challenge", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await arenaService.challenge(playerId, request.body?.defenderPlayerId);
    if (!result.ok) {
      reply.code(result.error.code === "INVALID_OPPONENT" ? 400 : 404);
    }

    return result;
  });

  app.get("/arena/recent-battles", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    return arenaService.getRecentBattles(playerId);
  });
}

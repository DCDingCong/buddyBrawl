import type { FastifyInstance } from "fastify";
import type { RankingRevengeRequest } from "@buddy-brawl/shared";
import type { ArenaService } from "../modules/arena/arena-service.js";
import type { LeaderboardService } from "../modules/leaderboard/leaderboard-service.js";
import { getBearerToken, unauthorized } from "../modules/player/player-service.js";

export async function registerRankingRoutes(
  app: FastifyInstance,
  leaderboardService: LeaderboardService,
  arenaService: ArenaService
): Promise<void> {
  app.get("/rankings/level", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    return leaderboardService.listLevelRankings(playerId);
  });

  app.post<{ Body: RankingRevengeRequest }>("/rankings/revenge", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await arenaService.challenge(playerId, request.body?.targetPlayerId);
    if (!result.ok) {
      reply.code(result.error.code === "INVALID_OPPONENT" ? 400 : 404);
    }

    return result;
  });
}

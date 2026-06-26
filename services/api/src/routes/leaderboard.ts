import type { FastifyInstance } from "fastify";
import type { LeaderboardService } from "../modules/leaderboard/leaderboard-service.js";
import { getBearerToken, unauthorized } from "../modules/player/player-service.js";

export async function registerLeaderboardRoutes(
  app: FastifyInstance,
  leaderboardService: LeaderboardService
): Promise<void> {
  app.get("/leaderboard", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    return leaderboardService.listLeaderboard();
  });

  app.get("/leaderboard/me", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    return leaderboardService.getMyRank(playerId);
  });
}

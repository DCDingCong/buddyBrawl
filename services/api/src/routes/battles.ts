import type { FastifyInstance } from "fastify";
import type { ArenaService } from "../modules/arena/arena-service.js";
import { getBearerToken, unauthorized } from "../modules/player/player-service.js";

export async function registerBattleRoutes(app: FastifyInstance, arenaService: ArenaService): Promise<void> {
  app.get<{ Params: { battleId: string } }>("/battles/:battleId", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await arenaService.getBattle(playerId, request.params.battleId);
    if (!result.ok) {
      reply.code(404);
    }

    return result;
  });
}

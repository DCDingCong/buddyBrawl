import type { FastifyInstance } from "fastify";
import type { PatrolService } from "../modules/patrol/patrol-service.js";
import { getBearerToken, unauthorized } from "../modules/player/player-service.js";

export async function registerPatrolRoutes(app: FastifyInstance, patrolService: PatrolService): Promise<void> {
  app.post("/patrol/settle", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await patrolService.settle(playerId);
    if (!result.ok) {
      reply.code(404);
    }

    return result;
  });
}

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { PlayerService } from "../modules/player/player-service.js";
import { getBearerToken, unauthorized } from "../modules/player/player-service.js";

export async function registerPlayerRoutes(
  app: FastifyInstance,
  playerService: PlayerService
): Promise<void> {
  app.get("/me", async (request, reply) => {
    const playerId = requirePlayerId(request, reply);
    if (!playerId) {
      return;
    }

    const result = await playerService.getCurrentPlayer(playerId);
    if (!result.ok) {
      reply.code(404);
    }
    return result;
  });

  app.get("/pet/current", async (request, reply) => {
    const playerId = requirePlayerId(request, reply);
    if (!playerId) {
      return;
    }

    const result = await playerService.getCurrentPet(playerId);
    if (!result.ok) {
      reply.code(404);
    }
    return result;
  });
}

function requirePlayerId(request: FastifyRequest, reply: FastifyReply): string | null {
  const token = getBearerToken(request.headers.authorization);
  if (!token) {
    reply.code(401);
    void reply.send(unauthorized());
    return null;
  }

  return token;
}

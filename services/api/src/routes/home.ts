import type { FastifyInstance } from "fastify";
import type { HomeService } from "../modules/home/home-service.js";
import { getBearerToken, unauthorized } from "../modules/player/player-service.js";

export async function registerHomeRoutes(app: FastifyInstance, homeService: HomeService): Promise<void> {
  app.get("/home", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await homeService.getHome(playerId);
    if (!result.ok) {
      reply.code(404);
    }

    return result;
  });
}

import type { FastifyInstance } from "fastify";
import type { DevLoginRequest, DevLoginResponse, ApiResponse } from "@buddy-brawl/shared";
import type { PlayerService } from "../modules/player/player-service.js";

export async function registerAuthRoutes(
  app: FastifyInstance,
  playerService: PlayerService
): Promise<void> {
  app.post<{ Body: DevLoginRequest }>("/auth/dev-login", async (request): Promise<ApiResponse<DevLoginResponse>> => {
    return playerService.devLogin(request.body ?? {});
  });
}

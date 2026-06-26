import type { FastifyInstance } from "fastify";
import type {
  ApiErrorResponse,
  ApiResponse,
  DevLoginRequest,
  DevLoginResponse,
  WechatPhoneLoginRequest,
  WechatPhoneLoginResponse
} from "@buddy-brawl/shared";
import type { PlayerService } from "../modules/player/player-service.js";

export async function registerAuthRoutes(
  app: FastifyInstance,
  playerService: PlayerService
): Promise<void> {
  app.post<{ Body: DevLoginRequest }>("/auth/dev-login", async (request): Promise<ApiResponse<DevLoginResponse>> => {
    return playerService.devLogin(request.body ?? {});
  });

  app.post<{ Body: WechatPhoneLoginRequest }>(
    "/auth/wechat-phone",
    async (request, reply): Promise<ApiResponse<WechatPhoneLoginResponse> | ApiErrorResponse> => {
      const result = await playerService.wechatPhoneLogin(request.body ?? {});
      if (!result.ok) {
        reply.code(400);
      }

      return result;
    }
  );
}

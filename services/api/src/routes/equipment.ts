import type { FastifyInstance } from "fastify";
import type { EquipmentActionRequest } from "@buddy-brawl/shared";
import type { EquipmentService } from "../modules/equipment/equipment-service.js";
import { getBearerToken, unauthorized } from "../modules/player/player-service.js";

export async function registerEquipmentRoutes(
  app: FastifyInstance,
  equipmentService: EquipmentService
): Promise<void> {
  app.get("/inventory/equipment", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await equipmentService.getInventory(playerId);
    if (!result.ok) {
      reply.code(404);
    }

    return result;
  });

  app.post<{ Body: EquipmentActionRequest }>("/equipment/equip", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await equipmentService.equip(playerId, request.body?.equipmentId);
    if (!result.ok) {
      reply.code(result.error.code === "INVALID_EQUIPMENT" ? 400 : 404);
    }

    return result;
  });

  app.post<{ Body: EquipmentActionRequest }>("/equipment/enhance", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await equipmentService.enhance(playerId, request.body?.equipmentId);
    if (!result.ok) {
      reply.code(
        ["INVALID_EQUIPMENT", "INSUFFICIENT_RESOURCES", "ENHANCE_LEVEL_LIMIT"].includes(result.error.code)
          ? 400
          : 404
      );
    }

    return result;
  });
}

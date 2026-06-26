import { equipmentConfigs } from "@buddy-brawl/configs";
import type {
  ApiErrorResponse,
  ApiResponse,
  EquipmentInventoryResponse,
  InventoryEquipmentItemView,
  StatBlock
} from "@buddy-brawl/shared";
import type { EquipmentRecord, EquipmentRepository, EquipmentStateRecord } from "./equipment-repository.js";
import { notFound } from "../player/player-service.js";

export class EquipmentService {
  constructor(private readonly equipmentRepository: EquipmentRepository) {}

  async getInventory(playerId: string): Promise<ApiResponse<EquipmentInventoryResponse> | ApiErrorResponse> {
    const state = await this.equipmentRepository.findEquipmentStateByPlayerId(playerId);
    if (!state) {
      return notFound("Equipment state was not found.");
    }

    return {
      ok: true,
      data: toInventoryResponse(state)
    };
  }

  async equip(
    playerId: string,
    equipmentId: string | undefined
  ): Promise<ApiResponse<EquipmentInventoryResponse> | ApiErrorResponse> {
    if (!equipmentId) {
      return badRequest("INVALID_EQUIPMENT", "equipmentId is required.");
    }

    const state = await this.equipmentRepository.findEquipmentStateByPlayerId(playerId);
    if (!state) {
      return notFound("Equipment state was not found.");
    }

    const equipment = state.equipment.find((item) => item.id === equipmentId);
    if (!equipment) {
      return notFound("Equipment was not found.");
    }

    const updatedState = await this.equipmentRepository.equip({
      playerId,
      equipmentId
    });

    return {
      ok: true,
      data: toInventoryResponse(updatedState)
    };
  }

  async enhance(
    playerId: string,
    equipmentId: string | undefined
  ): Promise<ApiResponse<EquipmentInventoryResponse> | ApiErrorResponse> {
    if (!equipmentId) {
      return badRequest("INVALID_EQUIPMENT", "equipmentId is required.");
    }

    const state = await this.equipmentRepository.findEquipmentStateByPlayerId(playerId);
    if (!state) {
      return notFound("Equipment state was not found.");
    }

    const equipment = state.equipment.find((item) => item.id === equipmentId);
    if (!equipment) {
      return notFound("Equipment was not found.");
    }

    const config = getEquipmentConfig(equipment.configId);
    if (equipment.enhanceLevel >= config.maxEnhanceLevel) {
      return badRequest("ENHANCE_LEVEL_LIMIT", "Equipment is already at max enhance level.");
    }

    if (
      state.player.gold < config.enhanceCost.gold ||
      state.player.enhanceMaterial < config.enhanceCost.enhanceMaterial
    ) {
      return badRequest("INSUFFICIENT_RESOURCES", "Not enough resources to enhance this equipment.");
    }

    const updatedState = await this.equipmentRepository.enhance({
      playerId,
      equipmentId,
      cost: config.enhanceCost
    });

    return {
      ok: true,
      data: toInventoryResponse(updatedState)
    };
  }
}

function toInventoryResponse(state: EquipmentStateRecord): EquipmentInventoryResponse {
  return {
    items: state.equipment.map(toEquipmentItemView),
    resources: {
      gold: state.player.gold,
      enhanceMaterial: state.player.enhanceMaterial
    }
  };
}

function toEquipmentItemView(equipment: EquipmentRecord): InventoryEquipmentItemView {
  const config = getEquipmentConfig(equipment.configId);
  return {
    id: equipment.id,
    configId: equipment.configId,
    name: config.name,
    slot: equipment.slot,
    quality: equipment.quality,
    enhanceLevel: equipment.enhanceLevel,
    isEquipped: equipment.isEquipped,
    maxEnhanceLevel: config.maxEnhanceLevel,
    stats: calculateEquipmentStats(config.baseStats, config.enhanceGrowth, equipment.enhanceLevel)
  };
}

function calculateEquipmentStats(
  baseStats: Partial<StatBlock>,
  enhanceGrowth: Partial<StatBlock>,
  enhanceLevel: number
): Partial<StatBlock> {
  const statKeys: Array<keyof StatBlock> = ["hp", "attack", "defense", "speed", "critRate"];
  const stats: Partial<StatBlock> = {};

  for (const statKey of statKeys) {
    const value = (baseStats[statKey] ?? 0) + (enhanceGrowth[statKey] ?? 0) * enhanceLevel;
    if (value !== 0) {
      stats[statKey] = value;
    }
  }

  return stats;
}

function getEquipmentConfig(configId: string) {
  const config = equipmentConfigs.find((equipmentConfig) => equipmentConfig.id === configId);
  if (!config) {
    throw new Error(`Equipment config ${configId} was not found.`);
  }

  return config;
}

function badRequest(code: string, message: string): ApiErrorResponse {
  return {
    ok: false,
    error: {
      code,
      message
    }
  };
}

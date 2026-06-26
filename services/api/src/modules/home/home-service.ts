import { equipmentConfigs, stageConfigs, taskConfigs } from "@buddy-brawl/configs";
import type {
  ApiErrorResponse,
  ApiResponse,
  EquippedItemView,
  HomeResponse,
  RewardItem,
  StatBlock
} from "@buddy-brawl/shared";
import type { HomeEquipmentRecord, HomeRepository, HomeStateRecord } from "./home-repository.js";
import { notFound } from "../player/player-service.js";

export interface HomeServiceOptions {
  now?: () => Date;
}

export class HomeService {
  private readonly now: () => Date;

  constructor(
    private readonly homeRepository: HomeRepository,
    options: HomeServiceOptions = {}
  ) {
    this.now = options.now ?? (() => new Date());
  }

  async getHome(playerId: string): Promise<ApiResponse<HomeResponse> | ApiErrorResponse> {
    const homeState = await this.homeRepository.findHomeStateByPlayerId(playerId);
    if (!homeState) {
      return notFound("Player was not found.");
    }

    return {
      ok: true,
      data: toHomeResponse(homeState, this.now())
    };
  }
}

function toHomeResponse(homeState: HomeStateRecord, now: Date): HomeResponse {
  const stage = stageConfigs.find((stageConfig) => stageConfig.id === homeState.adventureState.currentStageId);
  if (!stage) {
    throw new Error(`Stage config ${homeState.adventureState.currentStageId} was not found.`);
  }

  return {
    player: {
      id: homeState.player.id,
      nickname: homeState.player.nickname,
      avatarUrl: homeState.player.avatarUrl ?? undefined,
      arenaScore: homeState.player.arenaScore
    },
    currentPet: {
      id: homeState.currentPet.id,
      configId: homeState.currentPet.configId,
      name: homeState.currentPet.name,
      level: homeState.currentPet.level,
      exp: homeState.currentPet.exp,
      stats: {
        hp: homeState.currentPet.hp,
        attack: homeState.currentPet.attack,
        defense: homeState.currentPet.defense,
        speed: homeState.currentPet.speed,
        critRate: homeState.currentPet.critRate
      }
    },
    adventure: {
      currentStageId: stage.id,
      currentStageName: stage.name,
      claimableRewards: calculateClaimableRewards(homeState, now, stage.goldPerHour, stage.expPerHour),
      elapsedMinutes: calculateElapsedMinutes(homeState.adventureState.lastClaimedAt, now)
    },
    equipped: homeState.equipment.filter((equipment) => equipment.isEquipped).map(toEquippedItemView),
    arena: {
      score: homeState.arenaState.score,
      dailyChallengeCount: homeState.arenaState.dailyChallengeCount
    },
    tasks: {
      unclaimedCount: countUnclaimedTasks(homeState)
    }
  };
}

function calculateClaimableRewards(
  homeState: HomeStateRecord,
  now: Date,
  goldPerHour: number,
  expPerHour: number
): RewardItem[] {
  const elapsedMinutes = calculateElapsedMinutes(homeState.adventureState.lastClaimedAt, now);
  return [
    {
      type: "gold",
      amount: Math.floor((goldPerHour * elapsedMinutes) / 60)
    },
    {
      type: "exp",
      amount: Math.floor((expPerHour * elapsedMinutes) / 60)
    }
  ];
}

function calculateElapsedMinutes(lastClaimedAt: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - lastClaimedAt.getTime()) / 60000));
}

function toEquippedItemView(equipment: HomeEquipmentRecord): EquippedItemView {
  const config = equipmentConfigs.find((equipmentConfig) => equipmentConfig.id === equipment.configId);
  if (!config) {
    throw new Error(`Equipment config ${equipment.configId} was not found.`);
  }

  return {
    id: equipment.id,
    configId: equipment.configId,
    name: config.name,
    slot: equipment.slot,
    quality: equipment.quality,
    enhanceLevel: equipment.enhanceLevel,
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

function countUnclaimedTasks(homeState: HomeStateRecord): number {
  return homeState.tasks.filter((progress) => {
    if (progress.claimed) {
      return false;
    }

    const taskConfig = taskConfigs.find((task) => task.id === progress.taskId);
    return Boolean(taskConfig && progress.currentCount >= taskConfig.targetCount);
  }).length;
}

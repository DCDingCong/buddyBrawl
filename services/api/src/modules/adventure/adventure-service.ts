import { stageConfigs } from "@buddy-brawl/configs";
import { simulateBattle } from "@buddy-brawl/battle";
import type {
  AdventureClaimResponse,
  AdventureStatusResponse,
  ApiErrorResponse,
  ApiResponse,
  BattleResultView,
  RewardItem
} from "@buddy-brawl/shared";
import type { AdventureRepository, AdventureStateRecord } from "./adventure-repository.js";
import { notFound } from "../player/player-service.js";

export interface AdventureServiceOptions {
  now?: () => Date;
}

export class AdventureService {
  private readonly now: () => Date;

  constructor(
    private readonly adventureRepository: AdventureRepository,
    options: AdventureServiceOptions = {}
  ) {
    this.now = options.now ?? (() => new Date());
  }

  async getStatus(playerId: string): Promise<ApiResponse<AdventureStatusResponse> | ApiErrorResponse> {
    const state = await this.adventureRepository.findAdventureStateByPlayerId(playerId);
    if (!state) {
      return notFound("Adventure state was not found.");
    }

    return {
      ok: true,
      data: toStatusResponse(state, this.now())
    };
  }

  async claim(playerId: string): Promise<ApiResponse<AdventureClaimResponse> | ApiErrorResponse> {
    const state = await this.adventureRepository.findAdventureStateByPlayerId(playerId);
    if (!state) {
      return notFound("Adventure state was not found.");
    }

    const claimedAt = this.now();
    const rewards = calculateRewards(state, claimedAt);
    const updatedState = await this.adventureRepository.claimRewards({
      playerId,
      rewards,
      claimedAt,
      sourceId: `${state.adventureState.lastClaimedAt.toISOString()}_${claimedAt.toISOString()}`
    });

    return {
      ok: true,
      data: {
        rewards,
        stored: toStoredResources(updatedState),
        currentStageId: updatedState.adventureState.currentStageId,
        lastClaimedAt: updatedState.adventureState.lastClaimedAt.toISOString()
      }
    };
  }

  async challenge(playerId: string): Promise<ApiResponse<BattleResultView> | ApiErrorResponse> {
    const state = await this.adventureRepository.findAdventureStateByPlayerId(playerId);
    if (!state) {
      return notFound("Adventure state was not found.");
    }

    const stage = getStage(state.adventureState.currentStageId);
    const seed = createBattleSeed(this.now());
    const battle = simulateBattle({
      scene: "adventure",
      seed,
      attacker: {
        id: state.pet.id,
        ownerPlayerId: state.pet.ownerPlayerId,
        name: state.pet.name,
        level: state.pet.level,
        stats: {
          hp: state.pet.hp,
          attack: state.pet.attack,
          defense: state.pet.defense,
          speed: state.pet.speed,
          critRate: state.pet.critRate
        },
        skills: state.pet.skills
      },
      defender: {
        id: stage.boss.id,
        ownerPlayerId: `stage:${stage.id}`,
        name: stage.boss.name,
        level: stage.boss.level,
        stats: stage.boss.stats,
        skills: stage.boss.skills
      },
      attackerEquipment: [],
      defenderEquipment: []
    });

    return {
      ok: true,
      data: {
        scene: battle.scene,
        winner: battle.winner,
        seed: battle.seed,
        attacker: {
          playerId: state.player.id,
          petName: state.pet.name,
          level: state.pet.level,
          stats: {
            hp: state.pet.hp,
            attack: state.pet.attack,
            defense: state.pet.defense,
            speed: state.pet.speed,
            critRate: state.pet.critRate
          }
        },
        defender: {
          playerId: `stage:${stage.id}`,
          petName: stage.boss.name,
          level: stage.boss.level,
          stats: stage.boss.stats
        },
        events: battle.events,
        rewards: battle.rewards
      }
    };
  }
}

function toStatusResponse(state: AdventureStateRecord, now: Date): AdventureStatusResponse {
  const stage = getStage(state.adventureState.currentStageId);
  return {
    currentStageId: stage.id,
    currentStageName: stage.name,
    elapsedMinutes: calculateElapsedMinutes(state.adventureState.lastClaimedAt, now),
    claimableRewards: calculateRewards(state, now),
    stored: toStoredResources(state)
  };
}

function calculateRewards(state: AdventureStateRecord, now: Date): RewardItem[] {
  const stage = getStage(state.adventureState.currentStageId);
  const elapsedMinutes = calculateElapsedMinutes(state.adventureState.lastClaimedAt, now);
  return [
    {
      type: "gold",
      amount: Math.floor((stage.goldPerHour * elapsedMinutes) / 60)
    },
    {
      type: "exp",
      amount: Math.floor((stage.expPerHour * elapsedMinutes) / 60)
    }
  ];
}

function calculateElapsedMinutes(lastClaimedAt: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - lastClaimedAt.getTime()) / 60000));
}

function toStoredResources(state: AdventureStateRecord): AdventureStatusResponse["stored"] {
  return {
    gold: state.player.gold,
    petExp: state.pet.exp,
    enhanceMaterial: state.player.enhanceMaterial
  };
}

function getStage(stageId: string) {
  const stage = stageConfigs.find((stageConfig) => stageConfig.id === stageId);
  if (!stage) {
    throw new Error(`Stage config ${stageId} was not found.`);
  }

  return stage;
}

function createBattleSeed(date: Date): number {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return Number(`${year}${month}${day}${hour}${minute}`);
}

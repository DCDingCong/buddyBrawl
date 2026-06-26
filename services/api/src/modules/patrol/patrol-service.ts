import { stageConfigs } from "@buddy-brawl/configs";
import type { ApiErrorResponse, ApiResponse, PatrolEventView, PatrolSettleResponse, RewardItem } from "@buddy-brawl/shared";
import type { PatrolRepository, PatrolStateRecord } from "./patrol-repository.js";
import { notFound } from "../player/player-service.js";

export interface PatrolServiceOptions {
  now?: () => Date;
}

export class PatrolService {
  private readonly now: () => Date;

  constructor(
    private readonly patrolRepository: PatrolRepository,
    options: PatrolServiceOptions = {}
  ) {
    this.now = options.now ?? (() => new Date());
  }

  async settle(playerId: string): Promise<ApiResponse<PatrolSettleResponse> | ApiErrorResponse> {
    const state = await this.patrolRepository.findPatrolStateByPlayerId(playerId);
    if (!state) {
      return notFound("Patrol state was not found.");
    }

    const settledAt = this.now();
    const settledMinutes = calculateSettledMinutes(state.patrolState.lastSettledAt, settledAt, state.patrolState.maxRewardMinutes);
    const rewards = calculateRewards(state, settledMinutes);
    const events = createPatrolEvents(settledMinutes, rewards, settledAt);
    const updatedState = await this.patrolRepository.settle({
      playerId,
      rewards,
      events,
      settledAt
    });

    return {
      ok: true,
      data: {
        rewards,
        settledMinutes,
        maxRewardMinutes: state.patrolState.maxRewardMinutes,
        events: updatedState.recentEvents.slice(0, 5),
        resources: {
          gold: updatedState.player.gold,
          petExp: updatedState.pet.exp
        },
        lastSettledAt: updatedState.patrolState.lastSettledAt.toISOString()
      }
    };
  }
}

function calculateSettledMinutes(lastSettledAt: Date, settledAt: Date, maxRewardMinutes: number): number {
  const elapsedMinutes = Math.max(0, Math.floor((settledAt.getTime() - lastSettledAt.getTime()) / 60000));
  return Math.min(elapsedMinutes, maxRewardMinutes);
}

function calculateRewards(state: PatrolStateRecord, settledMinutes: number): RewardItem[] {
  const stage = stageConfigs.find((stageConfig) => stageConfig.id === state.adventureState.currentStageId);
  if (!stage) {
    throw new Error(`Stage config ${state.adventureState.currentStageId} was not found.`);
  }

  return [
    {
      type: "gold",
      amount: Math.floor((stage.goldPerHour * settledMinutes) / 60)
    },
    {
      type: "exp",
      amount: Math.floor((stage.expPerHour * settledMinutes) / 60)
    }
  ];
}

function createPatrolEvents(settledMinutes: number, rewards: RewardItem[], settledAt: Date): Array<Omit<PatrolEventView, "id">> {
  if (settledMinutes <= 0) {
    return [];
  }

  const eventCount = Math.min(5, Math.max(1, Math.ceil(settledMinutes / 120)));
  const gold = rewards.find((reward) => reward.type === "gold")?.amount ?? 0;
  const exp = rewards.find((reward) => reward.type === "exp")?.amount ?? 0;
  const templates: Array<Pick<PatrolEventView, "kind" | "title" | "text">> = [
    {
      kind: "found_gold",
      title: "捡到金币",
      text: `熊猫巡逻时捡到了 ${gold} 金币。`
    },
    {
      kind: "trained",
      title: "偷偷练功",
      text: `熊猫趁你不在练了一会儿，获得 ${exp} 经验。`
    },
    {
      kind: "ambushed",
      title: "被人偷袭",
      text: "熊猫巡逻时被路过的对手拍了一下，记下了这笔账。"
    }
  ];

  return Array.from({ length: eventCount }, (_, index) => {
    const template = templates[index % templates.length]!;
    return {
      ...template,
      rewards,
      happenedAt: new Date(settledAt.getTime() - (eventCount - index - 1) * 60000).toISOString()
    };
  });
}

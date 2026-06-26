import type { PatrolEventView, RewardItem } from "@buddy-brawl/shared";

export interface PatrolStateRecord {
  player: {
    id: string;
    gold: number;
  };
  pet: {
    id: string;
    exp: number;
  };
  adventureState: {
    currentStageId: string;
  };
  patrolState: {
    lastSettledAt: Date;
    maxRewardMinutes: number;
  };
  recentEvents: PatrolEventView[];
}

export interface PatrolSettleInput {
  playerId: string;
  rewards: RewardItem[];
  events: Array<Omit<PatrolEventView, "id">>;
  settledAt: Date;
}

export interface PatrolRepository {
  findPatrolStateByPlayerId(playerId: string): Promise<PatrolStateRecord | null>;
  settle(input: PatrolSettleInput): Promise<PatrolStateRecord>;
}

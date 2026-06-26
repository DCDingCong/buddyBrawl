import type { RewardItem } from "@buddy-brawl/shared";

export interface TaskProgressRecord {
  taskId: string;
  currentCount: number;
  claimed: boolean;
}

export interface TaskStateRecord {
  player: {
    id: string;
    gold: number;
    enhanceMaterial: number;
  };
  pet: {
    id: string;
    exp: number;
  };
  progress: TaskProgressRecord[];
}

export interface TaskClaimInput {
  playerId: string;
  taskId: string;
  rewards: RewardItem[];
}

export interface TaskRepository {
  findTaskStateByPlayerId(playerId: string): Promise<TaskStateRecord | null>;
  claimTask(input: TaskClaimInput): Promise<TaskStateRecord>;
}

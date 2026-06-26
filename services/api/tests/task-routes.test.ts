import { describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import type { AdventureRepository } from "../src/modules/adventure/adventure-repository.js";
import type { ArenaRepository } from "../src/modules/arena/arena-repository.js";
import type { EquipmentRepository } from "../src/modules/equipment/equipment-repository.js";
import type { HomeRepository } from "../src/modules/home/home-repository.js";
import type { LeaderboardRepository } from "../src/modules/leaderboard/leaderboard-repository.js";
import type { PlayerRepository } from "../src/modules/player/player-repository.js";
import type { TaskClaimInput, TaskRepository, TaskStateRecord } from "../src/modules/tasks/task-repository.js";

class EmptyPlayerRepository implements PlayerRepository {
  async findPlayerByOpenId() {
    return null;
  }

  async findPlayerById() {
    return null;
  }

  async createInitializedPlayer(): Promise<never> {
    throw new Error("Not needed by task route tests.");
  }

  async recordLoginProgress(): Promise<never> {
    throw new Error("Not needed by task route tests.");
  }
}

class EmptyHomeRepository implements HomeRepository {
  async findHomeStateByPlayerId() {
    return null;
  }
}

class EmptyAdventureRepository implements AdventureRepository {
  async findAdventureStateByPlayerId() {
    return null;
  }

  async claimRewards(): Promise<never> {
    throw new Error("Not needed by task route tests.");
  }
}

class EmptyEquipmentRepository implements EquipmentRepository {
  async findEquipmentStateByPlayerId() {
    return null;
  }

  async equip(): Promise<never> {
    throw new Error("Not needed by task route tests.");
  }

  async enhance(): Promise<never> {
    throw new Error("Not needed by task route tests.");
  }
}

class EmptyArenaRepository implements ArenaRepository {
  async findOpponents() {
    return [];
  }

  async findChallengeState() {
    return null;
  }

  async saveChallenge(): Promise<never> {
    throw new Error("Not needed by task route tests.");
  }

  async findRecentBattles() {
    return [];
  }

  async findBattleForPlayer() {
    return null;
  }
}

class EmptyLeaderboardRepository implements LeaderboardRepository {
  async listLeaderboard() {
    return [];
  }

  async getPlayerRank() {
    return null;
  }
}

class MemoryTaskRepository implements TaskRepository {
  constructor(private state: TaskStateRecord | null) {}

  async findTaskStateByPlayerId(): Promise<TaskStateRecord | null> {
    return this.state;
  }

  async claimTask(input: TaskClaimInput): Promise<TaskStateRecord> {
    if (!this.state) {
      throw new Error("Missing state");
    }

    const gold = input.rewards.find((reward) => reward.type === "gold")?.amount ?? 0;
    const enhanceMaterial = input.rewards.find((reward) => reward.type === "enhanceMaterial")?.amount ?? 0;
    const petExp = input.rewards.find((reward) => reward.type === "exp")?.amount ?? 0;
    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        gold: this.state.player.gold + gold,
        enhanceMaterial: this.state.player.enhanceMaterial + enhanceMaterial
      },
      pet: {
        ...this.state.pet,
        exp: this.state.pet.exp + petExp
      },
      progress: this.state.progress.map((progress) =>
        progress.taskId === input.taskId
          ? {
              ...progress,
              claimed: true
            }
          : progress
      )
    };
    return this.state;
  }
}

async function createTestApp(repository: TaskRepository): Promise<FastifyInstance> {
  return buildApp({
    playerRepository: new EmptyPlayerRepository(),
    homeRepository: new EmptyHomeRepository(),
    adventureRepository: new EmptyAdventureRepository(),
    equipmentRepository: new EmptyEquipmentRepository(),
    arenaRepository: new EmptyArenaRepository(),
    leaderboardRepository: new EmptyLeaderboardRepository(),
    taskRepository: repository
  });
}

function createTaskState(): TaskStateRecord {
  return {
    player: {
      id: "player-1",
      gold: 0,
      enhanceMaterial: 0
    },
    pet: {
      id: "pet-1",
      exp: 0
    },
    progress: [
      {
        taskId: "daily_login",
        currentCount: 1,
        claimed: false
      },
      {
        taskId: "first_claim_adventure",
        currentCount: 1,
        claimed: false
      },
      {
        taskId: "first_enhance_equipment",
        currentCount: 0,
        claimed: false
      },
      {
        taskId: "first_arena_challenge",
        currentCount: 0,
        claimed: false
      }
    ]
  };
}

describe("task routes", () => {
  test("lists task progress with claimable state", async () => {
    const app = await createTestApp(new MemoryTaskRepository(createTaskState()));

    const response = await app.inject({
      method: "GET",
      url: "/tasks",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.tasks).toEqual([
      {
        taskId: "daily_login",
        name: "每日进入游戏",
        type: "login",
        currentCount: 1,
        targetCount: 1,
        claimed: false,
        claimable: true,
        rewards: [
          {
            type: "gold",
            amount: 50
          }
        ]
      },
      {
        taskId: "first_claim_adventure",
        name: "领取一次冒险收益",
        type: "claim_adventure",
        currentCount: 1,
        targetCount: 1,
        claimed: false,
        claimable: true,
        rewards: [
          {
            type: "gold",
            amount: 80
          }
        ]
      },
      {
        taskId: "first_enhance_equipment",
        name: "强化一次装备",
        type: "enhance_equipment",
        currentCount: 0,
        targetCount: 1,
        claimed: false,
        claimable: false,
        rewards: [
          {
            type: "enhanceMaterial",
            amount: 3
          }
        ]
      },
      {
        taskId: "first_arena_challenge",
        name: "完成一次竞技挑战",
        type: "arena_challenge",
        currentCount: 0,
        targetCount: 1,
        claimed: false,
        claimable: false,
        rewards: [
          {
            type: "gold",
            amount: 120
          }
        ]
      }
    ]);

    await app.close();
  });

  test("claiming a completed task grants rewards and prevents duplicate claim", async () => {
    const app = await createTestApp(new MemoryTaskRepository(createTaskState()));

    const first = await app.inject({
      method: "POST",
      url: "/tasks/first_claim_adventure/claim",
      headers: {
        authorization: "Bearer player-1"
      }
    });
    const second = await app.inject({
      method: "POST",
      url: "/tasks/first_claim_adventure/claim",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(first.statusCode).toBe(200);
    expect(first.json().data.resources).toEqual({
      gold: 80,
      enhanceMaterial: 0,
      petExp: 0
    });
    expect(first.json().data.task.claimed).toBe(true);
    expect(second.statusCode).toBe(400);
    expect(second.json().error.code).toBe("TASK_NOT_CLAIMABLE");

    await app.close();
  });
});

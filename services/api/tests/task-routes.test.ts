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

  async markBattleViewed() {
    return undefined;
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
        taskId: "daily_view_battle_report",
        currentCount: 1,
        claimed: false
      },
      {
        taskId: "daily_complete_battle",
        currentCount: 0,
        claimed: false
      },
      {
        taskId: "main_reach_level_2",
        currentCount: 0,
        claimed: false
      },
      {
        taskId: "main_complete_3_battles",
        currentCount: 0,
        claimed: false
      }
    ]
  };
}

describe("task routes", () => {
  test("lists V0.2 daily and main task progress with claimable state", async () => {
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
        name: "每日登录",
        type: "login",
        category: "daily",
        currentCount: 1,
        targetCount: 1,
        claimed: false,
        claimable: true,
        rewards: [{ type: "gold", amount: 50 }]
      },
      {
        taskId: "daily_view_battle_report",
        name: "查看战报",
        type: "view_battle_report",
        category: "daily",
        currentCount: 1,
        targetCount: 1,
        claimed: false,
        claimable: true,
        rewards: [{ type: "gold", amount: 60 }]
      },
      {
        taskId: "daily_complete_battle",
        name: "完成战斗",
        type: "complete_battle",
        category: "daily",
        currentCount: 0,
        targetCount: 1,
        claimed: false,
        claimable: false,
        rewards: [{ type: "gold", amount: 100 }]
      },
      {
        taskId: "main_reach_level_2",
        name: "熊猫升到 2 级",
        type: "pet_level",
        category: "main",
        currentCount: 0,
        targetCount: 2,
        claimed: false,
        claimable: false,
        rewards: [{ type: "gold", amount: 150 }]
      },
      {
        taskId: "main_complete_3_battles",
        name: "完成 3 场战斗",
        type: "battle_count",
        category: "main",
        currentCount: 0,
        targetCount: 3,
        claimed: false,
        claimable: false,
        rewards: [{ type: "gold", amount: 200 }]
      }
    ]);

    await app.close();
  });

  test("claiming a completed V0.2 task grants rewards and prevents duplicate claim", async () => {
    const app = await createTestApp(new MemoryTaskRepository(createTaskState()));

    const first = await app.inject({
      method: "POST",
      url: "/tasks/daily_view_battle_report/claim",
      headers: {
        authorization: "Bearer player-1"
      }
    });
    const second = await app.inject({
      method: "POST",
      url: "/tasks/daily_view_battle_report/claim",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(first.statusCode).toBe(200);
    expect(first.json().data.resources).toEqual({
      gold: 60,
      enhanceMaterial: 0,
      petExp: 0
    });
    expect(first.json().data.task.claimed).toBe(true);
    expect(second.statusCode).toBe(400);
    expect(second.json().error.code).toBe("TASK_NOT_CLAIMABLE");

    await app.close();
  });

  test("summary returns daily and main task groups for the home modal", async () => {
    const app = await createTestApp(new MemoryTaskRepository(createTaskState()));

    const response = await app.inject({
      method: "GET",
      url: "/tasks/summary",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.daily.map((task: { taskId: string }) => task.taskId)).toEqual([
      "daily_login",
      "daily_view_battle_report",
      "daily_complete_battle"
    ]);
    expect(response.json().data.main.map((task: { taskId: string }) => task.taskId)).toEqual([
      "main_reach_level_2",
      "main_complete_3_battles"
    ]);

    await app.close();
  });
});

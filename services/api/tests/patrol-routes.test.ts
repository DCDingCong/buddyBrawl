import { describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import type { AdventureRepository } from "../src/modules/adventure/adventure-repository.js";
import type { ArenaRepository } from "../src/modules/arena/arena-repository.js";
import type { EquipmentRepository } from "../src/modules/equipment/equipment-repository.js";
import type { HomeRepository } from "../src/modules/home/home-repository.js";
import type { LeaderboardRepository } from "../src/modules/leaderboard/leaderboard-repository.js";
import type { PatrolRepository, PatrolSettleInput, PatrolStateRecord } from "../src/modules/patrol/patrol-repository.js";
import type { PlayerRepository } from "../src/modules/player/player-repository.js";
import type { TaskRepository } from "../src/modules/tasks/task-repository.js";

class EmptyPlayerRepository implements PlayerRepository {
  async findPlayerByOpenId() {
    return null;
  }

  async findPlayerById() {
    return null;
  }

  async createInitializedPlayer(): Promise<never> {
    throw new Error("Not needed by patrol route tests.");
  }

  async recordLoginProgress(): Promise<never> {
    throw new Error("Not needed by patrol route tests.");
  }
}

class EmptyAdventureRepository implements AdventureRepository {
  async findAdventureStateByPlayerId() {
    return null;
  }

  async claimRewards(): Promise<never> {
    throw new Error("Not needed by patrol route tests.");
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
    throw new Error("Not needed by patrol route tests.");
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

class EmptyEquipmentRepository implements EquipmentRepository {
  async findEquipmentStateByPlayerId() {
    return null;
  }

  async equip(): Promise<never> {
    throw new Error("Not needed by patrol route tests.");
  }

  async enhance(): Promise<never> {
    throw new Error("Not needed by patrol route tests.");
  }
}

class EmptyHomeRepository implements HomeRepository {
  async findHomeStateByPlayerId() {
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

class EmptyTaskRepository implements TaskRepository {
  async findTaskStateByPlayerId() {
    return null;
  }

  async claimTask(): Promise<never> {
    throw new Error("Not needed by patrol route tests.");
  }
}

class MemoryPatrolRepository implements PatrolRepository {
  constructor(private state: PatrolStateRecord | null) {}

  async findPatrolStateByPlayerId(): Promise<PatrolStateRecord | null> {
    return this.state;
  }

  async settle(input: PatrolSettleInput): Promise<PatrolStateRecord> {
    if (!this.state) {
      throw new Error("Missing patrol state");
    }

    const gold = input.rewards.find((reward) => reward.type === "gold")?.amount ?? 0;
    const exp = input.rewards.find((reward) => reward.type === "exp")?.amount ?? 0;
    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        gold: this.state.player.gold + gold
      },
      pet: {
        ...this.state.pet,
        exp: this.state.pet.exp + exp
      },
      patrolState: {
        ...this.state.patrolState,
        lastSettledAt: input.settledAt
      },
      recentEvents: input.events.map((event, index) => ({
        id: `event-${index + 1}`,
        ...event
      }))
    };
    return this.state;
  }
}

async function createTestApp(repository: PatrolRepository): Promise<FastifyInstance> {
  return buildApp({
    playerRepository: new EmptyPlayerRepository(),
    adventureRepository: new EmptyAdventureRepository(),
    arenaRepository: new EmptyArenaRepository(),
    equipmentRepository: new EmptyEquipmentRepository(),
    homeRepository: new EmptyHomeRepository(),
    leaderboardRepository: new EmptyLeaderboardRepository(),
    patrolRepository: repository,
    taskRepository: new EmptyTaskRepository(),
    now: () => new Date("2026-06-26T08:30:00.000Z")
  });
}

function createPatrolState(): PatrolStateRecord {
  return {
    player: {
      id: "player-1",
      gold: 10
    },
    pet: {
      id: "pet-1",
      exp: 5
    },
    adventureState: {
      currentStageId: "bamboo_forest_1"
    },
    patrolState: {
      lastSettledAt: new Date("2026-06-25T20:30:00.000Z"),
      maxRewardMinutes: 480
    },
    recentEvents: []
  };
}

describe("patrol routes", () => {
  test("settle caps rewards at 8 hours, auto deposits rewards, and returns at most 5 events", async () => {
    const app = await createTestApp(new MemoryPatrolRepository(createPatrolState()));

    const response = await app.inject({
      method: "POST",
      url: "/patrol/settle",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toMatchObject({
      settledMinutes: 480,
      maxRewardMinutes: 480,
      rewards: [
        {
          type: "gold",
          amount: 320
        },
        {
          type: "exp",
          amount: 192
        }
      ],
      resources: {
        gold: 330,
        petExp: 197
      },
      lastSettledAt: "2026-06-26T08:30:00.000Z"
    });
    expect(response.json().data.events).toHaveLength(4);
    expect(response.json().data.events.length).toBeLessThanOrEqual(5);

    await app.close();
  });
});

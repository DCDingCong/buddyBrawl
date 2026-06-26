import { describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import type { AdventureRepository } from "../src/modules/adventure/adventure-repository.js";
import type { ArenaRepository } from "../src/modules/arena/arena-repository.js";
import type { EquipmentRepository } from "../src/modules/equipment/equipment-repository.js";
import type { HomeRepository } from "../src/modules/home/home-repository.js";
import type {
  LeaderboardEntryRecord,
  LeaderboardRepository
} from "../src/modules/leaderboard/leaderboard-repository.js";
import type { PlayerRepository } from "../src/modules/player/player-repository.js";

class EmptyPlayerRepository implements PlayerRepository {
  async findPlayerByOpenId() {
    return null;
  }

  async findPlayerById() {
    return null;
  }

  async createInitializedPlayer(): Promise<never> {
    throw new Error("Not needed by leaderboard route tests.");
  }

  async recordLoginProgress(): Promise<never> {
    throw new Error("Not needed by leaderboard route tests.");
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
    throw new Error("Not needed by leaderboard route tests.");
  }
}

class EmptyEquipmentRepository implements EquipmentRepository {
  async findEquipmentStateByPlayerId() {
    return null;
  }

  async equip(): Promise<never> {
    throw new Error("Not needed by leaderboard route tests.");
  }

  async enhance(): Promise<never> {
    throw new Error("Not needed by leaderboard route tests.");
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
    throw new Error("Not needed by leaderboard route tests.");
  }

  async findRecentBattles() {
    return [];
  }

  async findBattleForPlayer() {
    return null;
  }
}

class MemoryLeaderboardRepository implements LeaderboardRepository {
  constructor(private readonly entries: LeaderboardEntryRecord[]) {}

  async listLeaderboard(): Promise<LeaderboardEntryRecord[]> {
    return [...this.entries].sort(compareLeaderboardEntries);
  }

  async getPlayerRank(playerId: string): Promise<LeaderboardEntryRecord | null> {
    return (await this.listLeaderboard()).find((entry) => entry.playerId === playerId) ?? null;
  }
}

function compareLeaderboardEntries(left: LeaderboardEntryRecord, right: LeaderboardEntryRecord): number {
  return right.arenaScore - left.arenaScore || left.createdAt.getTime() - right.createdAt.getTime() || left.playerId.localeCompare(right.playerId);
}

async function createTestApp(repository: LeaderboardRepository): Promise<FastifyInstance> {
  return buildApp({
    playerRepository: new EmptyPlayerRepository(),
    homeRepository: new EmptyHomeRepository(),
    adventureRepository: new EmptyAdventureRepository(),
    equipmentRepository: new EmptyEquipmentRepository(),
    arenaRepository: new EmptyArenaRepository(),
    leaderboardRepository: repository
  });
}

function createEntries(): LeaderboardEntryRecord[] {
  return [
    {
      playerId: "player-1",
      nickname: "Middle",
      petName: "Panda A",
      power: 146,
      arenaScore: 1000,
      createdAt: new Date("2026-06-26T03:00:00.000Z")
    },
    {
      playerId: "player-2",
      nickname: "Top",
      petName: "Panda B",
      power: 155,
      arenaScore: 1200,
      createdAt: new Date("2026-06-26T02:00:00.000Z")
    },
    {
      playerId: "player-3",
      nickname: "Tie Earlier",
      petName: "Panda C",
      power: 140,
      arenaScore: 1000,
      createdAt: new Date("2026-06-26T01:00:00.000Z")
    }
  ];
}

describe("leaderboard routes", () => {
  test("leaderboard orders by score and stable tie-breakers", async () => {
    const app = await createTestApp(new MemoryLeaderboardRepository(createEntries()));

    const response = await app.inject({
      method: "GET",
      url: "/leaderboard",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.entries.map((entry: { playerId: string; rank: number }) => [entry.rank, entry.playerId])).toEqual([
      [1, "player-2"],
      [2, "player-3"],
      [3, "player-1"]
    ]);

    await app.close();
  });

  test("my rank matches leaderboard ordering", async () => {
    const app = await createTestApp(new MemoryLeaderboardRepository(createEntries()));

    const response = await app.inject({
      method: "GET",
      url: "/leaderboard/me",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toMatchObject({
      rank: 3,
      playerId: "player-1",
      nickname: "Middle",
      arenaScore: 1000
    });

    await app.close();
  });
});

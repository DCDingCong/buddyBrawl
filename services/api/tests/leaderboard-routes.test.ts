import { describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import type { AdventureRepository } from "../src/modules/adventure/adventure-repository.js";
import type { ArenaChallengeInput, ArenaRepository, ArenaStateRecord } from "../src/modules/arena/arena-repository.js";
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

  async markBattleViewed() {
    return undefined;
  }
}

class MemoryArenaRepository implements ArenaRepository {
  public records: ArenaStateRecord["battleRecords"] = [];

  constructor(private players: ArenaStateRecord["players"]) {}

  async findOpponents(playerId: string) {
    return this.players.filter((player) => player.id !== playerId);
  }

  async findChallengeState(attackerPlayerId: string, defenderPlayerId: string): Promise<ArenaStateRecord | null> {
    const attacker = this.players.find((player) => player.id === attackerPlayerId);
    const defender = this.players.find((player) => player.id === defenderPlayerId);
    return attacker && defender ? { players: [attacker, defender], battleRecords: this.records } : null;
  }

  async saveChallenge(input: ArenaChallengeInput) {
    const record = {
      id: "revenge-battle-1",
      scene: "arena" as const,
      seed: input.seed,
      attackerPlayerId: input.attackerPlayerId,
      defenderPlayerId: input.defenderPlayerId,
      winnerSide: input.winnerSide,
      attackerSnapshot: input.attackerSnapshot,
      defenderSnapshot: input.defenderSnapshot,
      events: input.events,
      rewards: input.rewards,
      createdAt: new Date("2026-06-26T08:30:00.000Z")
    };
    this.records.unshift(record);
    return record;
  }

  async findRecentBattles() {
    return this.records;
  }

  async findBattleForPlayer() {
    return null;
  }

  async markBattleViewed() {
    return undefined;
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

async function createTestApp(
  repository: LeaderboardRepository,
  arenaRepository: ArenaRepository = new EmptyArenaRepository()
): Promise<FastifyInstance> {
  return buildApp({
    playerRepository: new EmptyPlayerRepository(),
    homeRepository: new EmptyHomeRepository(),
    adventureRepository: new EmptyAdventureRepository(),
    equipmentRepository: new EmptyEquipmentRepository(),
    arenaRepository,
    leaderboardRepository: repository,
    now: () => new Date("2026-06-26T08:30:00.000Z")
  });
}

function createEntries(): LeaderboardEntryRecord[] {
  return [
    {
      playerId: "player-1",
      nickname: "Middle",
      petName: "Panda A",
      level: 3,
      power: 146,
      arenaScore: 1000,
      createdAt: new Date("2026-06-26T03:00:00.000Z")
    },
    {
      playerId: "player-2",
      nickname: "Top",
      petName: "Panda B",
      level: 2,
      power: 155,
      arenaScore: 1200,
      createdAt: new Date("2026-06-26T02:00:00.000Z")
    },
    {
      playerId: "player-3",
      nickname: "Tie Earlier",
      petName: "Panda C",
      level: 1,
      power: 140,
      arenaScore: 1000,
      createdAt: new Date("2026-06-26T01:00:00.000Z")
    }
  ];
}

function createArenaPlayers(): ArenaStateRecord["players"] {
  return [
    {
      id: "player-1",
      nickname: "Attacker",
      arenaScore: 1000,
      arenaState: {
        score: 1000,
        dailyChallengeCount: 0
      },
      currentPet: {
        id: "pet-1",
        ownerPlayerId: "player-1",
        name: "Panda A",
        level: 3,
        stats: {
          hp: 120,
          attack: 24,
          defense: 8,
          speed: 12,
          critRate: 0.1
        },
        skills: ["basic_strike"]
      },
      equipment: []
    },
    {
      id: "player-2",
      nickname: "Defender",
      arenaScore: 1200,
      arenaState: {
        score: 1200,
        dailyChallengeCount: 0
      },
      currentPet: {
        id: "pet-2",
        ownerPlayerId: "player-2",
        name: "Panda B",
        level: 2,
        stats: {
          hp: 90,
          attack: 16,
          defense: 5,
          speed: 8,
          critRate: 0.05
        },
        skills: ["basic_strike"]
      },
      equipment: []
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

  test("level rankings order by level first and expose challenge actions", async () => {
    const app = await createTestApp(new MemoryLeaderboardRepository(createEntries()));

    const response = await app.inject({
      method: "GET",
      url: "/rankings/level",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.entries.map((entry: { playerId: string; rank: number }) => [entry.rank, entry.playerId])).toEqual([
      [1, "player-1"],
      [2, "player-2"],
      [3, "player-3"]
    ]);
    expect(response.json().data.entries[0].action).toEqual({
      label: "自己",
      kind: "self",
      enabled: false
    });
    expect(response.json().data.entries[1].action).toEqual({
      label: "挑战",
      kind: "challenge",
      enabled: true
    });

    await app.close();
  });

  test("ranking revenge reuses arena challenge settlement", async () => {
    const arenaRepository = new MemoryArenaRepository(createArenaPlayers());
    const app = await createTestApp(new MemoryLeaderboardRepository(createEntries()), arenaRepository);

    const response = await app.inject({
      method: "POST",
      url: "/rankings/revenge",
      headers: {
        authorization: "Bearer player-1"
      },
      payload: {
        targetPlayerId: "player-2"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.battleId).toBe("revenge-battle-1");
    expect(arenaRepository.records[0]?.attackerPlayerId).toBe("player-1");
    expect(arenaRepository.records[0]?.defenderPlayerId).toBe("player-2");

    await app.close();
  });
});

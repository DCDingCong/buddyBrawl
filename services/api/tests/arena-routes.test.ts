import { describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import type { AdventureRepository } from "../src/modules/adventure/adventure-repository.js";
import type { ArenaChallengeInput, ArenaRepository, ArenaStateRecord } from "../src/modules/arena/arena-repository.js";
import type { EquipmentRepository } from "../src/modules/equipment/equipment-repository.js";
import type { HomeRepository } from "../src/modules/home/home-repository.js";
import type { PlayerRepository } from "../src/modules/player/player-repository.js";

class EmptyPlayerRepository implements PlayerRepository {
  async findPlayerByOpenId() {
    return null;
  }

  async findPlayerById() {
    return null;
  }

  async createInitializedPlayer(): Promise<never> {
    throw new Error("Not needed by arena route tests.");
  }

  async recordLoginProgress(): Promise<never> {
    throw new Error("Not needed by arena route tests.");
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
    throw new Error("Not needed by arena route tests.");
  }
}

class EmptyEquipmentRepository implements EquipmentRepository {
  async findEquipmentStateByPlayerId() {
    return null;
  }

  async equip(): Promise<never> {
    throw new Error("Not needed by arena route tests.");
  }

  async enhance(): Promise<never> {
    throw new Error("Not needed by arena route tests.");
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
    if (!attacker || !defender) {
      return null;
    }

    return {
      players: [attacker, defender],
      battleRecords: this.records
    };
  }

  async saveChallenge(input: ArenaChallengeInput) {
    const attacker = this.players.find((player) => player.id === input.attackerPlayerId);
    const defender = this.players.find((player) => player.id === input.defenderPlayerId);
    if (!attacker || !defender) {
      throw new Error("Missing challenge player");
    }

    attacker.arenaScore += input.attackerScoreDelta;
    attacker.arenaState.score += input.attackerScoreDelta;
    attacker.arenaState.dailyChallengeCount += 1;
    defender.arenaScore += input.defenderScoreDelta;
    defender.arenaState.score += input.defenderScoreDelta;

    const record = {
      id: `battle-${this.records.length + 1}`,
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

  async findRecentBattles(playerId: string) {
    return this.records.filter(
      (record) => record.attackerPlayerId === playerId || record.defenderPlayerId === playerId
    );
  }

  async findBattleForPlayer(playerId: string, battleId: string) {
    return (
      this.records.find(
        (record) =>
          record.id === battleId && (record.attackerPlayerId === playerId || record.defenderPlayerId === playerId)
      ) ?? null
    );
  }
}

async function createTestApp(
  repository: ArenaRepository,
  now: () => Date = () => new Date("2026-06-26T08:30:00.000Z")
): Promise<FastifyInstance> {
  return buildApp({
    playerRepository: new EmptyPlayerRepository(),
    homeRepository: new EmptyHomeRepository(),
    adventureRepository: new EmptyAdventureRepository(),
    equipmentRepository: new EmptyEquipmentRepository(),
    arenaRepository: repository,
    now
  });
}

function createPlayers(): ArenaStateRecord["players"] {
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
        name: "Bamboo Fist Panda",
        level: 1,
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
      arenaScore: 980,
      arenaState: {
        score: 980,
        dailyChallengeCount: 1
      },
      currentPet: {
        id: "pet-2",
        ownerPlayerId: "player-2",
        name: "Training Panda",
        level: 1,
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

describe("arena routes", () => {
  test("opponents exclude the current player", async () => {
    const app = await createTestApp(new MemoryArenaRepository(createPlayers()));

    const response = await app.inject({
      method: "GET",
      url: "/arena/opponents",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      data: {
        opponents: [
          {
            playerId: "player-2",
            nickname: "Defender",
            petName: "Training Panda",
            level: 1,
            arenaScore: 980
          }
        ]
      }
    });

    await app.close();
  });

  test("challenge saves a replayable battle and updates arena state", async () => {
    const repository = new MemoryArenaRepository(createPlayers());
    const app = await createTestApp(repository);

    const response = await app.inject({
      method: "POST",
      url: "/arena/challenge",
      headers: {
        authorization: "Bearer player-1"
      },
      payload: {
        defenderPlayerId: "player-2"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toMatchObject({
      battleId: "battle-1",
      scene: "arena",
      winner: "attacker",
      seed: 29707710
    });
    expect(repository.records).toHaveLength(1);
    expect(repository.records[0]?.events.length).toBeGreaterThan(0);
    expect(repository.records[0]?.attackerPlayerId).toBe("player-1");
    expect(repository.records[0]?.defenderPlayerId).toBe("player-2");

    const recent = await app.inject({
      method: "GET",
      url: "/arena/recent-battles",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(recent.statusCode).toBe(200);
    expect(recent.json().data.battles[0]).toMatchObject({
      battleId: "battle-1",
      opponentPlayerId: "player-2",
      winner: "attacker"
    });

    await app.close();
  });

  test("challenge resolves equipment techniques into battle reports", async () => {
    const players = createPlayers();
    players[0]!.equipment = [
      {
        id: "equipment-1",
        configId: "bamboo_staff_common",
        slot: "weapon",
        quality: "common",
        enhanceLevel: 1,
        stats: { attack: 6 }
      }
    ];
    const repository = new MemoryArenaRepository(players);
    const app = await createTestApp(repository, () => new Date("2026-06-26T08:37:00.000Z"));

    const response = await app.inject({
      method: "POST",
      url: "/arena/challenge",
      headers: {
        authorization: "Bearer player-1"
      },
      payload: {
        defenderPlayerId: "player-2"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(repository.records[0]?.events.some((event) => event.techniqueConfigId === "bamboo_staff_swing")).toBe(true);
    expect(response.json().data.events).toContainEqual(
      expect.objectContaining({
        techniqueConfigId: "bamboo_staff_swing",
        techniqueName: "竹棍敲一下",
        techniqueEffectKind: "bonus_damage"
      })
    );

    await app.close();
  });

  test("battle detail is only visible to participating players", async () => {
    const repository = new MemoryArenaRepository(createPlayers());
    const app = await createTestApp(repository);

    await app.inject({
      method: "POST",
      url: "/arena/challenge",
      headers: {
        authorization: "Bearer player-1"
      },
      payload: {
        defenderPlayerId: "player-2"
      }
    });

    const ownBattle = await app.inject({
      method: "GET",
      url: "/battles/battle-1",
      headers: {
        authorization: "Bearer player-1"
      }
    });
    const unrelatedBattle = await app.inject({
      method: "GET",
      url: "/battles/battle-1",
      headers: {
        authorization: "Bearer player-3"
      }
    });

    expect(ownBattle.statusCode).toBe(200);
    expect(ownBattle.json().data.battleId).toBe("battle-1");
    expect(ownBattle.json().data.events.length).toBeGreaterThan(0);
    expect(unrelatedBattle.statusCode).toBe(404);

    await app.close();
  });
});

import { describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { taskConfigs } from "@buddy-brawl/configs";
import { buildApp } from "../src/app.js";
import type {
  InitializedPlayerRecord,
  PlayerRepository
} from "../src/modules/player/player-repository.js";

class MemoryPlayerRepository implements PlayerRepository {
  private playersById = new Map<string, InitializedPlayerRecord>();
  private playerIdByOpenId = new Map<string, string>();
  private nextId = 1;

  async findPlayerByOpenId(openId: string): Promise<InitializedPlayerRecord | null> {
    const playerId = this.playerIdByOpenId.get(openId);
    return playerId ? this.playersById.get(playerId) ?? null : null;
  }

  async findPlayerById(playerId: string): Promise<InitializedPlayerRecord | null> {
    return this.playersById.get(playerId) ?? null;
  }

  async createInitializedPlayer(input: {
    openId: string;
    nickname: string;
    avatarUrl?: string;
  }): Promise<InitializedPlayerRecord> {
    const id = `player-${this.nextId++}`;
    const petId = `pet-${this.nextId++}`;
    const player: InitializedPlayerRecord = {
      id,
      platformOpenId: input.openId,
      nickname: input.nickname,
      avatarUrl: input.avatarUrl,
      arenaScore: 1000,
      currentPet: {
        id: petId,
        playerId: id,
        configId: "panda_rookie",
        name: "Bamboo Fist Panda",
        level: 1,
        exp: 0,
        hp: 120,
        attack: 18,
        defense: 8,
        speed: 10,
        critRate: 0.08
      },
      adventureState: {
        currentStageId: "bamboo_forest_1"
      },
      arenaState: {
        score: 1000,
        dailyChallengeCount: 0
      },
      taskProgressCount: taskConfigs.length
    };

    this.playersById.set(id, player);
    this.playerIdByOpenId.set(input.openId, id);
    return player;
  }

  async recordLoginProgress(playerId: string): Promise<InitializedPlayerRecord> {
    const player = this.playersById.get(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} was not found.`);
    }

    return player;
  }
}

async function createTestApp(): Promise<FastifyInstance> {
  return buildApp({
    playerRepository: new MemoryPlayerRepository()
  });
}

describe("player initialization routes", () => {
  test("dev login initializes a new player with the default gameplay state", async () => {
    const app = await createTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/auth/dev-login",
      payload: {
        devOpenId: "dev-open-id-1",
        nickname: "Tester"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      data: {
        token: "player-1",
        player: {
          id: "player-1",
          nickname: "Tester",
          avatarUrl: undefined,
          arenaScore: 1000
        },
        currentPet: {
          id: "pet-2",
          configId: "panda_rookie",
          name: "Bamboo Fist Panda",
          level: 1,
          exp: 0,
          stats: {
            hp: 120,
            attack: 18,
            defense: 8,
            speed: 10,
            critRate: 0.08
          }
        },
        adventure: {
          currentStageId: "bamboo_forest_1"
        },
        arena: {
          score: 1000,
          dailyChallengeCount: 0
        },
        taskProgressCount: taskConfigs.length
      }
    });

    await app.close();
  });

  test("dev login is idempotent for the same development open id", async () => {
    const app = await createTestApp();

    const first = await app.inject({
      method: "POST",
      url: "/auth/dev-login",
      payload: {
        devOpenId: "same-open-id",
        nickname: "First Name"
      }
    });
    const second = await app.inject({
      method: "POST",
      url: "/auth/dev-login",
      payload: {
        devOpenId: "same-open-id",
        nickname: "Second Name"
      }
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(second.json().data.player.id).toBe(first.json().data.player.id);
    expect(second.json().data.currentPet.id).toBe(first.json().data.currentPet.id);
    expect(second.json().data.player.nickname).toBe("First Name");

    await app.close();
  });

  test("current player lookup requires a bearer token", async () => {
    const app = await createTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/me"
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Bearer token is required."
      }
    });

    await app.close();
  });

  test("current pet lookup returns the initialized pet for the bearer token", async () => {
    const app = await createTestApp();

    const login = await app.inject({
      method: "POST",
      url: "/auth/dev-login",
      payload: {
        devOpenId: "pet-owner",
        nickname: "Pet Owner"
      }
    });

    const response = await app.inject({
      method: "GET",
      url: "/pet/current",
      headers: {
        authorization: `Bearer ${login.json().data.token}`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual({
      id: "pet-2",
      configId: "panda_rookie",
      name: "Bamboo Fist Panda",
      level: 1,
      exp: 0,
      stats: {
        hp: 120,
        attack: 18,
        defense: 8,
        speed: 10,
        critRate: 0.08
      }
    });

    await app.close();
  });
});

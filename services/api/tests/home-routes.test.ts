import { describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import type { HomeRepository, HomeStateRecord } from "../src/modules/home/home-repository.js";
import { unauthorized } from "../src/modules/player/player-service.js";
import type { PlayerRepository } from "../src/modules/player/player-repository.js";

class EmptyPlayerRepository implements PlayerRepository {
  async findPlayerByOpenId() {
    return null;
  }

  async findPlayerById() {
    return null;
  }

  async createInitializedPlayer(): Promise<never> {
    throw new Error("Not needed by home route tests.");
  }

  async recordLoginProgress(): Promise<never> {
    throw new Error("Not needed by home route tests.");
  }
}

class MemoryHomeRepository implements HomeRepository {
  constructor(private readonly homeState: HomeStateRecord | null) {}

  async findHomeStateByPlayerId(): Promise<HomeStateRecord | null> {
    return this.homeState;
  }
}

async function createTestApp(homeState: HomeStateRecord | null): Promise<FastifyInstance> {
  return buildApp({
    playerRepository: new EmptyPlayerRepository(),
    homeRepository: new MemoryHomeRepository(homeState),
    now: () => new Date("2026-06-26T08:30:00.000Z")
  });
}

describe("home route", () => {
  test("requires a bearer token", async () => {
    const app = await createTestApp(null);

    const response = await app.inject({
      method: "GET",
      url: "/home"
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual(unauthorized());

    await app.close();
  });

  test("returns player, pet, adventure, equipment, arena, and task summaries", async () => {
    const app = await createTestApp({
      player: {
        id: "player-1",
        nickname: "Tester",
        avatarUrl: "https://example.test/avatar.png",
        arenaScore: 1015,
        gold: 100,
        enhanceMaterial: 3
      },
      currentPet: {
        id: "pet-1",
        configId: "panda_rookie",
        name: "Bamboo Fist Panda",
        level: 2,
        exp: 15,
        bodyProfile: {
          heightScale: 0.96,
          build: "round",
          headRatio: 0.34,
          posture: "relaxed",
          tag: "圆润"
        },
        appearanceSlots: {
          head: "bamboo_leaf",
          facePattern: "sunny_eye",
          bodyPattern: "warm_stripe",
          back: null,
          handheld: null
        },
        hp: 134,
        attack: 21,
        defense: 10,
        speed: 11,
        critRate: 0.08
      },
      adventureState: {
        currentStageId: "bamboo_forest_1",
        lastClaimedAt: new Date("2026-06-26T06:00:00.000Z")
      },
      arenaState: {
        score: 1015,
        dailyChallengeCount: 2
      },
      equipment: [
        {
          id: "equipment-1",
          configId: "bamboo_staff_common",
          slot: "weapon",
          quality: "common",
          enhanceLevel: 1,
          isEquipped: true
        }
      ],
      tasks: [
        {
          taskId: "first_claim_adventure",
          currentCount: 1,
          claimed: false
        }
      ]
    });

    const response = await app.inject({
      method: "GET",
      url: "/home",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      data: {
        player: {
          id: "player-1",
          nickname: "Tester",
          avatarUrl: "https://example.test/avatar.png",
          arenaScore: 1015
        },
        currentPet: {
          id: "pet-1",
          configId: "panda_rookie",
          name: "Bamboo Fist Panda",
          level: 2,
          exp: 15,
          bodyProfile: {
            heightScale: 0.96,
            build: "round",
            headRatio: 0.34,
            posture: "relaxed",
            tag: "圆润"
          },
          appearanceSlots: {
            head: "bamboo_leaf",
            facePattern: "sunny_eye",
            bodyPattern: "warm_stripe",
            back: null,
            handheld: null
          },
          stats: {
            hp: 134,
            attack: 21,
            defense: 10,
            speed: 11,
            critRate: 0.08
          }
        },
        adventure: {
          currentStageId: "bamboo_forest_1",
          currentStageName: "竹林第一段",
          claimableRewards: [
            {
              type: "gold",
              amount: 100
            },
            {
              type: "exp",
              amount: 60
            }
          ],
          elapsedMinutes: 150
        },
        equipped: [
          {
            id: "equipment-1",
            configId: "bamboo_staff_common",
            name: "青竹长棍",
            slot: "weapon",
            quality: "common",
            enhanceLevel: 1,
            stats: {
              attack: 8
            }
          }
        ],
        arena: {
          score: 1015,
          dailyChallengeCount: 2
        },
        resources: {
          gold: 100,
          enhanceMaterial: 3
        },
        tasks: {
          unclaimedCount: 1
        }
      }
    });

    await app.close();
  });

  test("returns stable empty equipment and task summaries for a new player", async () => {
    const app = await createTestApp({
      player: {
        id: "player-2",
        nickname: "New Player",
        arenaScore: 1000,
        gold: 0,
        enhanceMaterial: 0
      },
      currentPet: {
        id: "pet-2",
        configId: "panda_rookie",
        name: "Bamboo Fist Panda",
        level: 1,
        exp: 0,
        bodyProfile: {
          heightScale: 1,
          build: "balanced",
          headRatio: 0.32,
          posture: "steady",
          tag: "稳健"
        },
        appearanceSlots: {
          head: null,
          facePattern: null,
          bodyPattern: null,
          back: null,
          handheld: null
        },
        hp: 120,
        attack: 18,
        defense: 8,
        speed: 10,
        critRate: 0.08
      },
      adventureState: {
        currentStageId: "bamboo_forest_1",
        lastClaimedAt: new Date("2026-06-26T08:30:00.000Z")
      },
      arenaState: {
        score: 1000,
        dailyChallengeCount: 0
      },
      equipment: [],
      tasks: []
    });

    const response = await app.inject({
      method: "GET",
      url: "/home",
      headers: {
        authorization: "Bearer player-2"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.equipped).toEqual([]);
    expect(response.json().data.tasks).toEqual({
      unclaimedCount: 0
    });
    expect(response.json().data.adventure.claimableRewards).toEqual([
      {
        type: "gold",
        amount: 0
      },
      {
        type: "exp",
        amount: 0
      }
    ]);

    await app.close();
  });
});

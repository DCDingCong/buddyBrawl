import { describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import type {
  AdventureClaimInput,
  AdventureRepository,
  AdventureStateRecord
} from "../src/modules/adventure/adventure-repository.js";
import type { HomeRepository } from "../src/modules/home/home-repository.js";
import type { PlayerRepository } from "../src/modules/player/player-repository.js";
import { unauthorized } from "../src/modules/player/player-service.js";

class EmptyPlayerRepository implements PlayerRepository {
  async findPlayerByOpenId() {
    return null;
  }

  async findPlayerById() {
    return null;
  }

  async createInitializedPlayer(): Promise<never> {
    throw new Error("Not needed by adventure route tests.");
  }

  async recordLoginProgress(): Promise<never> {
    throw new Error("Not needed by adventure route tests.");
  }
}

class EmptyHomeRepository implements HomeRepository {
  async findHomeStateByPlayerId() {
    return null;
  }
}

class MemoryAdventureRepository implements AdventureRepository {
  constructor(private state: AdventureStateRecord | null) {}

  async findAdventureStateByPlayerId(): Promise<AdventureStateRecord | null> {
    return this.state;
  }

  async claimRewards(input: AdventureClaimInput): Promise<AdventureStateRecord> {
    if (!this.state) {
      throw new Error("Missing state");
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
      adventureState: {
        ...this.state.adventureState,
        lastClaimedAt: input.claimedAt
      }
    };

    return this.state;
  }
}

async function createTestApp(state: AdventureStateRecord | null): Promise<FastifyInstance> {
  return buildApp({
    playerRepository: new EmptyPlayerRepository(),
    homeRepository: new EmptyHomeRepository(),
    adventureRepository: new MemoryAdventureRepository(state),
    now: () => new Date("2026-06-26T08:30:00.000Z")
  });
}

function createAdventureState(): AdventureStateRecord {
  return {
    player: {
      id: "player-1",
      gold: 10,
      enhanceMaterial: 0
    },
    pet: {
      id: "pet-1",
      ownerPlayerId: "player-1",
      name: "Bamboo Fist Panda",
      level: 1,
      exp: 15,
      hp: 120,
      attack: 18,
      defense: 8,
      speed: 10,
      critRate: 0.08,
      skills: ["basic_strike"]
    },
    adventureState: {
      currentStageId: "bamboo_forest_1",
      lastClaimedAt: new Date("2026-06-26T06:00:00.000Z")
    }
  };
}

describe("adventure routes", () => {
  test("status requires a bearer token", async () => {
    const app = await createTestApp(createAdventureState());

    const response = await app.inject({
      method: "GET",
      url: "/adventure/status"
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual(unauthorized());

    await app.close();
  });

  test("status returns server-calculated claimable idle rewards", async () => {
    const app = await createTestApp(createAdventureState());

    const response = await app.inject({
      method: "GET",
      url: "/adventure/status",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      data: {
        currentStageId: "bamboo_forest_1",
        currentStageName: "Bamboo Forest 1",
        elapsedMinutes: 150,
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
        stored: {
          gold: 10,
          petExp: 15,
          enhanceMaterial: 0
        }
      }
    });

    await app.close();
  });

  test("claim applies rewards and a second immediate claim returns zero rewards", async () => {
    const repository = new MemoryAdventureRepository(createAdventureState());
    const app = buildApp({
      playerRepository: new EmptyPlayerRepository(),
      homeRepository: new EmptyHomeRepository(),
      adventureRepository: repository,
      now: () => new Date("2026-06-26T08:30:00.000Z")
    });

    const first = await (
      await app
    ).inject({
      method: "POST",
      url: "/adventure/claim",
      headers: {
        authorization: "Bearer player-1"
      }
    });
    const second = await (
      await app
    ).inject({
      method: "POST",
      url: "/adventure/claim",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(first.statusCode).toBe(200);
    expect(first.json()).toEqual({
      ok: true,
      data: {
        rewards: [
          {
            type: "gold",
            amount: 100
          },
          {
            type: "exp",
            amount: 60
          }
        ],
        stored: {
          gold: 110,
          petExp: 75,
          enhanceMaterial: 0
        },
        currentStageId: "bamboo_forest_1",
        lastClaimedAt: "2026-06-26T08:30:00.000Z"
      }
    });
    expect(second.statusCode).toBe(200);
    expect(second.json().data.rewards).toEqual([
      {
        type: "gold",
        amount: 0
      },
      {
        type: "exp",
        amount: 0
      }
    ]);
    expect(second.json().data.stored).toEqual({
      gold: 110,
      petExp: 75,
      enhanceMaterial: 0
    });

    await (await app).close();
  });

  test("challenge runs an adventure boss battle with a deterministic seed", async () => {
    const app = await createTestApp(createAdventureState());

    const response = await app.inject({
      method: "POST",
      url: "/adventure/challenge",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.scene).toBe("adventure");
    expect(response.json().data.seed).toBe(202606260830);
    expect(response.json().data.attacker).toEqual({
      playerId: "player-1",
      petName: "Bamboo Fist Panda",
      level: 1,
      stats: {
        hp: 120,
        attack: 18,
        defense: 8,
        speed: 10,
        critRate: 0.08
      }
    });
    expect(response.json().data.defender.petName).toBe("Bamboo Forest Bruiser");
    expect(response.json().data.events.length).toBeGreaterThan(0);

    await app.close();
  });
});

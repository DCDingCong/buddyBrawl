import { describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import type { AdventureRepository } from "../src/modules/adventure/adventure-repository.js";
import type {
  EquipmentEnhanceInput,
  EquipmentEquipInput,
  EquipmentRepository,
  EquipmentStateRecord
} from "../src/modules/equipment/equipment-repository.js";
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
    throw new Error("Not needed by equipment route tests.");
  }

  async recordLoginProgress(): Promise<never> {
    throw new Error("Not needed by equipment route tests.");
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
    throw new Error("Not needed by equipment route tests.");
  }
}

class MemoryEquipmentRepository implements EquipmentRepository {
  constructor(private state: EquipmentStateRecord | null) {}

  async findEquipmentStateByPlayerId(): Promise<EquipmentStateRecord | null> {
    return this.state;
  }

  async equip(input: EquipmentEquipInput): Promise<EquipmentStateRecord> {
    if (!this.state) {
      throw new Error("Missing state");
    }

    const target = this.state.equipment.find((equipment) => equipment.id === input.equipmentId);
    if (!target) {
      throw new Error("Equipment not found");
    }

    this.state = {
      ...this.state,
      equipment: this.state.equipment.map((equipment) => ({
        ...equipment,
        isEquipped: equipment.id === input.equipmentId ? true : equipment.slot === target.slot ? false : equipment.isEquipped,
        equippedSlot: equipment.id === input.equipmentId ? equipment.slot : equipment.slot === target.slot ? null : equipment.equippedSlot
      }))
    };
    return this.state;
  }

  async enhance(input: EquipmentEnhanceInput): Promise<EquipmentStateRecord> {
    if (!this.state) {
      throw new Error("Missing state");
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        gold: this.state.player.gold - input.cost.gold,
        enhanceMaterial: this.state.player.enhanceMaterial - input.cost.enhanceMaterial
      },
      equipment: this.state.equipment.map((equipment) =>
        equipment.id === input.equipmentId
          ? {
              ...equipment,
              enhanceLevel: equipment.enhanceLevel + 1
            }
          : equipment
      )
    };
    return this.state;
  }
}

async function createTestApp(state: EquipmentStateRecord | null): Promise<FastifyInstance> {
  return buildApp({
    playerRepository: new EmptyPlayerRepository(),
    homeRepository: new EmptyHomeRepository(),
    adventureRepository: new EmptyAdventureRepository(),
    equipmentRepository: new MemoryEquipmentRepository(state)
  });
}

function createEquipmentState(): EquipmentStateRecord {
  return {
    player: {
      id: "player-1",
      gold: 100,
      enhanceMaterial: 3
    },
    equipment: [
      {
        id: "equipment-1",
        configId: "bamboo_staff_common",
        slot: "weapon",
        equippedSlot: null,
        quality: "common",
        enhanceLevel: 0,
        isEquipped: false
      },
      {
        id: "equipment-2",
        configId: "training_claws_common",
        slot: "weapon",
        equippedSlot: "weapon",
        quality: "common",
        enhanceLevel: 0,
        isEquipped: true
      }
    ]
  };
}

describe("equipment routes", () => {
  test("inventory requires a bearer token", async () => {
    const app = await createTestApp(createEquipmentState());

    const response = await app.inject({
      method: "GET",
      url: "/inventory/equipment"
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual(unauthorized());

    await app.close();
  });

  test("inventory returns equipment with config-derived stats", async () => {
    const app = await createTestApp(createEquipmentState());

    const response = await app.inject({
      method: "GET",
      url: "/inventory/equipment",
      headers: {
        authorization: "Bearer player-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.items).toEqual([
      {
        id: "equipment-1",
        configId: "bamboo_staff_common",
        name: "Bamboo Staff",
        slot: "weapon",
        quality: "common",
        enhanceLevel: 0,
        isEquipped: false,
        maxEnhanceLevel: 5,
        stats: {
          attack: 6
        }
      },
      {
        id: "equipment-2",
        configId: "training_claws_common",
        name: "Training Claws",
        slot: "weapon",
        quality: "common",
        enhanceLevel: 0,
        isEquipped: true,
        maxEnhanceLevel: 5,
        stats: {
          attack: 4,
          speed: 1
        }
      }
    ]);
    expect(response.json().data.resources).toEqual({
      gold: 100,
      enhanceMaterial: 3
    });

    await app.close();
  });

  test("equip replaces existing equipment in the same slot", async () => {
    const app = await createTestApp(createEquipmentState());

    const response = await app.inject({
      method: "POST",
      url: "/equipment/equip",
      headers: {
        authorization: "Bearer player-1"
      },
      payload: {
        equipmentId: "equipment-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.items.map((item: { id: string; isEquipped: boolean }) => [item.id, item.isEquipped])).toEqual([
      ["equipment-1", true],
      ["equipment-2", false]
    ]);

    await app.close();
  });

  test("enhance consumes resources and increases equipment level", async () => {
    const app = await createTestApp(createEquipmentState());

    const response = await app.inject({
      method: "POST",
      url: "/equipment/enhance",
      headers: {
        authorization: "Bearer player-1"
      },
      payload: {
        equipmentId: "equipment-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.resources).toEqual({
      gold: 80,
      enhanceMaterial: 2
    });
    expect(response.json().data.items[0]).toMatchObject({
      id: "equipment-1",
      enhanceLevel: 1,
      stats: {
        attack: 8
      }
    });

    await app.close();
  });

  test("enhance rejects insufficient materials without modifying equipment", async () => {
    const state = createEquipmentState();
    state.player.enhanceMaterial = 0;
    const app = await createTestApp(state);

    const response = await app.inject({
      method: "POST",
      url: "/equipment/enhance",
      headers: {
        authorization: "Bearer player-1"
      },
      payload: {
        equipmentId: "equipment-1"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      ok: false,
      error: {
        code: "INSUFFICIENT_RESOURCES",
        message: "Not enough resources to enhance this equipment."
      }
    });
    expect(state.equipment[0]?.enhanceLevel).toBe(0);

    await app.close();
  });
});

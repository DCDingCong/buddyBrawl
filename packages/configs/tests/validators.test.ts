import { describe, expect, it } from "vitest";
import { dropConfigs } from "../src/drops.js";
import { equipmentConfigs } from "../src/equipment.js";
import { levelConfigs } from "../src/levels.js";
import { petConfigs } from "../src/pets.js";
import { skillConfigs } from "../src/skills.js";
import { stageConfigs } from "../src/stages.js";
import { taskConfigs } from "../src/tasks.js";
import { validateConfigs, validateConfigSets } from "../src/validators.js";

const validConfigSets = {
  pets: petConfigs,
  levels: levelConfigs,
  equipment: equipmentConfigs,
  skills: skillConfigs,
  stages: stageConfigs,
  drops: dropConfigs,
  tasks: taskConfigs
};

describe("validateConfigs", () => {
  it("accepts the phase 1 seed configs", () => {
    const result = validateConfigs();

    expect(result).toEqual({
      ok: true,
      errors: []
    });
  });

  it("rejects duplicate ids", () => {
    const result = validateConfigSets({
      ...validConfigSets,
      skills: [skillConfigs[0]!, skillConfigs[0]!]
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("skill duplicate id: basic_strike");
  });

  it("rejects missing skill references", () => {
    const result = validateConfigSets({
      ...validConfigSets,
      pets: [{ ...petConfigs[0]!, defaultSkills: ["missing_skill"] }]
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("pet panda_rookie references missing skill missing_skill");
  });

  it("rejects invalid drop items", () => {
    const result = validateConfigSets({
      ...validConfigSets,
      drops: [
        {
          id: "bad_pool",
          items: [{ type: "equipment", amount: 0, weight: 0, configId: "missing_equipment" }]
        }
      ],
      stages: [{ ...stageConfigs[0]!, dropPoolId: "bad_pool" }]
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("drop pool bad_pool item amount must be positive");
    expect(result.errors).toContain("drop pool bad_pool item weight must be positive");
    expect(result.errors).toContain("drop pool bad_pool references missing equipment missing_equipment");
  });

  it("rejects invalid stats and level ordering", () => {
    const result = validateConfigSets({
      ...validConfigSets,
      pets: [{ ...petConfigs[0]!, baseStats: { ...petConfigs[0]!.baseStats, hp: 0, critRate: 2 } }],
      levels: [
        { level: 1, requiredExp: 100 },
        { level: 2, requiredExp: 50 }
      ]
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("pet panda_rookie.baseStats.hp must be a positive integer");
    expect(result.errors).toContain("pet panda_rookie.baseStats.critRate must be between 0 and 1");
    expect(result.errors).toContain("level 2.requiredExp must be monotonic");
  });

  it("rejects invalid skill cooldown rules", () => {
    const result = validateConfigSets({
      ...validConfigSets,
      skills: [{ ...skillConfigs[1]!, cooldownRounds: 0 }]
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("cooldown skill bamboo_combo.cooldownRounds must be positive");
  });

  it("rejects missing stage drop pools", () => {
    const result = validateConfigSets({
      ...validConfigSets,
      stages: [{ ...stageConfigs[0]!, dropPoolId: "missing_pool" }]
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("stage bamboo_forest_1 references missing drop pool missing_pool");
  });

  it("rejects empty drop pools and non-equipment config ids", () => {
    const emptyPoolResult = validateConfigSets({
      ...validConfigSets,
      drops: [{ id: "empty_pool", items: [] }],
      stages: [{ ...stageConfigs[0]!, dropPoolId: "empty_pool" }]
    });

    expect(emptyPoolResult.ok).toBe(false);
    expect(emptyPoolResult.errors).toContain("drop pool empty_pool must contain at least one item");

    const configIdResult = validateConfigSets({
      ...validConfigSets,
      drops: [
        {
          id: "bad_currency_pool",
          items: [{ type: "gold", amount: 1, weight: 1, configId: "not_allowed" }]
        }
      ],
      stages: [{ ...stageConfigs[0]!, dropPoolId: "bad_currency_pool" }]
    });

    expect(configIdResult.ok).toBe(false);
    expect(configIdResult.errors).toContain("drop pool bad_currency_pool non-equipment item must not include configId");
  });

  it("rejects invalid task rewards", () => {
    const result = validateConfigSets({
      ...validConfigSets,
      tasks: [{ ...taskConfigs[0]!, targetCount: 0, rewards: [{ type: "gold", amount: 0 }] }]
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("task first_claim_adventure.targetCount must be positive");
    expect(result.errors).toContain("task first_claim_adventure reward amount must be positive");
  });
});

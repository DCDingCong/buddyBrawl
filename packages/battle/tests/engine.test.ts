import { describe, expect, it } from "vitest";
import { simulateBattle } from "../src/engine.js";
import type { BattleInput } from "../src/types.js";

const baseInput: BattleInput = {
  scene: "arena",
  seed: 20260625,
  attacker: {
    id: "pet_attacker",
    ownerPlayerId: "player_1",
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
  defender: {
    id: "pet_defender",
    ownerPlayerId: "player_2",
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
  attackerEquipment: [],
  defenderEquipment: []
};

describe("simulateBattle", () => {
  it("returns deterministic output for the same seed and snapshots", () => {
    const first = simulateBattle(baseInput);
    const second = simulateBattle(baseInput);

    expect(second).toEqual(first);
  });

  it("produces a winner and battle events", () => {
    const result = simulateBattle(baseInput);

    expect(result.winner).toBe("attacker");
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.events[0]?.text).toContain("Bamboo Fist Panda");
  });

  it("triggers attacker techniques with event metadata and technique report text", () => {
    const result = simulateBattle({
      ...baseInput,
      seed: 1,
      maxRounds: 1,
      attackerTechniques: [
        {
          id: "bamboo_staff_swing",
          name: "竹棍敲一下",
          effectKind: "bonus_damage",
          effectValue: 7,
          triggerChance: 1,
          triggerTiming: "attack",
          reportTextTemplate: "{actor}抡起竹棍敲了{target}一下，额外造成 {value} 点伤害。"
        }
      ]
    });

    expect(result.events[0]).toEqual(
      expect.objectContaining({
        action: "technique_trigger",
        techniqueConfigId: "bamboo_staff_swing",
        techniqueName: "竹棍敲一下",
        techniqueEffectKind: "bonus_damage",
        damage: 29,
        text: "Bamboo Fist Panda抡起竹棍敲了Training Panda一下，额外造成 7 点伤害。"
      })
    );
  });

  it("triggers defender techniques to reduce incoming damage", () => {
    const result = simulateBattle({
      ...baseInput,
      seed: 1,
      maxRounds: 1,
      defenderTechniques: [
        {
          id: "bamboo_staff_block",
          name: "竹棍格挡",
          effectKind: "damage_reduction",
          effectValue: 5,
          triggerChance: 1,
          triggerTiming: "defense",
          reportTextTemplate: "{actor}横起竹棍挡住了{target}的攻势，少挨了 {value} 点伤害。"
        }
      ]
    });

    expect(result.events[0]).toEqual(
      expect.objectContaining({
        action: "technique_trigger",
        techniqueConfigId: "bamboo_staff_block",
        techniqueName: "竹棍格挡",
        techniqueEffectKind: "damage_reduction",
        damage: 17,
        text: "Training Panda横起竹棍挡住了Bamboo Fist Panda的攻势，少挨了 5 点伤害。"
      })
    );
  });
});

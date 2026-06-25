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
});

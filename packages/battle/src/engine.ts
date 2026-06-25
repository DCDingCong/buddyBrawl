import type { EquipmentSnapshot, StatBlock } from "@buddy-brawl/shared";
import { formatAttackText } from "./report.js";
import { createRng } from "./rng.js";
import type { BattleEvent, BattleInput, BattleOutput, BattleRuntimePet } from "./types.js";

function applyEquipmentStats(base: StatBlock, equipment: EquipmentSnapshot[]): StatBlock {
  return equipment.reduce<StatBlock>(
    (stats, item) => ({
      hp: stats.hp + (item.stats.hp ?? 0),
      attack: stats.attack + (item.stats.attack ?? 0),
      defense: stats.defense + (item.stats.defense ?? 0),
      speed: stats.speed + (item.stats.speed ?? 0),
      critRate: stats.critRate + (item.stats.critRate ?? 0)
    }),
    { ...base }
  );
}

function createRuntimePet(
  side: "attacker" | "defender",
  input: BattleInput,
  equipment: EquipmentSnapshot[]
): BattleRuntimePet {
  const snapshot = side === "attacker" ? input.attacker : input.defender;
  const stats = applyEquipmentStats(snapshot.stats, equipment);

  return {
    side,
    snapshot,
    stats,
    currentHp: stats.hp
  };
}

function calculateDamage(attacker: BattleRuntimePet, defender: BattleRuntimePet, isCritical: boolean): number {
  const baseDamage = Math.max(1, attacker.stats.attack - Math.floor(defender.stats.defense * 0.5));
  return isCritical ? Math.floor(baseDamage * 1.5) : baseDamage;
}

function act(
  round: number,
  actor: BattleRuntimePet,
  target: BattleRuntimePet,
  attacker: BattleRuntimePet,
  defender: BattleRuntimePet,
  rngValue: number
): BattleEvent {
  const isCritical = rngValue < actor.stats.critRate;
  const damage = calculateDamage(actor, target, isCritical);
  target.currentHp = Math.max(0, target.currentHp - damage);

  return {
    round,
    actor: actor.side,
    action: "basic_attack",
    damage,
    isCritical,
    attackerHp: attacker.currentHp,
    defenderHp: defender.currentHp,
    text: formatAttackText(actor.snapshot.name, target.snapshot.name, damage, isCritical)
  };
}

export function simulateBattle(input: BattleInput): BattleOutput {
  const rng = createRng(input.seed);
  const maxRounds = input.maxRounds ?? 20;
  const attacker = createRuntimePet("attacker", input, input.attackerEquipment);
  const defender = createRuntimePet("defender", input, input.defenderEquipment);
  const events: BattleEvent[] = [];

  const attackerFirst = attacker.stats.speed >= defender.stats.speed;

  for (let round = 1; round <= maxRounds; round += 1) {
    const first = attackerFirst ? attacker : defender;
    const second = attackerFirst ? defender : attacker;

    events.push(act(round, first, second, attacker, defender, rng.next()));
    if (second.currentHp <= 0) {
      break;
    }

    events.push(act(round, second, first, attacker, defender, rng.next()));
    if (first.currentHp <= 0) {
      break;
    }
  }

  const winner =
    attacker.currentHp === defender.currentHp
      ? "attacker"
      : attacker.currentHp > defender.currentHp
        ? "attacker"
        : "defender";

  return {
    scene: input.scene,
    winner,
    seed: input.seed,
    attackerFinalHp: attacker.currentHp,
    defenderFinalHp: defender.currentHp,
    events,
    rewards: []
  };
}

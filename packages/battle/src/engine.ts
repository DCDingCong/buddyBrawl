import type { BattleTechniqueConfig, EquipmentSnapshot, StatBlock } from "@buddy-brawl/shared";
import { formatAttackText, formatTechniqueText } from "./report.js";
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

function pickTriggeredTechnique(
  techniques: BattleTechniqueConfig[],
  timing: BattleTechniqueConfig["triggerTiming"],
  nextRandom: () => number
): BattleTechniqueConfig | undefined {
  for (const technique of techniques) {
    if (technique.triggerTiming !== timing) {
      continue;
    }
    if (nextRandom() < technique.triggerChance) {
      return technique;
    }
  }
  return undefined;
}

function act(
  round: number,
  actor: BattleRuntimePet,
  target: BattleRuntimePet,
  attacker: BattleRuntimePet,
  defender: BattleRuntimePet,
  rngValue: number,
  actorTechniques: BattleTechniqueConfig[],
  targetTechniques: BattleTechniqueConfig[],
  nextRandom: () => number
): BattleEvent {
  const isCritical = rngValue < actor.stats.critRate;
  const attackTechnique = pickTriggeredTechnique(actorTechniques, "attack", nextRandom);
  const defenseTechnique = attackTechnique ? undefined : pickTriggeredTechnique(targetTechniques, "defense", nextRandom);
  const triggeredTechnique = attackTechnique ?? defenseTechnique;
  const baseDamage = calculateDamage(actor, target, isCritical);
  const damage =
    attackTechnique?.effectKind === "bonus_damage"
      ? baseDamage + attackTechnique.effectValue
      : defenseTechnique?.effectKind === "damage_reduction"
        ? Math.max(1, baseDamage - defenseTechnique.effectValue)
        : baseDamage;
  target.currentHp = Math.max(0, target.currentHp - damage);
  const techniqueActor = defenseTechnique ? target : actor;
  const techniqueTarget = defenseTechnique ? actor : target;

  return {
    round,
    actor: actor.side,
    action: triggeredTechnique ? "technique_trigger" : "basic_attack",
    damage,
    isCritical,
    attackerHp: attacker.currentHp,
    defenderHp: defender.currentHp,
    text: triggeredTechnique
      ? formatTechniqueText(
          triggeredTechnique.reportTextTemplate,
          techniqueActor.snapshot.name,
          techniqueTarget.snapshot.name,
          triggeredTechnique.effectValue
        )
      : formatAttackText(actor.snapshot.name, target.snapshot.name, damage, isCritical),
    techniqueConfigId: triggeredTechnique?.id,
    techniqueName: triggeredTechnique?.name,
    techniqueEffectKind: triggeredTechnique?.effectKind
  };
}

export function simulateBattle(input: BattleInput): BattleOutput {
  const rng = createRng(input.seed);
  const maxRounds = input.maxRounds ?? 20;
  const attacker = createRuntimePet("attacker", input, input.attackerEquipment);
  const defender = createRuntimePet("defender", input, input.defenderEquipment);
  const attackerTechniques = input.attackerTechniques ?? [];
  const defenderTechniques = input.defenderTechniques ?? [];
  const events: BattleEvent[] = [];

  const attackerFirst = attacker.stats.speed >= defender.stats.speed;

  for (let round = 1; round <= maxRounds; round += 1) {
    const first = attackerFirst ? attacker : defender;
    const second = attackerFirst ? defender : attacker;

    events.push(
      act(
        round,
        first,
        second,
        attacker,
        defender,
        rng.next(),
        first.side === "attacker" ? attackerTechniques : defenderTechniques,
        second.side === "attacker" ? attackerTechniques : defenderTechniques,
        () => rng.next()
      )
    );
    if (second.currentHp <= 0) {
      break;
    }

    events.push(
      act(
        round,
        second,
        first,
        attacker,
        defender,
        rng.next(),
        second.side === "attacker" ? attackerTechniques : defenderTechniques,
        first.side === "attacker" ? attackerTechniques : defenderTechniques,
        () => rng.next()
      )
    );
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

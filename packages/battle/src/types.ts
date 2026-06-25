import type { BattleScene, EquipmentSnapshot, PetSnapshot, RewardItem, StatBlock } from "@buddy-brawl/shared";

export interface BattleInput {
  scene: BattleScene;
  seed: number;
  attacker: PetSnapshot;
  defender: PetSnapshot;
  attackerEquipment: EquipmentSnapshot[];
  defenderEquipment: EquipmentSnapshot[];
  maxRounds?: number;
}

export interface BattleRuntimePet {
  side: "attacker" | "defender";
  snapshot: PetSnapshot;
  stats: StatBlock;
  currentHp: number;
}

export interface BattleEvent {
  round: number;
  actor: "attacker" | "defender";
  action: string;
  damage: number;
  isCritical: boolean;
  attackerHp: number;
  defenderHp: number;
  text: string;
}

export interface BattleOutput {
  scene: BattleScene;
  winner: "attacker" | "defender";
  seed: number;
  attackerFinalHp: number;
  defenderFinalHp: number;
  events: BattleEvent[];
  rewards: RewardItem[];
}

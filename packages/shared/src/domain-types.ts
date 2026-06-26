export type EquipmentSlot = "weapon" | "head" | "body" | "accessory";

export type EquipmentQuality = "common" | "fine" | "rare" | "epic";

export type BattleScene = "adventure" | "arena";

export interface StatBlock {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
}

export interface PandaBodyProfile {
  heightScale: number;
  build: "slim" | "balanced" | "round";
  headRatio: number;
  posture: "steady" | "relaxed" | "brave";
  tag: string;
}

export interface AppearanceSlots {
  head: string | null;
  facePattern: string | null;
  bodyPattern: string | null;
  back: string | null;
  handheld: string | null;
}

export interface PetSnapshot {
  id: string;
  ownerPlayerId: string;
  name: string;
  level: number;
  stats: StatBlock;
  skills: string[];
}

export interface EquipmentSnapshot {
  id: string;
  configId: string;
  slot: EquipmentSlot;
  quality: EquipmentQuality;
  enhanceLevel: number;
  stats: Partial<StatBlock>;
}

export interface RewardItem {
  type: "gold" | "exp" | "enhanceMaterial" | "equipment";
  amount: number;
  configId?: string;
}

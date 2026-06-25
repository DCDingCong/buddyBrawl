import type { EquipmentQuality, EquipmentSlot, StatBlock } from "@buddy-brawl/shared";

export interface EquipmentConfig {
  id: string;
  name: string;
  slot: EquipmentSlot;
  quality: EquipmentQuality;
  baseStats: Partial<StatBlock>;
  enhanceGrowth: Partial<StatBlock>;
  maxEnhanceLevel: number;
}

export const equipmentConfigs: EquipmentConfig[] = [
  {
    id: "bamboo_staff_common",
    name: "Bamboo Staff",
    slot: "weapon",
    quality: "common",
    baseStats: { attack: 6 },
    enhanceGrowth: { attack: 2 },
    maxEnhanceLevel: 5
  },
  {
    id: "straw_hat_common",
    name: "Straw Hat",
    slot: "head",
    quality: "common",
    baseStats: { hp: 20, defense: 1 },
    enhanceGrowth: { hp: 8 },
    maxEnhanceLevel: 5
  }
];

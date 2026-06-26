import type { EquipmentQuality, EquipmentSlot, StatBlock } from "@buddy-brawl/shared";

export interface EquipmentConfig {
  id: string;
  name: string;
  slot: EquipmentSlot;
  quality: EquipmentQuality;
  baseStats: Partial<StatBlock>;
  enhanceGrowth: Partial<StatBlock>;
  maxEnhanceLevel: number;
  enhanceCost: {
    gold: number;
    requiredItems: Array<{
      itemConfigId: string;
      amount: number;
    }>;
    specialCurrency: Array<{
      currencyId: string;
      amount: number;
    }>;
    paidCurrency: Array<{
      currencyId: string;
      amount: number;
    }>;
  };
}

export const equipmentConfigs: EquipmentConfig[] = [
  {
    id: "bamboo_staff_common",
    name: "青竹长棍",
    slot: "weapon",
    quality: "common",
    baseStats: { attack: 6 },
    enhanceGrowth: { attack: 2 },
    maxEnhanceLevel: 5,
    enhanceCost: {
      gold: 20,
      requiredItems: [],
      specialCurrency: [],
      paidCurrency: []
    }
  },
  {
    id: "training_claws_common",
    name: "练习爪套",
    slot: "weapon",
    quality: "common",
    baseStats: { attack: 4, speed: 1 },
    enhanceGrowth: { attack: 1 },
    maxEnhanceLevel: 5,
    enhanceCost: {
      gold: 20,
      requiredItems: [],
      specialCurrency: [],
      paidCurrency: []
    }
  },
  {
    id: "straw_hat_common",
    name: "竹叶斗笠",
    slot: "head",
    quality: "common",
    baseStats: { hp: 20, defense: 1 },
    enhanceGrowth: { hp: 8 },
    maxEnhanceLevel: 5,
    enhanceCost: {
      gold: 20,
      requiredItems: [],
      specialCurrency: [],
      paidCurrency: []
    }
  }
];

import type { StatBlock } from "@buddy-brawl/shared";

export interface PetConfig {
  id: string;
  name: string;
  baseStats: StatBlock;
  growthPerLevel: StatBlock;
  defaultSkills: string[];
}

export const petConfigs: PetConfig[] = [
  {
    id: "panda_rookie",
    name: "Bamboo Fist Panda",
    baseStats: {
      hp: 120,
      attack: 18,
      defense: 8,
      speed: 10,
      critRate: 0.08
    },
    growthPerLevel: {
      hp: 14,
      attack: 3,
      defense: 2,
      speed: 1,
      critRate: 0
    },
    defaultSkills: ["basic_strike", "bamboo_combo"]
  }
];

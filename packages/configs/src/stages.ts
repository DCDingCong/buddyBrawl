import type { StatBlock } from "@buddy-brawl/shared";

export interface StageBossConfig {
  id: string;
  name: string;
  level: number;
  stats: StatBlock;
  skills: string[];
}

export interface StageConfig {
  id: string;
  name: string;
  order: number;
  goldPerHour: number;
  expPerHour: number;
  dropPoolId: string;
  boss: StageBossConfig;
}

export const stageConfigs: StageConfig[] = [
  {
    id: "bamboo_forest_1",
    name: "Bamboo Forest 1",
    order: 1,
    goldPerHour: 40,
    expPerHour: 24,
    dropPoolId: "starter_equipment",
    boss: {
      id: "bamboo_forest_bruiser",
      name: "Bamboo Forest Bruiser",
      level: 1,
      stats: {
        hp: 80,
        attack: 14,
        defense: 5,
        speed: 8,
        critRate: 0.04
      },
      skills: ["basic_strike"]
    }
  }
];

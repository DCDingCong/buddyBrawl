export interface LevelConfig {
  level: number;
  requiredExp: number;
}

export const levelConfigs: LevelConfig[] = [
  { level: 1, requiredExp: 0 },
  { level: 2, requiredExp: 60 },
  { level: 3, requiredExp: 150 },
  { level: 4, requiredExp: 300 },
  { level: 5, requiredExp: 520 }
];

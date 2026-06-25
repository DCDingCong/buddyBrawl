export interface TaskConfig {
  id: string;
  name: string;
  type: "login" | "claim_adventure" | "enhance_equipment" | "arena_challenge";
  targetCount: number;
  rewards: Array<{
    type: "gold" | "exp" | "enhanceMaterial";
    amount: number;
  }>;
}

export const taskConfigs: TaskConfig[] = [
  {
    id: "first_claim_adventure",
    name: "Claim adventure rewards once",
    type: "claim_adventure",
    targetCount: 1,
    rewards: [{ type: "gold", amount: 80 }]
  }
];

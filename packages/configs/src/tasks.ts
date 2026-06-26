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
    id: "daily_login",
    name: "Log in once",
    type: "login",
    targetCount: 1,
    rewards: [{ type: "gold", amount: 50 }]
  },
  {
    id: "first_claim_adventure",
    name: "Claim adventure rewards once",
    type: "claim_adventure",
    targetCount: 1,
    rewards: [{ type: "gold", amount: 80 }]
  },
  {
    id: "first_enhance_equipment",
    name: "Enhance equipment once",
    type: "enhance_equipment",
    targetCount: 1,
    rewards: [{ type: "enhanceMaterial", amount: 3 }]
  },
  {
    id: "first_arena_challenge",
    name: "Complete one arena challenge",
    type: "arena_challenge",
    targetCount: 1,
    rewards: [{ type: "gold", amount: 120 }]
  }
];

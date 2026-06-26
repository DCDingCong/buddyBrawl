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
    name: "每日进入游戏",
    type: "login",
    targetCount: 1,
    rewards: [{ type: "gold", amount: 50 }]
  },
  {
    id: "first_claim_adventure",
    name: "领取一次冒险收益",
    type: "claim_adventure",
    targetCount: 1,
    rewards: [{ type: "gold", amount: 80 }]
  },
  {
    id: "first_enhance_equipment",
    name: "强化一次装备",
    type: "enhance_equipment",
    targetCount: 1,
    rewards: [{ type: "enhanceMaterial", amount: 3 }]
  },
  {
    id: "first_arena_challenge",
    name: "完成一次竞技挑战",
    type: "arena_challenge",
    targetCount: 1,
    rewards: [{ type: "gold", amount: 120 }]
  }
];

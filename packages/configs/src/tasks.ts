export type TaskType =
  | "login"
  | "view_battle_report"
  | "complete_battle"
  | "pet_level"
  | "battle_count"
  | "claim_adventure"
  | "enhance_equipment";

export type TaskCategory = "daily" | "main";

export interface TaskConfig {
  id: string;
  name: string;
  type: TaskType;
  category: TaskCategory;
  targetCount: number;
  rewards: Array<{
    type: "gold" | "exp" | "enhanceMaterial";
    amount: number;
  }>;
}

export const taskConfigs: TaskConfig[] = [
  {
    id: "daily_login",
    name: "每日登录",
    type: "login",
    category: "daily",
    targetCount: 1,
    rewards: [{ type: "gold", amount: 50 }]
  },
  {
    id: "daily_view_battle_report",
    name: "查看战报",
    type: "view_battle_report",
    category: "daily",
    targetCount: 1,
    rewards: [{ type: "gold", amount: 60 }]
  },
  {
    id: "daily_complete_battle",
    name: "完成战斗",
    type: "complete_battle",
    category: "daily",
    targetCount: 1,
    rewards: [{ type: "gold", amount: 100 }]
  },
  {
    id: "main_reach_level_2",
    name: "熊猫升到 2 级",
    type: "pet_level",
    category: "main",
    targetCount: 2,
    rewards: [{ type: "gold", amount: 150 }]
  },
  {
    id: "main_complete_3_battles",
    name: "完成 3 场战斗",
    type: "battle_count",
    category: "main",
    targetCount: 3,
    rewards: [{ type: "gold", amount: 200 }]
  }
];

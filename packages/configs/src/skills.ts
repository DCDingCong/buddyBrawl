export type SkillTrigger = "basic" | "cooldown";

export interface SkillConfig {
  id: string;
  name: string;
  trigger: SkillTrigger;
  cooldownRounds: number;
  damageMultiplier: number;
  reportTemplate: string;
}

export const skillConfigs: SkillConfig[] = [
  {
    id: "basic_strike",
    name: "普通攻击",
    trigger: "basic",
    cooldownRounds: 0,
    damageMultiplier: 1,
    reportTemplate: "{actor}攻击{target}，造成 {damage} 点伤害。"
  },
  {
    id: "bamboo_combo",
    name: "竹影连击",
    trigger: "cooldown",
    cooldownRounds: 3,
    damageMultiplier: 1.6,
    reportTemplate: "{actor}使出竹影连击，造成 {damage} 点伤害。"
  }
];

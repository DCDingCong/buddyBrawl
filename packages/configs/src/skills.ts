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
    name: "Strike",
    trigger: "basic",
    cooldownRounds: 0,
    damageMultiplier: 1,
    reportTemplate: "{actor} strikes {target} for {damage} damage."
  },
  {
    id: "bamboo_combo",
    name: "Bamboo Combo",
    trigger: "cooldown",
    cooldownRounds: 3,
    damageMultiplier: 1.6,
    reportTemplate: "{actor} uses Bamboo Combo for {damage} damage."
  }
];

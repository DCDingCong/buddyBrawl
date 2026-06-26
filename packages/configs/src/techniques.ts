import type { BattleTechniqueConfig, EquipmentTechniqueRule } from "@buddy-brawl/shared";

export type TechniqueConfig = BattleTechniqueConfig;

export const techniqueConfigs: TechniqueConfig[] = [
  {
    id: "bamboo_staff_swing",
    name: "竹棍敲一下",
    effectKind: "bonus_damage",
    effectValue: 4,
    triggerChance: 0.35,
    triggerTiming: "attack",
    reportTextTemplate: "{actor}抡起竹棍敲了{target}一下，额外造成 {value} 点伤害。"
  },
  {
    id: "bamboo_staff_block",
    name: "竹棍格挡",
    effectKind: "damage_reduction",
    effectValue: 3,
    triggerChance: 0.25,
    triggerTiming: "defense",
    reportTextTemplate: "{actor}横起竹棍挡住了{target}的攻势，少挨了 {value} 点伤害。"
  }
];

export const equipmentTechniqueRules: EquipmentTechniqueRule[] = [
  {
    id: "bamboo_staff_common_lv1_basic_swing",
    equipmentConfigId: "bamboo_staff_common",
    requiredEnhanceLevel: 1,
    techniqueConfigId: "bamboo_staff_swing"
  },
  {
    id: "bamboo_staff_common_lv2_block",
    equipmentConfigId: "bamboo_staff_common",
    requiredEnhanceLevel: 2,
    techniqueConfigId: "bamboo_staff_block"
  }
];

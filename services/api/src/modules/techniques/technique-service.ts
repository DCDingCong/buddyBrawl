import { equipmentTechniqueRules, techniqueConfigs } from "@buddy-brawl/configs";
import type { BattleTechniqueConfig, EquipmentSnapshot } from "@buddy-brawl/shared";

export function resolveTechniquesForEquipment(equipment: EquipmentSnapshot[]): BattleTechniqueConfig[] {
  const techniqueById = new Map(techniqueConfigs.map((technique) => [technique.id, technique]));
  const resolved: BattleTechniqueConfig[] = [];
  const seen = new Set<string>();

  for (const item of equipment) {
    const unlockedRules = equipmentTechniqueRules.filter(
      (rule) => rule.equipmentConfigId === item.configId && rule.requiredEnhanceLevel <= item.enhanceLevel
    );

    for (const rule of unlockedRules) {
      if (seen.has(rule.techniqueConfigId)) {
        continue;
      }
      const technique = techniqueById.get(rule.techniqueConfigId);
      if (technique) {
        resolved.push(technique);
        seen.add(rule.techniqueConfigId);
      }
    }
  }

  return resolved;
}

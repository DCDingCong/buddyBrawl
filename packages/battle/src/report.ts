export function formatAttackText(actorName: string, targetName: string, damage: number, isCritical: boolean): string {
  const criticalText = isCritical ? "，触发暴击" : "";
  return `${actorName}攻击${targetName}${criticalText}，造成 ${damage} 点伤害。`;
}

export function formatTechniqueText(template: string, actorName: string, targetName: string, value: number): string {
  return template.replaceAll("{actor}", actorName).replaceAll("{target}", targetName).replaceAll("{value}", String(value));
}

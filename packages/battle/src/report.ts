export function formatAttackText(actorName: string, targetName: string, damage: number, isCritical: boolean): string {
  const criticalText = isCritical ? ", critical" : "";
  return `${actorName} attacks ${targetName}${criticalText} for ${damage} damage.`;
}

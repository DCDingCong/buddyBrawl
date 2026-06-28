export function rewardName(type: string): string {
  const names: Record<string, string> = {
    gold: "竹币",
    exp: "经验",
    enhanceMaterial: "熟练材料",
    equipment: "武器"
  };
  return names[type] || type;
}

export function slotName(slot: string): string {
  const names: Record<string, string> = {
    weapon: "武器",
    head: "头部",
    body: "身体",
    accessory: "挂件"
  };
  return names[slot] || slot;
}

export function qualityName(quality: string): string {
  const names: Record<string, string> = {
    common: "普通",
    fine: "精良",
    rare: "稀有",
    epic: "史诗"
  };
  return names[quality] || quality;
}

export function winnerText(winner: string): string {
  return winner === "attacker" ? "胜利" : "惜败";
}

export function battleEventText(event: { actor: string; damage: number; isCritical?: boolean }): string {
  const actorText = event.actor === "attacker" ? "胖达" : "对手";
  const criticalText = event.isCritical ? "，重拳命中" : "";
  return `${actorText}造成 ${event.damage} 点伤害${criticalText}`;
}

export function bodyBuildName(build: string): string {
  const names: Record<string, string> = {
    round: "圆润体型",
    balanced: "均衡体型",
    sturdy: "结实体型"
  };
  return names[build] || "独特体型";
}

export function postureName(posture: string): string {
  const names: Record<string, string> = {
    relaxed: "从容姿态",
    brave: "勇敢姿态",
    steady: "稳健姿态"
  };
  return names[posture] || "自然姿态";
}

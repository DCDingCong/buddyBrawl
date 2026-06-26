import type { DropPoolConfig } from "./drops.js";
import { dropConfigs } from "./drops.js";
import type { EquipmentConfig } from "./equipment.js";
import { equipmentConfigs } from "./equipment.js";
import type { LevelConfig } from "./levels.js";
import { levelConfigs } from "./levels.js";
import type { PetConfig } from "./pets.js";
import { petConfigs } from "./pets.js";
import type { SkillConfig } from "./skills.js";
import { skillConfigs } from "./skills.js";
import type { StageConfig } from "./stages.js";
import { stageConfigs } from "./stages.js";
import type { TaskConfig } from "./tasks.js";
import { taskConfigs } from "./tasks.js";

export interface ConfigValidationResult {
  ok: boolean;
  errors: string[];
}

export interface ConfigSets {
  pets: PetConfig[];
  levels: LevelConfig[];
  equipment: EquipmentConfig[];
  skills: SkillConfig[];
  stages: StageConfig[];
  drops: DropPoolConfig[];
  tasks: TaskConfig[];
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeFinite(value: number): boolean {
  return isFiniteNumber(value) && value >= 0;
}

function findDuplicateIds(items: Array<{ id: string }>, label: string, errors: string[]): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      errors.push(`${label} duplicate id: ${item.id}`);
    }
    seen.add(item.id);
  }
}

function validateStatBlock(prefix: string, stats: { hp: number; attack: number; defense: number; speed: number; critRate: number }, errors: string[]): void {
  if (!isPositiveInteger(stats.hp)) errors.push(`${prefix}.hp must be a positive integer`);
  if (!isNonNegativeFinite(stats.attack)) errors.push(`${prefix}.attack must be non-negative`);
  if (!isNonNegativeFinite(stats.defense)) errors.push(`${prefix}.defense must be non-negative`);
  if (!isNonNegativeFinite(stats.speed)) errors.push(`${prefix}.speed must be non-negative`);
  if (!isFiniteNumber(stats.critRate) || stats.critRate < 0 || stats.critRate > 1) {
    errors.push(`${prefix}.critRate must be between 0 and 1`);
  }
}

export function validateConfigSets(configs: ConfigSets): ConfigValidationResult {
  const errors: string[] = [];

  findDuplicateIds(configs.pets, "pet", errors);
  findDuplicateIds(configs.equipment, "equipment", errors);
  findDuplicateIds(configs.skills, "skill", errors);
  findDuplicateIds(configs.stages, "stage", errors);
  findDuplicateIds(configs.drops, "dropPool", errors);
  findDuplicateIds(configs.tasks, "task", errors);

  const equipmentIds = new Set(configs.equipment.map((item) => item.id));
  const skillIds = new Set(configs.skills.map((item) => item.id));
  const dropPoolIds = new Set(configs.drops.map((item) => item.id));

  for (const pet of configs.pets) {
    validateStatBlock(`pet ${pet.id}.baseStats`, pet.baseStats, errors);
    validateStatBlock(`pet ${pet.id}.growthPerLevel`, pet.growthPerLevel, errors);
    for (const skillId of pet.defaultSkills) {
      if (!skillIds.has(skillId)) {
        errors.push(`pet ${pet.id} references missing skill ${skillId}`);
      }
    }
  }

  let previousExp = -1;
  const seenLevels = new Set<number>();
  for (const level of configs.levels) {
    if (!isPositiveInteger(level.level)) errors.push(`level ${level.level} must be a positive integer`);
    if (seenLevels.has(level.level)) errors.push(`level duplicate value: ${level.level}`);
    seenLevels.add(level.level);
    if (!Number.isInteger(level.requiredExp) || level.requiredExp < 0) {
      errors.push(`level ${level.level}.requiredExp must be a non-negative integer`);
    }
    if (level.requiredExp < previousExp) {
      errors.push(`level ${level.level}.requiredExp must be monotonic`);
    }
    previousExp = level.requiredExp;
  }
  if (!seenLevels.has(1)) errors.push("levels must include level 1");

  for (const skill of configs.skills) {
    if (!isFiniteNumber(skill.damageMultiplier) || skill.damageMultiplier <= 0) {
      errors.push(`skill ${skill.id}.damageMultiplier must be positive`);
    }
    if (skill.trigger === "basic" && skill.cooldownRounds !== 0) {
      errors.push(`basic skill ${skill.id}.cooldownRounds must be 0`);
    }
    if (skill.trigger === "cooldown" && !isPositiveInteger(skill.cooldownRounds)) {
      errors.push(`cooldown skill ${skill.id}.cooldownRounds must be positive`);
    }
  }

  const equipmentSlots = new Set(["weapon", "head", "body", "accessory"]);
  const equipmentQualities = new Set(["common", "fine", "rare", "epic"]);
  for (const equipment of configs.equipment) {
    if (!equipmentSlots.has(equipment.slot)) {
      errors.push(`equipment ${equipment.id}.slot must be valid`);
    }
    if (!equipmentQualities.has(equipment.quality)) {
      errors.push(`equipment ${equipment.id}.quality must be valid`);
    }
    if (!isPositiveInteger(equipment.maxEnhanceLevel)) {
      errors.push(`equipment ${equipment.id}.maxEnhanceLevel must be positive`);
    }
    if (!Number.isInteger(equipment.enhanceCost.gold) || equipment.enhanceCost.gold < 0) {
      errors.push(`equipment ${equipment.id}.enhanceCost.gold must be a non-negative integer`);
    }
    if (!Number.isInteger(equipment.enhanceCost.enhanceMaterial) || equipment.enhanceCost.enhanceMaterial < 0) {
      errors.push(`equipment ${equipment.id}.enhanceCost.enhanceMaterial must be a non-negative integer`);
    }
  }

  const seenStageOrders = new Set<number>();
  for (const stage of configs.stages) {
    if (!isPositiveInteger(stage.order)) errors.push(`stage ${stage.id}.order must be positive`);
    if (seenStageOrders.has(stage.order)) errors.push(`stage duplicate order: ${stage.order}`);
    seenStageOrders.add(stage.order);
    if (!isNonNegativeFinite(stage.goldPerHour)) errors.push(`stage ${stage.id}.goldPerHour must be non-negative`);
    if (!isNonNegativeFinite(stage.expPerHour)) errors.push(`stage ${stage.id}.expPerHour must be non-negative`);
    if (!dropPoolIds.has(stage.dropPoolId)) {
      errors.push(`stage ${stage.id} references missing drop pool ${stage.dropPoolId}`);
    }
    validateStatBlock(`stage ${stage.id}.boss.stats`, stage.boss.stats, errors);
    for (const skillId of stage.boss.skills) {
      if (!skillIds.has(skillId)) {
        errors.push(`stage ${stage.id}.boss references missing skill ${skillId}`);
      }
    }
  }

  for (const pool of configs.drops) {
    if (pool.items.length === 0) {
      errors.push(`drop pool ${pool.id} must contain at least one item`);
    }

    let totalWeight = 0;
    for (const item of pool.items) {
      if (!isPositiveInteger(item.amount)) errors.push(`drop pool ${pool.id} item amount must be positive`);
      if (!isFiniteNumber(item.weight) || item.weight <= 0) errors.push(`drop pool ${pool.id} item weight must be positive`);
      totalWeight += item.weight;

      if (item.type === "equipment") {
        if (!item.configId || !equipmentIds.has(item.configId)) {
          errors.push(`drop pool ${pool.id} references missing equipment ${item.configId ?? "empty"}`);
        }
      } else if (item.configId) {
        errors.push(`drop pool ${pool.id} non-equipment item must not include configId`);
      }
    }

    if (!isFiniteNumber(totalWeight) || totalWeight <= 0) {
      errors.push(`drop pool ${pool.id} total weight must be positive`);
    }
  }

  for (const task of configs.tasks) {
    if (!isPositiveInteger(task.targetCount)) errors.push(`task ${task.id}.targetCount must be positive`);
    if (task.rewards.length === 0) errors.push(`task ${task.id} must include rewards`);
    for (const reward of task.rewards) {
      if (!isPositiveInteger(reward.amount)) errors.push(`task ${task.id} reward amount must be positive`);
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function validateConfigs(): ConfigValidationResult {
  return validateConfigSets({
    pets: petConfigs,
    levels: levelConfigs,
    equipment: equipmentConfigs,
    skills: skillConfigs,
    stages: stageConfigs,
    drops: dropConfigs,
    tasks: taskConfigs
  });
}

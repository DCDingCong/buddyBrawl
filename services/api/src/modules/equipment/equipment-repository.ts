import type { EquipmentQuality, EquipmentSlot } from "@buddy-brawl/shared";

export interface EquipmentRecord {
  id: string;
  configId: string;
  slot: EquipmentSlot;
  equippedSlot?: string | null;
  quality: EquipmentQuality;
  enhanceLevel: number;
  isEquipped: boolean;
}

export interface EquipmentStateRecord {
  player: {
    id: string;
    gold: number;
    enhanceMaterial: number;
  };
  equipment: EquipmentRecord[];
}

export interface EquipmentEquipInput {
  playerId: string;
  equipmentId: string;
}

export interface EquipmentEnhanceInput {
  playerId: string;
  equipmentId: string;
  cost: {
    gold: number;
    requiredItems: Array<{
      itemConfigId: string;
      amount: number;
    }>;
    specialCurrency: Array<{
      currencyId: string;
      amount: number;
    }>;
    paidCurrency: Array<{
      currencyId: string;
      amount: number;
    }>;
  };
}

export interface EquipmentRepository {
  findEquipmentStateByPlayerId(playerId: string): Promise<EquipmentStateRecord | null>;
  equip(input: EquipmentEquipInput): Promise<EquipmentStateRecord>;
  enhance(input: EquipmentEnhanceInput): Promise<EquipmentStateRecord>;
}

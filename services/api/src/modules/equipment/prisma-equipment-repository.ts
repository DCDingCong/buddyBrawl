import type { PrismaClient } from "@prisma/client";
import type { EquipmentQuality, EquipmentSlot } from "@buddy-brawl/shared";
import type {
  EquipmentEnhanceInput,
  EquipmentEquipInput,
  EquipmentRepository,
  EquipmentStateRecord
} from "./equipment-repository.js";
import { incrementTaskProgress } from "../tasks/prisma-task-progress.js";

export function createPrismaEquipmentRepository(prisma: PrismaClient): EquipmentRepository {
  return {
    async findEquipmentStateByPlayerId(playerId: string): Promise<EquipmentStateRecord | null> {
      return readEquipmentState(prisma, playerId);
    },

    async equip(input: EquipmentEquipInput): Promise<EquipmentStateRecord> {
      await prisma.$transaction(async (tx) => {
        const target = await tx.equipmentInstance.findFirstOrThrow({
          where: {
            id: input.equipmentId,
            playerId: input.playerId
          }
        });

        await tx.equipmentInstance.updateMany({
          where: {
            playerId: input.playerId,
            slot: target.slot,
            isEquipped: true
          },
          data: {
            isEquipped: false,
            equippedSlot: null
          }
        });

        await tx.equipmentInstance.update({
          where: {
            id: input.equipmentId
          },
          data: {
            isEquipped: true,
            equippedSlot: target.slot
          }
        });
      });

      const state = await readEquipmentState(prisma, input.playerId);
      if (!state) {
        throw new Error(`Player ${input.playerId} was not found after equip.`);
      }
      return state;
    },

    async enhance(input: EquipmentEnhanceInput): Promise<EquipmentStateRecord> {
      await prisma.$transaction(async (tx) => {
        await tx.player.update({
          where: {
            id: input.playerId
          },
          data: {
            gold: {
              decrement: input.cost.gold
            },
            enhanceMaterial: {
              decrement: input.cost.enhanceMaterial
            }
          }
        });

        await tx.equipmentInstance.update({
          where: {
            id: input.equipmentId
          },
          data: {
            enhanceLevel: {
              increment: 1
            }
          }
        });

        await incrementTaskProgress(tx, input.playerId, "enhance_equipment", new Date());
      });

      const state = await readEquipmentState(prisma, input.playerId);
      if (!state) {
        throw new Error(`Player ${input.playerId} was not found after enhance.`);
      }
      return state;
    }
  };
}

async function readEquipmentState(prisma: PrismaClient, playerId: string): Promise<EquipmentStateRecord | null> {
  const player = await prisma.player.findUnique({
    where: {
      id: playerId
    },
    include: {
      equipmentInstances: {
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!player) {
    return null;
  }

  return {
    player: {
      id: player.id,
      gold: player.gold,
      enhanceMaterial: player.enhanceMaterial
    },
    equipment: player.equipmentInstances.map((equipment) => ({
      id: equipment.id,
      configId: equipment.configId,
      slot: equipment.slot as EquipmentSlot,
      equippedSlot: equipment.equippedSlot,
      quality: equipment.quality as EquipmentQuality,
      enhanceLevel: equipment.enhanceLevel,
      isEquipped: equipment.isEquipped
    }))
  };
}

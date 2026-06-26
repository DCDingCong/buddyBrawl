import type { Prisma, PrismaClient } from "@prisma/client";
import type { HomeRepository, HomeStateRecord } from "./home-repository.js";
import type { EquipmentQuality, EquipmentSlot } from "@buddy-brawl/shared";

const homePlayerInclude = {
  currentPet: true,
  adventureState: true,
  arenaState: true,
  equipmentInstances: {
    where: {
      isEquipped: true
    }
  },
  taskProgress: true
} satisfies Prisma.PlayerInclude;

type PrismaHomePlayer = Prisma.PlayerGetPayload<{
  include: typeof homePlayerInclude;
}>;

export function createPrismaHomeRepository(prisma: PrismaClient): HomeRepository {
  return {
    async findHomeStateByPlayerId(playerId: string): Promise<HomeStateRecord | null> {
      const player = await prisma.player.findUnique({
        where: {
          id: playerId
        },
        include: homePlayerInclude
      });

      return player ? toHomeStateRecord(player) : null;
    }
  };
}

function toHomeStateRecord(player: PrismaHomePlayer): HomeStateRecord {
  if (!player.currentPet || !player.adventureState || !player.arenaState) {
    throw new Error(`Player ${player.id} is missing initialized gameplay state.`);
  }

  return {
    player: {
      id: player.id,
      nickname: player.nickname,
      avatarUrl: player.avatarUrl,
      arenaScore: player.arenaScore
    },
    currentPet: {
      id: player.currentPet.id,
      configId: player.currentPet.configId,
      name: player.currentPet.name,
      level: player.currentPet.level,
      exp: player.currentPet.exp,
      hp: player.currentPet.hp,
      attack: player.currentPet.attack,
      defense: player.currentPet.defense,
      speed: player.currentPet.speed,
      critRate: player.currentPet.critRate
    },
    adventureState: {
      currentStageId: player.adventureState.currentStageId,
      lastClaimedAt: player.adventureState.lastClaimedAt
    },
    arenaState: {
      score: player.arenaState.score,
      dailyChallengeCount: player.arenaState.dailyChallengeCount
    },
    equipment: player.equipmentInstances.map((equipment) => ({
      id: equipment.id,
      configId: equipment.configId,
      slot: equipment.slot as EquipmentSlot,
      quality: equipment.quality as EquipmentQuality,
      enhanceLevel: equipment.enhanceLevel,
      isEquipped: equipment.isEquipped
    })),
    tasks: player.taskProgress.map((progress) => ({
      taskId: progress.taskId,
      currentCount: progress.currentCount,
      claimed: progress.claimed
    }))
  };
}

import type { Prisma, PrismaClient } from "@prisma/client";
import type { HomeRepository, HomeStateRecord } from "./home-repository.js";
import type { EquipmentQuality, EquipmentSlot, PatrolEventView, RewardItem } from "@buddy-brawl/shared";

const homePlayerInclude = {
  currentPet: true,
  adventureState: true,
  arenaState: true,
  equipmentInstances: {
    where: {
      isEquipped: true
    }
  },
  taskProgress: true,
  patrolEvents: {
    orderBy: {
      happenedAt: "desc"
    },
    take: 5
  }
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
      arenaScore: player.arenaScore,
      gold: player.gold,
      enhanceMaterial: player.enhanceMaterial
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
      critRate: player.currentPet.critRate,
      bodyProfile: player.currentPet.bodyProfile as unknown as HomeStateRecord["currentPet"]["bodyProfile"],
      appearanceSlots: player.currentPet.appearanceSlots as unknown as HomeStateRecord["currentPet"]["appearanceSlots"]
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
    })),
    patrolEvents: player.patrolEvents.map(toPatrolEventView)
  };
}

function toPatrolEventView(event: {
  id: string;
  kind: string;
  title: string;
  text: string;
  rewards: Prisma.JsonValue;
  happenedAt: Date;
}): PatrolEventView {
  return {
    id: event.id,
    kind: event.kind as PatrolEventView["kind"],
    title: event.title,
    text: event.text,
    rewards: event.rewards as unknown as RewardItem[],
    happenedAt: event.happenedAt.toISOString()
  };
}

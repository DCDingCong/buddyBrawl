import type { Prisma, PrismaClient } from "@prisma/client";
import type { PatrolEventView, RewardItem } from "@buddy-brawl/shared";
import type { PatrolRepository, PatrolSettleInput, PatrolStateRecord } from "./patrol-repository.js";

const patrolPlayerInclude = {
  currentPet: true,
  adventureState: true,
  patrolState: true,
  patrolEvents: {
    orderBy: {
      happenedAt: "desc"
    },
    take: 5
  }
} satisfies Prisma.PlayerInclude;

type PrismaPatrolPlayer = Prisma.PlayerGetPayload<{
  include: typeof patrolPlayerInclude;
}>;

export function createPrismaPatrolRepository(prisma: PrismaClient): PatrolRepository {
  return {
    async findPatrolStateByPlayerId(playerId: string): Promise<PatrolStateRecord | null> {
      const player = await prisma.player.findUnique({
        where: {
          id: playerId
        },
        include: patrolPlayerInclude
      });

      return player ? toPatrolStateRecord(player) : null;
    },

    async settle(input: PatrolSettleInput): Promise<PatrolStateRecord> {
      const gold = input.rewards.find((reward) => reward.type === "gold")?.amount ?? 0;
      const exp = input.rewards.find((reward) => reward.type === "exp")?.amount ?? 0;

      const player = await prisma.$transaction(async (tx) => {
        const current = await tx.player.findUniqueOrThrow({
          where: {
            id: input.playerId
          },
          include: patrolPlayerInclude
        });
        if (!current.currentPet || !current.patrolState) {
          throw new Error(`Player ${input.playerId} is missing initialized patrol state.`);
        }

        await tx.player.update({
          where: {
            id: input.playerId
          },
          data: {
            gold: {
              increment: gold
            }
          }
        });

        await tx.pet.update({
          where: {
            id: current.currentPet.id
          },
          data: {
            exp: {
              increment: exp
            }
          }
        });

        await tx.patrolState.update({
          where: {
            playerId: input.playerId
          },
          data: {
            lastSettledAt: input.settledAt
          }
        });

        if (input.events.length > 0) {
          await tx.patrolEvent.createMany({
            data: input.events.map((event) => ({
              playerId: input.playerId,
              kind: event.kind,
              title: event.title,
              text: event.text,
              rewards: event.rewards as unknown as Prisma.InputJsonValue,
              happenedAt: new Date(event.happenedAt)
            }))
          });
        }

        return tx.player.findUniqueOrThrow({
          where: {
            id: input.playerId
          },
          include: patrolPlayerInclude
        });
      });

      return toPatrolStateRecord(player);
    }
  };
}

function toPatrolStateRecord(player: PrismaPatrolPlayer): PatrolStateRecord {
  if (!player.currentPet || !player.adventureState || !player.patrolState) {
    throw new Error(`Player ${player.id} is missing initialized patrol state.`);
  }

  return {
    player: {
      id: player.id,
      gold: player.gold
    },
    pet: {
      id: player.currentPet.id,
      exp: player.currentPet.exp
    },
    adventureState: {
      currentStageId: player.adventureState.currentStageId
    },
    patrolState: {
      lastSettledAt: player.patrolState.lastSettledAt,
      maxRewardMinutes: player.patrolState.maxRewardMinutes
    },
    recentEvents: player.patrolEvents.map(toPatrolEventView)
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

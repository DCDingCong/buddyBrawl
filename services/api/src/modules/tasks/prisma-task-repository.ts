import { taskConfigs } from "@buddy-brawl/configs";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { TaskClaimInput, TaskRepository, TaskStateRecord } from "./task-repository.js";

const taskPlayerInclude = {
  currentPet: true,
  taskProgress: true
} satisfies Prisma.PlayerInclude;

type PrismaTaskPlayer = Prisma.PlayerGetPayload<{
  include: typeof taskPlayerInclude;
}>;

export function createPrismaTaskRepository(prisma: PrismaClient): TaskRepository {
  return {
    async findTaskStateByPlayerId(playerId: string): Promise<TaskStateRecord | null> {
      const player = await prisma.player.findUnique({
        where: {
          id: playerId
        },
        include: taskPlayerInclude
      });

      return player ? toTaskStateRecord(player) : null;
    },

    async claimTask(input: TaskClaimInput): Promise<TaskStateRecord> {
      const config = taskConfigs.find((taskConfig) => taskConfig.id === input.taskId);
      if (!config) {
        throw new Error(`Task config ${input.taskId} was not found.`);
      }

      const gold = input.rewards.find((reward) => reward.type === "gold")?.amount ?? 0;
      const exp = input.rewards.find((reward) => reward.type === "exp")?.amount ?? 0;
      const enhanceMaterial = input.rewards.find((reward) => reward.type === "enhanceMaterial")?.amount ?? 0;

      const player = await prisma.$transaction(async (tx) => {
        const current = await tx.player.findUniqueOrThrow({
          where: {
            id: input.playerId
          },
          include: taskPlayerInclude
        });
        if (!current.currentPet) {
          throw new Error(`Player ${input.playerId} is missing initialized pet state.`);
        }

        const progress = current.taskProgress.find((taskProgress) => taskProgress.taskId === input.taskId);
        if (!progress || progress.claimed || progress.currentCount < config.targetCount) {
          throw new Error(`Task ${input.taskId} is not claimable for player ${input.playerId}.`);
        }

        await tx.player.update({
          where: {
            id: input.playerId
          },
          data: {
            gold: {
              increment: gold
            },
            enhanceMaterial: {
              increment: enhanceMaterial
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

        await tx.taskProgress.update({
          where: {
            playerId_taskId: {
              playerId: input.playerId,
              taskId: input.taskId
            }
          },
          data: {
            claimed: true
          }
        });

        await tx.rewardLog.upsert({
          where: {
            source_sourceId_playerId: {
              source: "task_claim",
              sourceId: input.taskId,
              playerId: input.playerId
            }
          },
          update: {},
          create: {
            playerId: input.playerId,
            source: "task_claim",
            sourceId: input.taskId,
            rewards: input.rewards as unknown as Prisma.InputJsonValue
          }
        });

        return tx.player.findUniqueOrThrow({
          where: {
            id: input.playerId
          },
          include: taskPlayerInclude
        });
      });

      return toTaskStateRecord(player);
    }
  };
}

function toTaskStateRecord(player: PrismaTaskPlayer): TaskStateRecord {
  if (!player.currentPet) {
    throw new Error(`Player ${player.id} is missing initialized pet state.`);
  }

  return {
    player: {
      id: player.id,
      gold: player.gold,
      enhanceMaterial: player.enhanceMaterial
    },
    pet: {
      id: player.currentPet.id,
      exp: player.currentPet.exp
    },
    progress: player.taskProgress.map((progress) => ({
      taskId: progress.taskId,
      currentCount: progress.currentCount,
      claimed: progress.claimed
    }))
  };
}

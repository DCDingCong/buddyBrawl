import { taskConfigs } from "@buddy-brawl/configs";
import type { TaskType } from "@buddy-brawl/configs";
import type { Prisma } from "@prisma/client";

export async function incrementTaskProgress(
  tx: Prisma.TransactionClient,
  playerId: string,
  taskType: TaskType,
  progressedAt: Date
): Promise<void> {
  const tasks = taskConfigs.filter((taskConfig) => taskConfig.type === taskType);

  for (const task of tasks) {
    await tx.taskProgress.upsert({
      where: {
        playerId_taskId: {
          playerId,
          taskId: task.id
        }
      },
      update: {
        currentCount: {
          increment: 1
        },
        lastProgressAt: progressedAt
      },
      create: {
        playerId,
        taskId: task.id,
        currentCount: 1,
        lastProgressAt: progressedAt
      }
    });
  }
}

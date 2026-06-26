import { taskConfigs } from "@buddy-brawl/configs";
import type {
  ApiErrorResponse,
  ApiResponse,
  TaskClaimResponse,
  TasksSummaryResponse,
  TasksResponse,
  TaskView
} from "@buddy-brawl/shared";
import type { TaskProgressRecord, TaskRepository, TaskStateRecord } from "./task-repository.js";
import { notFound } from "../player/player-service.js";

export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async listTasks(playerId: string): Promise<ApiResponse<TasksResponse> | ApiErrorResponse> {
    const state = await this.taskRepository.findTaskStateByPlayerId(playerId);
    if (!state) {
      return notFound("Task state was not found.");
    }

    return {
      ok: true,
      data: {
        tasks: toTaskViews(state)
      }
    };
  }

  async getSummary(playerId: string): Promise<ApiResponse<TasksSummaryResponse> | ApiErrorResponse> {
    const state = await this.taskRepository.findTaskStateByPlayerId(playerId);
    if (!state) {
      return notFound("Task state was not found.");
    }

    const tasks = toTaskViews(state);
    return {
      ok: true,
      data: {
        daily: tasks.filter((task) => task.category === "daily"),
        main: tasks.filter((task) => task.category === "main")
      }
    };
  }

  async claimTask(
    playerId: string,
    taskId: string | undefined
  ): Promise<ApiResponse<TaskClaimResponse> | ApiErrorResponse> {
    if (!taskId) {
      return badRequest("INVALID_TASK", "taskId is required.");
    }

    const config = taskConfigs.find((taskConfig) => taskConfig.id === taskId);
    if (!config) {
      return notFound("Task was not found.");
    }

    const state = await this.taskRepository.findTaskStateByPlayerId(playerId);
    if (!state) {
      return notFound("Task state was not found.");
    }

    const task = toTaskView(
      state.progress.find((progress) => progress.taskId === taskId),
      config
    );
    if (!task.claimable) {
      return badRequest("TASK_NOT_CLAIMABLE", "Task rewards are not claimable.");
    }

    const updatedState = await this.taskRepository.claimTask({
      playerId,
      taskId,
      rewards: config.rewards
    });
    const updatedTask = toTaskViews(updatedState).find((taskView) => taskView.taskId === taskId);
    if (!updatedTask) {
      throw new Error(`Claimed task ${taskId} was not found in updated task state.`);
    }

    return {
      ok: true,
      data: {
        task: updatedTask,
        resources: {
          gold: updatedState.player.gold,
          enhanceMaterial: updatedState.player.enhanceMaterial,
          petExp: updatedState.pet.exp
        }
      }
    };
  }
}

function toTaskViews(state: TaskStateRecord): TaskView[] {
  return taskConfigs.map((config) =>
    toTaskView(
      state.progress.find((progress) => progress.taskId === config.id),
      config
    )
  );
}

function toTaskView(progress: TaskProgressRecord | undefined, config: (typeof taskConfigs)[number]): TaskView {
  const currentCount = progress?.currentCount ?? 0;
  const claimed = progress?.claimed ?? false;
  return {
    taskId: config.id,
    name: config.name,
    type: config.type,
    category: config.category,
    currentCount,
    targetCount: config.targetCount,
    claimed,
    claimable: !claimed && currentCount >= config.targetCount,
    rewards: config.rewards
  };
}

function badRequest(code: string, message: string): ApiErrorResponse {
  return {
    ok: false,
    error: {
      code,
      message
    }
  };
}

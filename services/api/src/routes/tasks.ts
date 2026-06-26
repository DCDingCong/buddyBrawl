import type { FastifyInstance } from "fastify";
import type { TaskService } from "../modules/tasks/task-service.js";
import { getBearerToken, unauthorized } from "../modules/player/player-service.js";

export async function registerTaskRoutes(app: FastifyInstance, taskService: TaskService): Promise<void> {
  app.get("/tasks", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await taskService.listTasks(playerId);
    if (!result.ok) {
      reply.code(404);
    }

    return result;
  });

  app.get("/tasks/summary", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await taskService.getSummary(playerId);
    if (!result.ok) {
      reply.code(404);
    }

    return result;
  });

  app.post<{ Params: { taskId: string } }>("/tasks/:taskId/claim", async (request, reply) => {
    const playerId = getBearerToken(request.headers.authorization);
    if (!playerId) {
      reply.code(401);
      return unauthorized();
    }

    const result = await taskService.claimTask(playerId, request.params.taskId);
    if (!result.ok) {
      reply.code(result.error.code === "TASK_NOT_CLAIMABLE" || result.error.code === "INVALID_TASK" ? 400 : 404);
    }

    return result;
  });
}

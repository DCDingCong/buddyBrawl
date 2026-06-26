import cors from "@fastify/cors";
import Fastify from "fastify";
import { validateConfigs } from "@buddy-brawl/configs";
import type { AdventureRepository } from "./modules/adventure/adventure-repository.js";
import { createPrismaAdventureRepository } from "./modules/adventure/prisma-adventure-repository.js";
import { AdventureService } from "./modules/adventure/adventure-service.js";
import type { ArenaRepository } from "./modules/arena/arena-repository.js";
import { createPrismaArenaRepository } from "./modules/arena/prisma-arena-repository.js";
import { ArenaService } from "./modules/arena/arena-service.js";
import type { EquipmentRepository } from "./modules/equipment/equipment-repository.js";
import { createPrismaEquipmentRepository } from "./modules/equipment/prisma-equipment-repository.js";
import { EquipmentService } from "./modules/equipment/equipment-service.js";
import type { HomeRepository } from "./modules/home/home-repository.js";
import { createPrismaHomeRepository } from "./modules/home/prisma-home-repository.js";
import { HomeService } from "./modules/home/home-service.js";
import type { LeaderboardRepository } from "./modules/leaderboard/leaderboard-repository.js";
import { createPrismaLeaderboardRepository } from "./modules/leaderboard/prisma-leaderboard-repository.js";
import { LeaderboardService } from "./modules/leaderboard/leaderboard-service.js";
import type { PlayerRepository } from "./modules/player/player-repository.js";
import { createPrismaPlayerRepository } from "./modules/player/prisma-player-repository.js";
import { PlayerService } from "./modules/player/player-service.js";
import type { TaskRepository } from "./modules/tasks/task-repository.js";
import { createPrismaTaskRepository } from "./modules/tasks/prisma-task-repository.js";
import { TaskService } from "./modules/tasks/task-service.js";
import { getPrisma } from "./db/prisma.js";
import { registerAdventureRoutes } from "./routes/adventure.js";
import { registerArenaRoutes } from "./routes/arena.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerBattleRoutes } from "./routes/battles.js";
import { registerEquipmentRoutes } from "./routes/equipment.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerHomeRoutes } from "./routes/home.js";
import { registerLeaderboardRoutes } from "./routes/leaderboard.js";
import { registerPlayerRoutes } from "./routes/player.js";
import { registerTaskRoutes } from "./routes/tasks.js";

export interface BuildAppOptions {
  playerRepository?: PlayerRepository;
  homeRepository?: HomeRepository;
  adventureRepository?: AdventureRepository;
  equipmentRepository?: EquipmentRepository;
  arenaRepository?: ArenaRepository;
  leaderboardRepository?: LeaderboardRepository;
  taskRepository?: TaskRepository;
  now?: () => Date;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: true
  });

  const configValidation = validateConfigs();
  if (!configValidation.ok) {
    throw new Error(`Config validation failed: ${configValidation.errors.join("; ")}`);
  }

  const prisma = getPrisma();
  const playerRepository = options.playerRepository ?? createPrismaPlayerRepository(prisma);
  const homeRepository = options.homeRepository ?? createPrismaHomeRepository(prisma);
  const adventureRepository = options.adventureRepository ?? createPrismaAdventureRepository(prisma);
  const equipmentRepository = options.equipmentRepository ?? createPrismaEquipmentRepository(prisma);
  const arenaRepository = options.arenaRepository ?? createPrismaArenaRepository(prisma);
  const leaderboardRepository = options.leaderboardRepository ?? createPrismaLeaderboardRepository(prisma);
  const taskRepository = options.taskRepository ?? createPrismaTaskRepository(prisma);
  const playerService = new PlayerService(playerRepository);
  const homeService = new HomeService(homeRepository, {
    now: options.now
  });
  const adventureService = new AdventureService(adventureRepository, {
    now: options.now
  });
  const equipmentService = new EquipmentService(equipmentRepository);
  const arenaService = new ArenaService(arenaRepository, {
    now: options.now
  });
  const leaderboardService = new LeaderboardService(leaderboardRepository);
  const taskService = new TaskService(taskRepository);

  await registerHealthRoutes(app);
  await registerAuthRoutes(app, playerService);
  await registerPlayerRoutes(app, playerService);
  await registerHomeRoutes(app, homeService);
  await registerAdventureRoutes(app, adventureService);
  await registerEquipmentRoutes(app, equipmentService);
  await registerArenaRoutes(app, arenaService);
  await registerBattleRoutes(app, arenaService);
  await registerLeaderboardRoutes(app, leaderboardService);
  await registerTaskRoutes(app, taskService);

  return app;
}

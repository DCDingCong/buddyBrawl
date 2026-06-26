import type { Prisma, PrismaClient } from "@prisma/client";
import { equipmentConfigs, petConfigs, stageConfigs, taskConfigs } from "@buddy-brawl/configs";
import type { AppearanceSlots, PandaBodyProfile } from "@buddy-brawl/shared";
import type {
  CreateInitializedPlayerInput,
  InitializedPlayerRecord,
  PlayerRepository
} from "./player-repository.js";
import { incrementTaskProgress } from "../tasks/prisma-task-progress.js";

const initializedPlayerInclude = {
  currentPet: true,
  adventureState: true,
  arenaState: true,
  taskProgress: true
} satisfies Prisma.PlayerInclude;

type PrismaInitializedPlayer = Prisma.PlayerGetPayload<{
  include: typeof initializedPlayerInclude;
}>;

export function createPrismaPlayerRepository(prisma: PrismaClient): PlayerRepository {
  return {
    async findPlayerByOpenId(openId: string): Promise<InitializedPlayerRecord | null> {
      const player = await prisma.player.findUnique({
        where: {
          platformOpenId: openId
        },
        include: initializedPlayerInclude
      });

      return player ? toInitializedPlayerRecord(player) : null;
    },

    async findPlayerById(playerId: string): Promise<InitializedPlayerRecord | null> {
      const player = await prisma.player.findUnique({
        where: {
          id: playerId
        },
        include: initializedPlayerInclude
      });

      return player ? toInitializedPlayerRecord(player) : null;
    },

    async createInitializedPlayer(input: CreateInitializedPlayerInput): Promise<InitializedPlayerRecord> {
      const defaultPet = petConfigs[0];
      const defaultStage = stageConfigs[0];
      if (!defaultPet || !defaultStage) {
        throw new Error("Default pet and stage configs are required to initialize a player.");
      }

      const player = await prisma.$transaction(async (tx) => {
        const createdPlayer = await tx.player.create({
          data: {
            platformOpenId: input.openId,
            nickname: input.nickname,
            avatarUrl: input.avatarUrl,
            gold: 100,
            enhanceMaterial: 3
          }
        });

        const createdPet = await tx.pet.create({
          data: {
            playerId: createdPlayer.id,
            configId: defaultPet.id,
            name: defaultPet.name,
            hp: defaultPet.baseStats.hp,
            attack: defaultPet.baseStats.attack,
            defense: defaultPet.baseStats.defense,
            speed: defaultPet.baseStats.speed,
            critRate: defaultPet.baseStats.critRate,
            bodyProfile: createDefaultBodyProfile(input.openId) as unknown as Prisma.InputJsonValue,
            appearanceSlots: createDefaultAppearanceSlots() as unknown as Prisma.InputJsonValue
          }
        });

        await tx.player.update({
          where: {
            id: createdPlayer.id
          },
          data: {
            currentPetId: createdPet.id
          }
        });

        await tx.adventureState.create({
          data: {
            playerId: createdPlayer.id,
            currentStageId: defaultStage.id
          }
        });

        await tx.arenaState.create({
          data: {
            playerId: createdPlayer.id,
            score: createdPlayer.arenaScore
          }
        });

        const starterEquipment = equipmentConfigs.slice(0, 2);
        if (starterEquipment.length > 0) {
          await tx.equipmentInstance.createMany({
            data: starterEquipment.map((equipment) => ({
              playerId: createdPlayer.id,
              configId: equipment.id,
              slot: equipment.slot,
              quality: equipment.quality
            }))
          });
        }

        if (taskConfigs.length > 0) {
          await tx.taskProgress.createMany({
            data: taskConfigs.map((taskConfig) => ({
              playerId: createdPlayer.id,
              taskId: taskConfig.id
            }))
          });
        }

        return tx.player.findUniqueOrThrow({
          where: {
            id: createdPlayer.id
          },
          include: initializedPlayerInclude
        });
      });

      return toInitializedPlayerRecord(player);
    },

    async recordLoginProgress(playerId: string, loggedInAt: Date): Promise<InitializedPlayerRecord> {
      const player = await prisma.$transaction(async (tx) => {
        await incrementTaskProgress(tx, playerId, "login", loggedInAt);

        return tx.player.findUniqueOrThrow({
          where: {
            id: playerId
          },
          include: initializedPlayerInclude
        });
      });

      return toInitializedPlayerRecord(player);
    }
  };
}

function toInitializedPlayerRecord(player: PrismaInitializedPlayer): InitializedPlayerRecord {
  if (!player.currentPet || !player.adventureState || !player.arenaState) {
    throw new Error(`Player ${player.id} is missing initialized gameplay state.`);
  }

  return {
    id: player.id,
    platformOpenId: player.platformOpenId,
    nickname: player.nickname,
    avatarUrl: player.avatarUrl,
    arenaScore: player.arenaScore,
    currentPet: {
      id: player.currentPet.id,
      playerId: player.currentPet.playerId,
      configId: player.currentPet.configId,
      name: player.currentPet.name,
      level: player.currentPet.level,
      exp: player.currentPet.exp,
      hp: player.currentPet.hp,
      attack: player.currentPet.attack,
      defense: player.currentPet.defense,
      speed: player.currentPet.speed,
      critRate: player.currentPet.critRate,
      bodyProfile: player.currentPet.bodyProfile as unknown as PandaBodyProfile,
      appearanceSlots: player.currentPet.appearanceSlots as unknown as AppearanceSlots
    },
    adventureState: {
      currentStageId: player.adventureState.currentStageId
    },
    arenaState: {
      score: player.arenaState.score,
      dailyChallengeCount: player.arenaState.dailyChallengeCount
    },
    taskProgressCount: player.taskProgress.length
  };
}

function createDefaultBodyProfile(seedText: string): PandaBodyProfile {
  const seed = Array.from(seedText).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const builds: PandaBodyProfile["build"][] = ["slim", "balanced", "round"];
  const postures: PandaBodyProfile["posture"][] = ["steady", "relaxed", "brave"];
  const build = builds[seed % builds.length]!;
  const posture = postures[seed % postures.length]!;
  const tagByBuild: Record<PandaBodyProfile["build"], string> = {
    slim: "灵巧",
    balanced: "稳健",
    round: "圆润"
  };

  return {
    heightScale: Number((0.94 + (seed % 13) / 100).toFixed(2)),
    build,
    headRatio: Number((0.31 + (seed % 5) / 100).toFixed(2)),
    posture,
    tag: tagByBuild[build]
  };
}

function createDefaultAppearanceSlots(): AppearanceSlots {
  return {
    head: "bamboo_leaf",
    facePattern: "sunny_eye",
    bodyPattern: "warm_stripe",
    back: null,
    handheld: null
  };
}

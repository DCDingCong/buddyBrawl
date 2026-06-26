import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  AdventureClaimInput,
  AdventureRepository,
  AdventureStateRecord
} from "./adventure-repository.js";
import { incrementTaskProgress } from "../tasks/prisma-task-progress.js";

const adventurePlayerInclude = {
  currentPet: true,
  adventureState: true
} satisfies Prisma.PlayerInclude;

type PrismaAdventurePlayer = Prisma.PlayerGetPayload<{
  include: typeof adventurePlayerInclude;
}>;

export function createPrismaAdventureRepository(prisma: PrismaClient): AdventureRepository {
  return {
    async findAdventureStateByPlayerId(playerId: string): Promise<AdventureStateRecord | null> {
      const player = await prisma.player.findUnique({
        where: {
          id: playerId
        },
        include: adventurePlayerInclude
      });

      return player ? toAdventureStateRecord(player) : null;
    },

    async claimRewards(input: AdventureClaimInput): Promise<AdventureStateRecord> {
      const gold = input.rewards.find((reward) => reward.type === "gold")?.amount ?? 0;
      const exp = input.rewards.find((reward) => reward.type === "exp")?.amount ?? 0;
      const enhanceMaterial = input.rewards.find((reward) => reward.type === "enhanceMaterial")?.amount ?? 0;

      const player = await prisma.$transaction(async (tx) => {
        const current = await tx.player.findUniqueOrThrow({
          where: {
            id: input.playerId
          },
          include: adventurePlayerInclude
        });
        if (!current.currentPet || !current.adventureState) {
          throw new Error(`Player ${input.playerId} is missing initialized adventure state.`);
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

        await tx.adventureState.update({
          where: {
            playerId: input.playerId
          },
          data: {
            lastClaimedAt: input.claimedAt
          }
        });

        await incrementTaskProgress(tx, input.playerId, "claim_adventure", input.claimedAt);

        await tx.rewardLog.upsert({
          where: {
            source_sourceId_playerId: {
              source: "adventure_claim",
              sourceId: input.sourceId,
              playerId: input.playerId
            }
          },
          update: {},
          create: {
            playerId: input.playerId,
            source: "adventure_claim",
            sourceId: input.sourceId,
            rewards: input.rewards as unknown as Prisma.InputJsonValue
          }
        });

        return tx.player.findUniqueOrThrow({
          where: {
            id: input.playerId
          },
          include: adventurePlayerInclude
        });
      });

      return toAdventureStateRecord(player);
    }
  };
}

function toAdventureStateRecord(player: PrismaAdventurePlayer): AdventureStateRecord {
  if (!player.currentPet || !player.adventureState) {
    throw new Error(`Player ${player.id} is missing initialized adventure state.`);
  }

  return {
    player: {
      id: player.id,
      gold: player.gold,
      enhanceMaterial: player.enhanceMaterial
    },
    pet: {
      id: player.currentPet.id,
      ownerPlayerId: player.id,
      name: player.currentPet.name,
      level: player.currentPet.level,
      exp: player.currentPet.exp,
      hp: player.currentPet.hp,
      attack: player.currentPet.attack,
      defense: player.currentPet.defense,
      speed: player.currentPet.speed,
      critRate: player.currentPet.critRate,
      skills: ["basic_strike"]
    },
    adventureState: {
      currentStageId: player.adventureState.currentStageId,
      lastClaimedAt: player.adventureState.lastClaimedAt
    }
  };
}

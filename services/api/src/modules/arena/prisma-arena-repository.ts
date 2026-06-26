import type { Prisma, PrismaClient } from "@prisma/client";
import { equipmentConfigs } from "@buddy-brawl/configs";
import type { BattleEventView, EquipmentSnapshot, PetSnapshot, RewardItem, StatBlock } from "@buddy-brawl/shared";
import type {
  ArenaBattleRecord,
  ArenaChallengeInput,
  ArenaPlayerRecord,
  ArenaRepository,
  ArenaStateRecord
} from "./arena-repository.js";
import { incrementTaskProgress } from "../tasks/prisma-task-progress.js";

const arenaPlayerInclude = {
  currentPet: true,
  arenaState: true,
  equipmentInstances: {
    where: {
      isEquipped: true
    }
  }
} satisfies Prisma.PlayerInclude;

type PrismaArenaPlayer = Prisma.PlayerGetPayload<{
  include: typeof arenaPlayerInclude;
}>;

export function createPrismaArenaRepository(prisma: PrismaClient): ArenaRepository {
  return {
    async findOpponents(playerId: string): Promise<ArenaPlayerRecord[]> {
      const players = await prisma.player.findMany({
        where: {
          id: {
            not: playerId
          },
          currentPetId: {
            not: null
          }
        },
        include: arenaPlayerInclude,
        orderBy: [
          {
            arenaScore: "desc"
          },
          {
            createdAt: "asc"
          }
        ],
        take: 10
      });

      return players.map(toArenaPlayerRecord);
    },

    async findChallengeState(attackerPlayerId: string, defenderPlayerId: string): Promise<ArenaStateRecord | null> {
      const players = await prisma.player.findMany({
        where: {
          id: {
            in: [attackerPlayerId, defenderPlayerId]
          }
        },
        include: arenaPlayerInclude
      });

      if (players.length !== 2) {
        return null;
      }

      return {
        players: players.map(toArenaPlayerRecord),
        battleRecords: []
      };
    },

    async saveChallenge(input: ArenaChallengeInput): Promise<ArenaBattleRecord> {
      const record = await prisma.$transaction(async (tx) => {
        await tx.player.update({
          where: {
            id: input.attackerPlayerId
          },
          data: {
            arenaScore: {
              increment: input.attackerScoreDelta
            },
            arenaState: {
              update: {
                score: {
                  increment: input.attackerScoreDelta
                },
                dailyChallengeCount: {
                  increment: 1
                }
              }
            }
          }
        });

        await tx.player.update({
          where: {
            id: input.defenderPlayerId
          },
          data: {
            arenaScore: {
              increment: input.defenderScoreDelta
            },
            arenaState: {
              update: {
                score: {
                  increment: input.defenderScoreDelta
                }
              }
            }
          }
        });

        await incrementTaskProgress(tx, input.attackerPlayerId, "complete_battle", new Date());

        return tx.battleRecord.create({
          data: {
            scene: "arena",
            seed: input.seed,
            attackerPlayerId: input.attackerPlayerId,
            defenderPlayerId: input.defenderPlayerId,
            winnerSide: input.winnerSide,
            attackerSnapshot: input.attackerSnapshot as unknown as Prisma.InputJsonValue,
            defenderSnapshot: input.defenderSnapshot as unknown as Prisma.InputJsonValue,
            events: input.events as unknown as Prisma.InputJsonValue,
            rewards: input.rewards as unknown as Prisma.InputJsonValue
          }
        });
      });

      return toArenaBattleRecord(record);
    },

    async findRecentBattles(playerId: string): Promise<ArenaBattleRecord[]> {
      const records = await prisma.battleRecord.findMany({
        where: {
          OR: [
            {
              attackerPlayerId: playerId
            },
            {
              defenderPlayerId: playerId
            }
          ]
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 20
      });

      return records.map(toArenaBattleRecord);
    },

    async findBattleForPlayer(playerId: string, battleId: string): Promise<ArenaBattleRecord | null> {
      const record = await prisma.battleRecord.findFirst({
        where: {
          id: battleId,
          OR: [
            {
              attackerPlayerId: playerId
            },
            {
              defenderPlayerId: playerId
            }
          ]
        }
      });

      return record ? toArenaBattleRecord(record) : null;
    },

    async markBattleViewed(playerId: string, battleId: string, viewedAt: Date): Promise<void> {
      await prisma.$transaction(async (tx) => {
        await tx.battleReportView.upsert({
          where: {
            playerId_battleRecordId: {
              playerId,
              battleRecordId: battleId
            }
          },
          update: {
            viewedAt
          },
          create: {
            playerId,
            battleRecordId: battleId,
            viewedAt
          }
        });

        await incrementTaskProgress(tx, playerId, "view_battle_report", viewedAt);
      });
    }
  };
}

function toArenaPlayerRecord(player: PrismaArenaPlayer): ArenaPlayerRecord {
  if (!player.currentPet || !player.arenaState) {
    throw new Error(`Player ${player.id} is missing initialized arena state.`);
  }

  return {
    id: player.id,
    nickname: player.nickname,
    arenaScore: player.arenaScore,
    arenaState: {
      score: player.arenaState.score,
      dailyChallengeCount: player.arenaState.dailyChallengeCount
    },
    currentPet: {
      id: player.currentPet.id,
      ownerPlayerId: player.id,
      name: player.currentPet.name,
      level: player.currentPet.level,
      stats: {
        hp: player.currentPet.hp,
        attack: player.currentPet.attack,
        defense: player.currentPet.defense,
        speed: player.currentPet.speed,
        critRate: player.currentPet.critRate
      },
      skills: ["basic_strike"]
    },
    equipment: player.equipmentInstances.map(toEquipmentSnapshot)
  };
}

function toEquipmentSnapshot(equipment: PrismaArenaPlayer["equipmentInstances"][number]): EquipmentSnapshot {
  const config = equipmentConfigs.find((equipmentConfig) => equipmentConfig.id === equipment.configId);
  if (!config) {
    throw new Error(`Equipment config ${equipment.configId} was not found.`);
  }

  return {
    id: equipment.id,
    configId: equipment.configId,
    slot: config.slot,
    quality: config.quality,
    enhanceLevel: equipment.enhanceLevel,
    stats: calculateEquipmentStats(config.baseStats, config.enhanceGrowth, equipment.enhanceLevel)
  };
}

function calculateEquipmentStats(
  baseStats: Partial<StatBlock>,
  enhanceGrowth: Partial<StatBlock>,
  enhanceLevel: number
): Partial<StatBlock> {
  const statKeys: Array<keyof StatBlock> = ["hp", "attack", "defense", "speed", "critRate"];
  const stats: Partial<StatBlock> = {};

  for (const statKey of statKeys) {
    const value = (baseStats[statKey] ?? 0) + (enhanceGrowth[statKey] ?? 0) * enhanceLevel;
    if (value !== 0) {
      stats[statKey] = value;
    }
  }

  return stats;
}

function toArenaBattleRecord(record: {
  id: string;
  scene: string;
  seed: number;
  attackerPlayerId: string;
  defenderPlayerId: string;
  winnerSide: string;
  attackerSnapshot: Prisma.JsonValue;
  defenderSnapshot: Prisma.JsonValue;
  events: Prisma.JsonValue;
  rewards: Prisma.JsonValue;
  createdAt: Date;
}): ArenaBattleRecord {
  return {
    id: record.id,
    scene: record.scene as "arena",
    seed: record.seed,
    attackerPlayerId: record.attackerPlayerId,
    defenderPlayerId: record.defenderPlayerId,
    winnerSide: record.winnerSide as "attacker" | "defender",
    attackerSnapshot: record.attackerSnapshot as unknown as PetSnapshot,
    defenderSnapshot: record.defenderSnapshot as unknown as PetSnapshot,
    events: record.events as unknown as BattleEventView[],
    rewards: record.rewards as unknown as RewardItem[],
    createdAt: record.createdAt
  };
}

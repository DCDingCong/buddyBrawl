import type { PrismaClient } from "@prisma/client";
import type { LeaderboardEntryRecord, LeaderboardRepository } from "./leaderboard-repository.js";

export function createPrismaLeaderboardRepository(prisma: PrismaClient): LeaderboardRepository {
  return {
    async listLeaderboard(): Promise<LeaderboardEntryRecord[]> {
      const players = await prisma.player.findMany({
        include: {
          currentPet: true
        },
        orderBy: [
          {
            arenaScore: "desc"
          },
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ],
        take: 100
      });

      return players.filter((player) => player.currentPet).map((player) => ({
        playerId: player.id,
        nickname: player.nickname,
        petName: player.currentPet!.name,
        level: player.currentPet!.level,
        power: calculatePower(player.currentPet!),
        arenaScore: player.arenaScore,
        createdAt: player.createdAt
      }));
    },

    async getPlayerRank(playerId: string): Promise<LeaderboardEntryRecord | null> {
      return (await this.listLeaderboard()).find((entry) => entry.playerId === playerId) ?? null;
    }
  };
}

function calculatePower(pet: {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
}): number {
  return Math.round(pet.hp * 0.4 + pet.attack * 3 + pet.defense * 2 + pet.speed * 2 + pet.critRate * 100);
}

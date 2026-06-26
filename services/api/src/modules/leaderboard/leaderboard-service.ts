import type { ApiResponse, LeaderboardEntryView, LeaderboardResponse, LevelRankingEntryView, LevelRankingResponse } from "@buddy-brawl/shared";
import type { LeaderboardEntryRecord, LeaderboardRepository } from "./leaderboard-repository.js";

export class LeaderboardService {
  constructor(private readonly leaderboardRepository: LeaderboardRepository) {}

  async listLeaderboard(): Promise<ApiResponse<LeaderboardResponse>> {
    const entries = await this.leaderboardRepository.listLeaderboard();
    return {
      ok: true,
      data: {
        entries: toRankedEntries(entries)
      }
    };
  }

  async getMyRank(playerId: string): Promise<ApiResponse<LeaderboardEntryView | null>> {
    const entries = await this.leaderboardRepository.listLeaderboard();
    const ranked = toRankedEntries(entries);
    return {
      ok: true,
      data: ranked.find((entry) => entry.playerId === playerId) ?? null
    };
  }

  async listLevelRankings(playerId: string): Promise<ApiResponse<LevelRankingResponse>> {
    const entries = await this.leaderboardRepository.listLeaderboard();
    const ranked = [...entries]
      .sort((left, right) => right.level - left.level || right.arenaScore - left.arenaScore || left.createdAt.getTime() - right.createdAt.getTime() || left.playerId.localeCompare(right.playerId))
      .map<LevelRankingEntryView>((entry, index) => ({
        rank: index + 1,
        playerId: entry.playerId,
        nickname: entry.nickname,
        petName: entry.petName,
        level: entry.level,
        arenaScore: entry.arenaScore,
        action:
          entry.playerId === playerId
            ? {
                label: "自己",
                kind: "self",
                enabled: false
              }
            : {
                label: "挑战",
                kind: "challenge",
                enabled: true
              }
      }));

    return {
      ok: true,
      data: {
        entries: ranked
      }
    };
  }
}

function toRankedEntries(entries: LeaderboardEntryRecord[]): LeaderboardEntryView[] {
  return entries.map((entry, index) => ({
    rank: index + 1,
    playerId: entry.playerId,
    nickname: entry.nickname,
    petName: entry.petName,
    power: entry.power,
    arenaScore: entry.arenaScore
  }));
}

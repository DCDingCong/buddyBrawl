import type { ApiResponse, LeaderboardEntryView, LeaderboardResponse } from "@buddy-brawl/shared";
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

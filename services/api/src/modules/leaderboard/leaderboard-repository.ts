export interface LeaderboardEntryRecord {
  playerId: string;
  nickname: string;
  petName: string;
  level: number;
  power: number;
  arenaScore: number;
  createdAt: Date;
}

export interface LeaderboardRepository {
  listLeaderboard(): Promise<LeaderboardEntryRecord[]>;
  getPlayerRank(playerId: string): Promise<LeaderboardEntryRecord | null>;
}

import type {
  BattleEventView,
  BattleScene,
  EquipmentSnapshot,
  PetSnapshot,
  RewardItem
} from "@buddy-brawl/shared";

export interface ArenaPlayerRecord {
  id: string;
  nickname: string;
  arenaScore: number;
  arenaState: {
    score: number;
    dailyChallengeCount: number;
  };
  currentPet: PetSnapshot;
  equipment: EquipmentSnapshot[];
}

export interface ArenaBattleRecord {
  id: string;
  scene: BattleScene;
  seed: number;
  attackerPlayerId: string;
  defenderPlayerId: string;
  winnerSide: "attacker" | "defender";
  attackerSnapshot: PetSnapshot;
  defenderSnapshot: PetSnapshot;
  events: BattleEventView[];
  rewards: RewardItem[];
  createdAt: Date;
}

export interface ArenaStateRecord {
  players: ArenaPlayerRecord[];
  battleRecords: ArenaBattleRecord[];
}

export interface ArenaChallengeInput {
  attackerPlayerId: string;
  defenderPlayerId: string;
  seed: number;
  winnerSide: "attacker" | "defender";
  attackerSnapshot: PetSnapshot;
  defenderSnapshot: PetSnapshot;
  attackerEquipment: EquipmentSnapshot[];
  defenderEquipment: EquipmentSnapshot[];
  events: BattleEventView[];
  rewards: RewardItem[];
  attackerScoreDelta: number;
  defenderScoreDelta: number;
}

export interface ArenaRepository {
  findOpponents(playerId: string): Promise<ArenaPlayerRecord[]>;
  findChallengeState(attackerPlayerId: string, defenderPlayerId: string): Promise<ArenaStateRecord | null>;
  saveChallenge(input: ArenaChallengeInput): Promise<ArenaBattleRecord>;
  findRecentBattles(playerId: string): Promise<ArenaBattleRecord[]>;
  findBattleForPlayer(playerId: string, battleId: string): Promise<ArenaBattleRecord | null>;
  markBattleViewed(playerId: string, battleId: string, viewedAt: Date): Promise<void>;
}

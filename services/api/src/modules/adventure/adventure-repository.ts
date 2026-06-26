import type { RewardItem } from "@buddy-brawl/shared";

export interface AdventureStateRecord {
  player: {
    id: string;
    gold: number;
    enhanceMaterial: number;
  };
  pet: {
    id: string;
    ownerPlayerId: string;
    name: string;
    level: number;
    exp: number;
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    critRate: number;
    skills: string[];
  };
  adventureState: {
    currentStageId: string;
    lastClaimedAt: Date;
  };
}

export interface AdventureClaimInput {
  playerId: string;
  rewards: RewardItem[];
  claimedAt: Date;
  sourceId: string;
}

export interface AdventureRepository {
  findAdventureStateByPlayerId(playerId: string): Promise<AdventureStateRecord | null>;
  claimRewards(input: AdventureClaimInput): Promise<AdventureStateRecord>;
}

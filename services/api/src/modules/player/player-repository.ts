import type { AppearanceSlots, PandaBodyProfile } from "@buddy-brawl/shared";

export interface InitializedPetRecord {
  id: string;
  playerId: string;
  configId: string;
  name: string;
  level: number;
  exp: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
  bodyProfile: PandaBodyProfile;
  appearanceSlots: AppearanceSlots;
}

export interface InitializedPlayerRecord {
  id: string;
  platformOpenId: string;
  nickname: string;
  avatarUrl?: string | null;
  arenaScore: number;
  currentPet: InitializedPetRecord;
  adventureState: {
    currentStageId: string;
  };
  arenaState: {
    score: number;
    dailyChallengeCount: number;
  };
  taskProgressCount: number;
}

export interface CreateInitializedPlayerInput {
  openId: string;
  nickname: string;
  avatarUrl?: string;
}

export interface PlayerRepository {
  findPlayerByOpenId(openId: string): Promise<InitializedPlayerRecord | null>;
  findPlayerById(playerId: string): Promise<InitializedPlayerRecord | null>;
  createInitializedPlayer(input: CreateInitializedPlayerInput): Promise<InitializedPlayerRecord>;
  recordLoginProgress(playerId: string, loggedInAt: Date): Promise<InitializedPlayerRecord>;
}

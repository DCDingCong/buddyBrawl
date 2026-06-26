import type { AppearanceSlots, EquipmentQuality, EquipmentSlot, PandaBodyProfile, PatrolEventView } from "@buddy-brawl/shared";

export interface HomePetRecord {
  id: string;
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

export interface HomeEquipmentRecord {
  id: string;
  configId: string;
  slot: EquipmentSlot;
  quality: EquipmentQuality;
  enhanceLevel: number;
  isEquipped: boolean;
}

export interface HomeTaskProgressRecord {
  taskId: string;
  currentCount: number;
  claimed: boolean;
}

export interface HomeStateRecord {
  player: {
    id: string;
    nickname: string;
    avatarUrl?: string | null;
    arenaScore: number;
    gold: number;
    enhanceMaterial: number;
  };
  currentPet: HomePetRecord;
  adventureState: {
    currentStageId: string;
    lastClaimedAt: Date;
  };
  arenaState: {
    score: number;
    dailyChallengeCount: number;
  };
  equipment: HomeEquipmentRecord[];
  tasks: HomeTaskProgressRecord[];
  patrolEvents: PatrolEventView[];
}

export interface HomeRepository {
  findHomeStateByPlayerId(playerId: string): Promise<HomeStateRecord | null>;
}

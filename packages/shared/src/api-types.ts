import type {
  BattleScene,
  EquipmentQuality,
  EquipmentSlot,
  EquipmentSnapshot,
  PetSnapshot,
  RewardItem,
  StatBlock
} from "./domain-types";

export interface ApiResponse<T> {
  ok: true;
  data: T;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

export interface HealthResponse {
  status: "ok";
  service: "buddy-brawl-api";
}

export interface PlayerView {
  id: string;
  nickname: string;
  avatarUrl?: string;
  arenaScore: number;
}

export interface CurrentPetView {
  id: string;
  configId: string;
  name: string;
  level: number;
  exp: number;
  stats: StatBlock;
}

export interface DevLoginRequest {
  devOpenId?: string;
  nickname?: string;
  avatarUrl?: string;
}

export interface DevLoginResponse {
  token: string;
  player: PlayerView;
  currentPet: CurrentPetView;
  adventure: {
    currentStageId: string;
  };
  arena: {
    score: number;
    dailyChallengeCount: number;
  };
  taskProgressCount: number;
}

export interface EquippedItemView {
  id: string;
  configId: string;
  name: string;
  slot: EquipmentSlot;
  quality: EquipmentQuality;
  enhanceLevel: number;
  stats: Partial<StatBlock>;
}

export interface InventoryEquipmentItemView extends EquippedItemView {
  isEquipped: boolean;
  maxEnhanceLevel: number;
}

export interface EquipmentInventoryResponse {
  items: InventoryEquipmentItemView[];
  resources: {
    gold: number;
    enhanceMaterial: number;
  };
}

export interface EquipmentActionRequest {
  equipmentId?: string;
}

export interface TaskView {
  taskId: string;
  name: string;
  type: "login" | "claim_adventure" | "enhance_equipment" | "arena_challenge";
  currentCount: number;
  targetCount: number;
  claimed: boolean;
  claimable: boolean;
  rewards: RewardItem[];
}

export interface TasksResponse {
  tasks: TaskView[];
}

export interface TaskClaimResponse {
  task: TaskView;
  resources: {
    gold: number;
    enhanceMaterial: number;
    petExp: number;
  };
}

export interface ArenaOpponentView {
  playerId: string;
  nickname: string;
  petName: string;
  level: number;
  arenaScore: number;
}

export interface ArenaOpponentsResponse {
  opponents: ArenaOpponentView[];
}

export interface ArenaChallengeRequest {
  defenderPlayerId?: string;
}

export interface BattleRecordSummaryView {
  battleId: string;
  opponentPlayerId: string;
  scene: BattleScene;
  winner: "attacker" | "defender";
  createdAt: string;
}

export interface ArenaRecentBattlesResponse {
  battles: BattleRecordSummaryView[];
}

export interface LeaderboardEntryView {
  rank: number;
  playerId: string;
  nickname: string;
  petName: string;
  power: number;
  arenaScore: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntryView[];
}

export interface HomeResponse {
  player: PlayerView;
  currentPet: CurrentPetView;
  adventure: {
    currentStageId: string;
    currentStageName: string;
    claimableRewards: RewardItem[];
    elapsedMinutes: number;
  };
  equipped: EquippedItemView[];
  arena: {
    score: number;
    dailyChallengeCount: number;
  };
  tasks: {
    unclaimedCount: number;
  };
}

export interface AdventureStatusResponse {
  currentStageId: string;
  currentStageName: string;
  elapsedMinutes: number;
  claimableRewards: RewardItem[];
  stored: {
    gold: number;
    petExp: number;
    enhanceMaterial: number;
  };
}

export interface AdventureClaimResponse {
  rewards: RewardItem[];
  stored: {
    gold: number;
    petExp: number;
    enhanceMaterial: number;
  };
  currentStageId: string;
  lastClaimedAt: string;
}

export interface BattleParticipantView {
  playerId: string;
  petName: string;
  level: number;
  stats: StatBlock;
}

export interface BattleEventView {
  round: number;
  actor: "attacker" | "defender";
  action: string;
  damage: number;
  isCritical: boolean;
  attackerHp: number;
  defenderHp: number;
  text: string;
}

export interface BattleResultView {
  battleId?: string;
  scene: BattleScene;
  winner: "attacker" | "defender";
  seed: number;
  attacker: BattleParticipantView;
  defender: BattleParticipantView;
  events: BattleEventView[];
  rewards: RewardItem[];
}

export interface SimulateBattleRequest {
  scene: BattleScene;
  seed: number;
  attacker: PetSnapshot;
  defender: PetSnapshot;
  attackerEquipment: EquipmentSnapshot[];
  defenderEquipment: EquipmentSnapshot[];
}

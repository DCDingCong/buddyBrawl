import type { BattleScene, EquipmentSnapshot, PetSnapshot, RewardItem, StatBlock } from "./domain-types";

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

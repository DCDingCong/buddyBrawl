import { simulateBattle } from "@buddy-brawl/battle";
import type {
  ApiErrorResponse,
  ApiResponse,
  ArenaOpponentsResponse,
  ArenaRecentBattlesResponse,
  BattleRecordSummaryView,
  BattleResultView
} from "@buddy-brawl/shared";
import type { ArenaBattleRecord, ArenaPlayerRecord, ArenaRepository } from "./arena-repository.js";
import { notFound } from "../player/player-service.js";

export interface ArenaServiceOptions {
  now?: () => Date;
}

export class ArenaService {
  private readonly now: () => Date;

  constructor(
    private readonly arenaRepository: ArenaRepository,
    options: ArenaServiceOptions = {}
  ) {
    this.now = options.now ?? (() => new Date());
  }

  async getOpponents(playerId: string): Promise<ApiResponse<ArenaOpponentsResponse>> {
    const opponents = await this.arenaRepository.findOpponents(playerId);
    return {
      ok: true,
      data: {
        opponents: opponents.map(toOpponentView)
      }
    };
  }

  async challenge(
    attackerPlayerId: string,
    defenderPlayerId: string | undefined
  ): Promise<ApiResponse<BattleResultView> | ApiErrorResponse> {
    if (!defenderPlayerId) {
      return badRequest("INVALID_OPPONENT", "defenderPlayerId is required.");
    }

    const state = await this.arenaRepository.findChallengeState(attackerPlayerId, defenderPlayerId);
    if (!state || state.players.length < 2) {
      return notFound("Arena opponent was not found.");
    }

    const attacker = state.players.find((player) => player.id === attackerPlayerId);
    const defender = state.players.find((player) => player.id === defenderPlayerId);
    if (!attacker || !defender) {
      return notFound("Arena opponent was not found.");
    }

    const seed = createBattleSeed(this.now());
    const battle = simulateBattle({
      scene: "arena",
      seed,
      attacker: attacker.currentPet,
      defender: defender.currentPet,
      attackerEquipment: attacker.equipment,
      defenderEquipment: defender.equipment
    });
    const scoreDeltas = calculateScoreDeltas(battle.winner);
    const record = await this.arenaRepository.saveChallenge({
      attackerPlayerId,
      defenderPlayerId,
      seed,
      winnerSide: battle.winner,
      attackerSnapshot: attacker.currentPet,
      defenderSnapshot: defender.currentPet,
      attackerEquipment: attacker.equipment,
      defenderEquipment: defender.equipment,
      events: battle.events,
      rewards: battle.rewards,
      attackerScoreDelta: scoreDeltas.attacker,
      defenderScoreDelta: scoreDeltas.defender
    });

    return {
      ok: true,
      data: toBattleResultView(record, attacker, defender)
    };
  }

  async getRecentBattles(playerId: string): Promise<ApiResponse<ArenaRecentBattlesResponse>> {
    const records = await this.arenaRepository.findRecentBattles(playerId);
    return {
      ok: true,
      data: {
        battles: records.map((record) => toBattleSummary(record, playerId))
      }
    };
  }

  async getBattle(playerId: string, battleId: string): Promise<ApiResponse<BattleResultView> | ApiErrorResponse> {
    const record = await this.arenaRepository.findBattleForPlayer(playerId, battleId);
    if (!record) {
      return notFound("Battle record was not found.");
    }

    return {
      ok: true,
      data: toBattleResultViewFromRecord(record)
    };
  }
}

function toOpponentView(player: ArenaPlayerRecord) {
  return {
    playerId: player.id,
    nickname: player.nickname,
    petName: player.currentPet.name,
    level: player.currentPet.level,
    arenaScore: player.arenaScore
  };
}

function toBattleResultView(
  record: ArenaBattleRecord,
  attacker: ArenaPlayerRecord,
  defender: ArenaPlayerRecord
): BattleResultView {
  return {
    battleId: record.id,
    scene: record.scene,
    winner: record.winnerSide,
    seed: record.seed,
    attacker: {
      playerId: attacker.id,
      petName: attacker.currentPet.name,
      level: attacker.currentPet.level,
      stats: attacker.currentPet.stats
    },
    defender: {
      playerId: defender.id,
      petName: defender.currentPet.name,
      level: defender.currentPet.level,
      stats: defender.currentPet.stats
    },
    events: record.events,
    rewards: record.rewards
  };
}

function toBattleResultViewFromRecord(record: ArenaBattleRecord): BattleResultView {
  return {
    battleId: record.id,
    scene: record.scene,
    winner: record.winnerSide,
    seed: record.seed,
    attacker: {
      playerId: record.attackerPlayerId,
      petName: record.attackerSnapshot.name,
      level: record.attackerSnapshot.level,
      stats: record.attackerSnapshot.stats
    },
    defender: {
      playerId: record.defenderPlayerId,
      petName: record.defenderSnapshot.name,
      level: record.defenderSnapshot.level,
      stats: record.defenderSnapshot.stats
    },
    events: record.events,
    rewards: record.rewards
  };
}

function toBattleSummary(record: ArenaBattleRecord, playerId: string): BattleRecordSummaryView {
  return {
    battleId: record.id,
    opponentPlayerId: record.attackerPlayerId === playerId ? record.defenderPlayerId : record.attackerPlayerId,
    scene: record.scene,
    winner: record.winnerSide,
    createdAt: record.createdAt.toISOString()
  };
}

function calculateScoreDeltas(winner: "attacker" | "defender"): { attacker: number; defender: number } {
  return winner === "attacker"
    ? {
        attacker: 20,
        defender: -10
      }
    : {
        attacker: -5,
        defender: 15
      };
}

function createBattleSeed(date: Date): number {
  return Math.floor(date.getTime() / 60000) % 2147483647;
}

function badRequest(code: string, message: string): ApiErrorResponse {
  return {
    ok: false,
    error: {
      code,
      message
    }
  };
}

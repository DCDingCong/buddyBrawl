import type {
  ApiErrorResponse,
  ApiResponse,
  CurrentPetView,
  DevLoginResponse,
  PlayerView
} from "@buddy-brawl/shared";
import type { InitializedPlayerRecord, PlayerRepository } from "./player-repository.js";

export interface DevLoginInput {
  devOpenId?: string;
  nickname?: string;
  avatarUrl?: string;
}

export function getBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export function unauthorized(): ApiErrorResponse {
  return {
    ok: false,
    error: {
      code: "UNAUTHORIZED",
      message: "Bearer token is required."
    }
  };
}

export function notFound(message: string): ApiErrorResponse {
  return {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message
    }
  };
}

export class PlayerService {
  constructor(private readonly playerRepository: PlayerRepository) {}

  async devLogin(input: DevLoginInput): Promise<ApiResponse<DevLoginResponse>> {
    const openId = input.devOpenId?.trim() || "local-dev-player";
    const nickname = input.nickname?.trim() || "Local Player";
    const existingPlayer = await this.playerRepository.findPlayerByOpenId(openId);
    const player =
      existingPlayer ??
      (await this.playerRepository.createInitializedPlayer({
        openId,
        nickname,
        avatarUrl: input.avatarUrl
      }));
    const updatedPlayer = await this.playerRepository.recordLoginProgress(player.id, new Date());

    return {
      ok: true,
      data: {
        token: updatedPlayer.id,
        player: toPlayerView(updatedPlayer),
        currentPet: toCurrentPetView(updatedPlayer),
        adventure: {
          currentStageId: updatedPlayer.adventureState.currentStageId
        },
        arena: {
          score: updatedPlayer.arenaState.score,
          dailyChallengeCount: updatedPlayer.arenaState.dailyChallengeCount
        },
        taskProgressCount: updatedPlayer.taskProgressCount
      }
    };
  }

  async getCurrentPlayer(playerId: string): Promise<ApiResponse<PlayerView> | ApiErrorResponse> {
    const player = await this.playerRepository.findPlayerById(playerId);
    if (!player) {
      return notFound("Player was not found.");
    }

    return {
      ok: true,
      data: toPlayerView(player)
    };
  }

  async getCurrentPet(playerId: string): Promise<ApiResponse<CurrentPetView> | ApiErrorResponse> {
    const player = await this.playerRepository.findPlayerById(playerId);
    if (!player) {
      return notFound("Player was not found.");
    }

    return {
      ok: true,
      data: toCurrentPetView(player)
    };
  }
}

function toPlayerView(player: InitializedPlayerRecord): PlayerView {
  return {
    id: player.id,
    nickname: player.nickname,
    avatarUrl: player.avatarUrl ?? undefined,
    arenaScore: player.arenaScore
  };
}

function toCurrentPetView(player: InitializedPlayerRecord): CurrentPetView {
  return {
    id: player.currentPet.id,
    configId: player.currentPet.configId,
    name: player.currentPet.name,
    level: player.currentPet.level,
    exp: player.currentPet.exp,
    stats: {
      hp: player.currentPet.hp,
      attack: player.currentPet.attack,
      defense: player.currentPet.defense,
      speed: player.currentPet.speed,
      critRate: player.currentPet.critRate
    }
  };
}

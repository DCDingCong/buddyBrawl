import type {
  ApiErrorResponse,
  ApiResponse,
  CurrentPetView,
  DevLoginResponse,
  PlayerView,
  WechatPhoneLoginResponse
} from "@buddy-brawl/shared";
import type { InitializedPlayerRecord, PlayerRepository } from "./player-repository.js";

export interface DevLoginInput {
  devOpenId?: string;
  nickname?: string;
  avatarUrl?: string;
}

export interface WechatPhoneLoginInput {
  phoneCode?: string;
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

  async wechatPhoneLogin(
    input: WechatPhoneLoginInput
  ): Promise<ApiResponse<WechatPhoneLoginResponse> | ApiErrorResponse> {
    const phoneNumber = resolvePhoneNumber(input.phoneCode);
    if (!phoneNumber) {
      return {
        ok: false,
        error: {
          code: "INVALID_PHONE_AUTH",
          message: "未获取到微信手机号授权，请重新点击开始游戏。"
        }
      };
    }

    const openId = `phone:${phoneNumber}`;
    const nickname = input.nickname?.trim() || "熊猫斗士";
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
        nextAction: "enter_game",
        playerComplete: true,
        maskedPhoneNumber: maskPhoneNumber(phoneNumber),
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
    bodyProfile: player.currentPet.bodyProfile,
    appearanceSlots: player.currentPet.appearanceSlots,
    stats: {
      hp: player.currentPet.hp,
      attack: player.currentPet.attack,
      defense: player.currentPet.defense,
      speed: player.currentPet.speed,
      critRate: player.currentPet.critRate
    }
  };
}

function resolvePhoneNumber(phoneCode: string | undefined): string | null {
  const code = phoneCode?.trim();
  if (!code) {
    return null;
  }

  const mockMatch = /^mock-phone-code-(\d{11})$/.exec(code);
  if (mockMatch) {
    return mockMatch[1]!;
  }

  const digits = code.replace(/\D/g, "");
  return digits.length >= 8 ? digits.slice(-11).padStart(11, "0") : null;
}

function maskPhoneNumber(phoneNumber: string): string {
  return phoneNumber.length === 11
    ? `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(7)}`
    : "已授权";
}

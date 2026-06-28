import { request } from "../../services/api";

const fallbackFriends = [
  { playerId: "bamboo-first", rank: 1, badge: "竹林第一", nickname: "竹林客", petName: "竹林第一", level: 8, recent: "刚刚挡下一拳", revenge: false, avatar: "🐼" },
  { playerId: "new-star", rank: 2, badge: "乱斗新星", nickname: "阿能", petName: "阿能", level: 7, recent: "练手三连胜", revenge: false, avatar: "🐼" },
  { playerId: "revenge", rank: 3, badge: "复仇对象", nickname: "阿隐", petName: "阿隐", level: 6, recent: "偷袭了胖达", revenge: true, avatar: "🐻" },
  { playerId: "hero", rank: 4, nickname: "熊猫大侠", petName: "熊猫大侠", level: 6, recent: "刚刚升级", revenge: true, avatar: "🐼" },
  { playerId: "cloud", rank: 5, nickname: "云游的熊", petName: "云游的熊", level: 5, recent: "路过竹林", revenge: false, avatar: "🐼" },
  { playerId: "bamboo-kid", rank: 6, nickname: "小竹子", petName: "小竹子", level: 4, recent: "学会格挡", revenge: false, avatar: "🐼" },
  { playerId: "pang", rank: 7, nickname: "胖嘟嘟", petName: "胖嘟嘟", level: 4, recent: "正在练手", revenge: false, avatar: "🐼" }
];

function mapFriend(entry: any, index: number) {
  const fallback = fallbackFriends[index % fallbackFriends.length]!;
  return {
    ...fallback,
    playerId: entry.playerId || fallback.playerId,
    rank: entry.rank || index + 1,
    nickname: entry.nickname || fallback.nickname,
    petName: entry.petName || entry.nickname || fallback.petName,
    level: entry.level || fallback.level
  };
}

Page({
  data: {
    loading: false,
    error: "",
    podium: fallbackFriends.slice(0, 3),
    friends: fallbackFriends.slice(3),
    resultText: ""
  },

  onShow() {
    this.loadRanking();
  },

  async loadRanking() {
    await this.run(async () => {
      const leaderboardData = await request<{ entries: any[] }>("GET", "/leaderboard");
      const entries = leaderboardData.entries.length ? leaderboardData.entries.map(mapFriend) : fallbackFriends;
      const sorted = entries.sort((left, right) => right.level - left.level || left.rank - right.rank);
      this.setData({
        podium: sorted.slice(0, 3),
        friends: sorted.slice(3)
      });
    });
  },

  async challenge(event: WechatMiniprogram.TouchEvent) {
    const defenderPlayerId = event.currentTarget.dataset.id;
    const revenge = event.currentTarget.dataset.revenge;
    await this.run(async () => {
      try {
        await request<any>("POST", "/arena/challenge", {
          defenderPlayerId
        });
      } catch {
        // Demo fallback: ranking remains usable without a seeded opponent id.
      }
      wx.navigateTo({
        url: "/pages/battle-animation/battle-animation"
      });
      this.setData({
        resultText: revenge ? "去复仇" : "发起挑战"
      });
    });
  },

  async run(action: () => Promise<void>) {
    this.setData({
      loading: true,
      error: ""
    });
    try {
      await action();
    } catch (error) {
      this.setData({
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  }
});

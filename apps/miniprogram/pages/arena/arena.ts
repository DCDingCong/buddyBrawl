import { request } from "../../services/api";
import { winnerText } from "../../services/format";

Page({
  data: {
    loading: false,
    error: "",
    opponents: [] as any[],
    battles: [] as any[],
    leaderboard: [] as any[],
    myRank: null as any,
    hasOpponents: false,
    hasBattles: false,
    result: null as any,
    resultText: ""
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    await this.run(async () => {
      const opponentsData = await request<{ opponents: any[] }>("GET", "/arena/opponents");
      const battlesData = await request<{ battles: any[] }>("GET", "/arena/recent-battles");
      const leaderboardData = await request<{ entries: any[] }>("GET", "/leaderboard");
      const myRank = await request<any>("GET", "/leaderboard/me");
      this.setData({
        opponents: opponentsData.opponents,
        battles: battlesData.battles.map(mapBattle),
        leaderboard: leaderboardData.entries,
        myRank,
        hasOpponents: opponentsData.opponents.length > 0,
        hasBattles: battlesData.battles.length > 0
      });
    });
  },

  async challenge(event: WechatMiniprogram.TouchEvent) {
    const defenderPlayerId = event.currentTarget.dataset.id;
    await this.run(async () => {
      const result = await request<any>("POST", "/arena/challenge", {
        defenderPlayerId
      });
      const battlesData = await request<{ battles: any[] }>("GET", "/arena/recent-battles");
      this.setData({
        result,
        resultText: winnerText(result.winner),
        battles: battlesData.battles.map(mapBattle),
        hasBattles: battlesData.battles.length > 0
      });
    });
  },

  openBattle(event: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({
      url: `/pages/battle-report/battle-report?battleId=${event.currentTarget.dataset.id}`
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

function mapBattle(battle: any) {
  return {
    ...battle,
    winnerText: battle.winner === "attacker" ? "进攻方获胜" : "防守方获胜"
  };
}

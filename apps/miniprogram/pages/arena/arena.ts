import { request } from "../../services/api";

Page({
  data: {
    loading: false,
    error: "",
    opponents: [] as any[],
    battles: [] as any[],
    hasOpponents: false,
    hasBattles: false,
    result: null as any
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    await this.run(async () => {
      const opponentsData = await request<{ opponents: any[] }>("GET", "/arena/opponents");
      const battlesData = await request<{ battles: any[] }>("GET", "/arena/recent-battles");
      this.setData({
        opponents: opponentsData.opponents,
        battles: battlesData.battles,
        hasOpponents: opponentsData.opponents.length > 0,
        hasBattles: battlesData.battles.length > 0
      });
    });
  },

  async challenge(event: WechatMiniprogram.TouchEvent) {
    const defenderPlayerId = event.currentTarget.dataset.id;
    await this.run(async () => {
      const result = await request("POST", "/arena/challenge", {
        defenderPlayerId
      });
      const battlesData = await request<{ battles: any[] }>("GET", "/arena/recent-battles");
      this.setData({
        result,
        battles: battlesData.battles,
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

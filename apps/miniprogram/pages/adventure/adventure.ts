import { request } from "../../services/api";
import { battleEventText, rewardName, winnerText } from "../../services/format";

Page({
  data: {
    loading: false,
    error: "",
    status: null as any,
    rewardsText: "",
    battle: null as any,
    battleTitle: "",
    roundTexts: [] as string[]
  },

  onShow() {
    this.loadStatus();
  },

  async loadStatus() {
    await this.run(async () => {
      const status = await request<any>("GET", "/adventure/status");
      this.setData({
        status,
        rewardsText: status.claimableRewards
          .map((reward: { type: string; amount: number }) => `${rewardName(reward.type)} ${reward.amount}`)
          .join(" / ")
      });
    });
  },

  async claimRewards() {
    await this.run(async () => {
      const result = await request<any>("POST", "/adventure/claim");
      wx.showToast({
        title: `已领取 ${result.rewards.length} 项奖励`,
        icon: "success"
      });
      await this.loadStatus();
    });
  },

  async challengeBoss() {
    await this.run(async () => {
      const battle = await request<any>("POST", "/adventure/challenge");
      this.setData({
        battle,
        battleTitle: winnerText(battle.winner),
        roundTexts: battle.events.map((event: { round: number; actor: string; damage: number; isCritical?: boolean }) =>
          `第 ${event.round} 回合：${battleEventText(event)}`
        )
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

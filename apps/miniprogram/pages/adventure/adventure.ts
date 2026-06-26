import { request } from "../../services/api";

Page({
  data: {
    loading: false,
    error: "",
    status: null as any,
    battle: null as any
  },

  onShow() {
    this.loadStatus();
  },

  async loadStatus() {
    await this.run(async () => {
      const status = await request("GET", "/adventure/status");
      this.setData({
        status
      });
    });
  },

  async claimRewards() {
    await this.run(async () => {
      await request("POST", "/adventure/claim");
      const status = await request("GET", "/adventure/status");
      this.setData({
        status
      });
    });
  },

  async challengeBoss() {
    await this.run(async () => {
      const battle = await request("POST", "/adventure/challenge");
      this.setData({
        battle
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

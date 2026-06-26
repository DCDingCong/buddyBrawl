import { request } from "../../services/api";

Page({
  data: {
    loading: false,
    error: "",
    battleId: "",
    report: null as any
  },

  onLoad(query: { battleId?: string }) {
    this.setData({
      battleId: query.battleId || ""
    });
    if (query.battleId) {
      this.loadReport(query.battleId);
    }
  },

  async loadReport(battleId = this.data.battleId) {
    if (!battleId) {
      this.setData({
        error: "battleId is required."
      });
      return;
    }

    await this.run(async () => {
      const report = await request("GET", `/battles/${battleId}`);
      this.setData({
        report
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

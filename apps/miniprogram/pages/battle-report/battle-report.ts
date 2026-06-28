import { request } from "../../services/api";
import { battleEventText, winnerText } from "../../services/format";

Page({
  data: {
    loading: false,
    error: "",
    battleId: "",
    report: null as any,
    resultText: "胜利",
    attackerName: "胖达",
    defenderName: "黑衣熊",
    keyRound: "第 2 回合",
    keyText: "板砖挡住一拳，反击成功！",
    weaponName: "板砖",
    weaponLevel: 2,
    weaponText: "挡住一拳！",
    growthLines: ["板砖熟练度 +1", "胖达升级到 Lv.7"],
    roundTexts: ["第 1 回合：胖达试探出手", "第 2 回合：板砖挡住一拳"]
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
      return;
    }

    await this.run(async () => {
      const report = await request<any>("GET", `/battles/${battleId}`);
      const roundTexts = report.events.map((event: { round: number; actor: string; damage: number; isCritical?: boolean }) =>
        `第 ${event.round} 回合：${battleEventText(event)}`
      );
      this.setData({
        report,
        resultText: winnerText(report.winner),
        attackerName: report.attacker.petName,
        defenderName: report.defender.petName,
        keyRound: roundTexts[0]?.split("：")[0] || "关键回合",
        keyText: roundTexts[0]?.split("：")[1] || "胖达抓住机会反击。",
        roundTexts
      });
    });
  },

  goBattle() {
    wx.navigateTo({
      url: "/pages/battle-animation/battle-animation"
    });
  },

  goHome() {
    wx.switchTab({
      url: "/pages/home/home"
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

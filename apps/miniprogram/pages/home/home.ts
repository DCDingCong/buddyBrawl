import { getToken, request } from "../../services/api";
import { loginWithWechatPhone } from "../../services/auth";
import { bodyBuildName, postureName, rewardName } from "../../services/format";

const fallbackEvents = [
  { icon: "🐼", title: "练手", text: "和路边的竹躺切磋了一下", time: "08:12" },
  { icon: "🐻", title: "被偷袭", text: "黑衣熊从背后偷袭了胖达", time: "08:17" },
  { icon: "🎋", title: "学会格挡", text: "用板砖挡住了一记重拳", time: "08:21" }
];

Page({
  data: {
    loading: false,
    error: "",
    loggedIn: Boolean(getToken()),
    home: null as any,
    petName: "胖达",
    petLevel: 6,
    playerName: "竹林斗士",
    bodyTags: [] as string[],
    events: fallbackEvents,
    rewardsText: "板砖熟练度 +1",
    nextRecordText: "下次记录 08:42",
    reportVisible: false
  },

  onShow() {
    this.setData({
      loggedIn: Boolean(getToken())
    });
    if (getToken()) {
      this.loadHome();
    }
  },

  async startGame(event: WechatMiniprogram.ButtonGetPhoneNumber) {
    if (event.detail.errMsg && !event.detail.errMsg.includes("ok")) {
      this.setData({
        error: "需要授权手机号后才能进入竹林。"
      });
      return;
    }

    await this.run(async () => {
      const result = await loginWithWechatPhone(event.detail.code);
      if (result.nextAction === "complete_profile") {
        wx.navigateTo({
          url: "/pages/profile-setup/profile-setup"
        });
        return;
      }

      this.setData({
        loggedIn: true
      });
      await this.loadHome();
    });
  },

  async loadHome() {
    await this.run(async () => {
      const home = await request<any>("GET", "/home");
      const rewardsText = home.adventure.claimableRewards
        .map((reward: { type: string; amount: number }) => `${rewardName(reward.type)} ${reward.amount}`)
        .join(" / ");
      const bodyProfile = home.currentPet.bodyProfile;
      this.setData({
        home,
        petName: home.currentPet.name,
        petLevel: home.currentPet.level,
        playerName: home.player.nickname,
        rewardsText: rewardsText || "暂无新记录",
        bodyTags: [bodyProfile.tag, bodyBuildName(bodyProfile.build), postureName(bodyProfile.posture)]
      });
    });
  },

  goBattle() {
    wx.navigateTo({
      url: "/pages/battle-animation/battle-animation"
    });
  },

  goTasks() {
    wx.showToast({
      title: "今日任务整理中",
      icon: "none"
    });
  },

  showReport() {
    this.setData({
      reportVisible: true
    });
  },

  hideReport() {
    this.setData({
      reportVisible: false
    });
  },

  goRevenge() {
    this.setData({
      reportVisible: false
    });
    wx.switchTab({
      url: "/pages/friend-ranking/friend-ranking"
    });
  },

  async collectRecord() {
    wx.showToast({
      title: "已收取记录",
      icon: "success"
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

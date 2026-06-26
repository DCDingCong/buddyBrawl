import { getToken, request } from "../../services/api";
import { loginWithWechatPhone } from "../../services/auth";
import { bodyBuildName, postureName, rewardName } from "../../services/format";

Page({
  data: {
    loading: false,
    error: "",
    loggedIn: Boolean(getToken()),
    home: null as any,
    rewardsText: "",
    nextAction: "领取挂机收益",
    bodyTags: [] as string[]
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
        rewardsText,
        nextAction: home.tasks.unclaimedCount > 0 ? "领取任务奖励" : "领取挂机收益",
        bodyTags: [bodyProfile.tag, bodyBuildName(bodyProfile.build), postureName(bodyProfile.posture)]
      });
    });
  },

  goAdventure() {
    wx.switchTab({
      url: "/pages/adventure/adventure"
    });
  },

  goEquipment() {
    wx.switchTab({
      url: "/pages/equipment/equipment"
    });
  },

  goArena() {
    wx.switchTab({
      url: "/pages/arena/arena"
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

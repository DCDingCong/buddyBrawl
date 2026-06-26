import { devLogin, getApiBaseUrl, getToken, request, setApiBaseUrl } from "../../services/api";

Page({
  data: {
    apiBaseUrl: getApiBaseUrl(),
    token: getToken(),
    tokenText: getToken() || "not logged in",
    loading: false,
    error: "",
    home: null as any
  },

  onShow() {
    this.setData({
      apiBaseUrl: getApiBaseUrl(),
      token: getToken(),
      tokenText: getToken() || "not logged in"
    });
    if (getToken()) {
      this.loadHome();
    }
  },

  onApiBaseUrlInput(event: WechatMiniprogram.Input) {
    this.setData({
      apiBaseUrl: event.detail.value
    });
  },

  saveApiBaseUrl() {
    setApiBaseUrl(this.data.apiBaseUrl);
    this.setData({
      apiBaseUrl: getApiBaseUrl(),
      error: ""
    });
  },

  async login() {
    await this.run(async () => {
      await devLogin();
      this.setData({
        token: getToken(),
        tokenText: getToken() || "not logged in"
      });
      await this.loadHome();
    });
  },

  async loadHome() {
    await this.run(async () => {
      const home = await request("GET", "/home");
      this.setData({
        home
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

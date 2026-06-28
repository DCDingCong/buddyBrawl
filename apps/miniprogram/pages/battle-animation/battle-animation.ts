Page({
  data: {
    round: 2,
    accelerated: false,
    logs: [
      { time: "08:20", icon: "🐼", text: "胖达用板砖挡住了攻击！" },
      { time: "08:20", icon: "🐻", text: "黑衣熊使出重拳！" }
    ]
  },

  skip() {
    wx.navigateTo({
      url: "/pages/battle-report/battle-report"
    });
  },

  toggleSpeed() {
    this.setData({
      accelerated: !this.data.accelerated
    });
  },

  continueBattle() {
    wx.navigateTo({
      url: "/pages/battle-report/battle-report"
    });
  }
});

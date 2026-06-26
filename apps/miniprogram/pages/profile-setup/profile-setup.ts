Page({
  data: {
    pandaName: "竹林新星"
  },

  enterGame() {
    wx.switchTab({
      url: "/pages/home/home"
    });
  }
});

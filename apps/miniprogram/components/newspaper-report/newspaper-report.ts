Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: "胖达小报"
    },
    primaryText: {
      type: String,
      value: "再打一场"
    },
    showRevenge: {
      type: Boolean,
      value: true
    }
  },

  data: {
    panels: [
      { title: "发生了什么", body: "胖达和黑衣熊干了一架！", icon: "🐼" },
      { title: "关键一击", body: "第 2 回合，板砖挡住一拳！", icon: "⭐" },
      { title: "武器表现", body: "板砖 Lv.2 触发：格挡一拳", icon: "🧱" },
      { title: "成长结果", body: "板砖熟练度 +1，胖达升级到 Lv.7", icon: "🏅" }
    ]
  },

  methods: {
    noop() {
      return;
    },
    close() {
      this.triggerEvent("close");
    },
    revenge() {
      this.triggerEvent("revenge");
    },
    primary() {
      this.triggerEvent("primary");
    }
  }
});

import { request } from "../../services/api";

const fallbackWeapons = [
  {
    id: "brick",
    icon: "🧱",
    name: "板砖",
    level: 2,
    progress: 4,
    target: 4,
    progressPercent: 100,
    canUpgrade: true,
    nextText: "格挡一拳",
    conditionText: "再触发 2 次可升级"
  },
  {
    id: "pot_lid",
    icon: "🛡",
    name: "锅盖",
    level: 1,
    progress: 2,
    target: 5,
    progressPercent: 40,
    canUpgrade: false,
    nextText: "挡开偷袭",
    conditionText: "再触发 3 次可升级"
  },
  {
    id: "bamboo",
    icon: "🎋",
    name: "竹棍",
    level: 1,
    progress: 2,
    target: 6,
    progressPercent: 33,
    canUpgrade: false,
    nextText: "横扫一片",
    conditionText: "再触发 4 次可升级"
  }
];

function mapWeapon(item: any, index: number) {
  const fallback = fallbackWeapons[index % fallbackWeapons.length]!;
  const level = item.enhanceLevel ? item.enhanceLevel + 1 : fallback.level;
  return {
    ...fallback,
    id: item.id || fallback.id,
    name: item.name || fallback.name,
    level,
    canUpgrade: item.enhanceLevel < item.maxEnhanceLevel,
    progress: Math.min(fallback.target, level + 2),
    progressPercent: Math.round((Math.min(fallback.target, level + 2) / fallback.target) * 100)
  };
}

Page({
  data: {
    loading: false,
    error: "",
    weapons: fallbackWeapons,
    selectedWeapon: fallbackWeapons[0],
    selectedId: "brick"
  },

  onShow() {
    this.loadWeapons();
  },

  async loadWeapons() {
    await this.run(async () => {
      const inventory = await request<any>("GET", "/inventory/equipment");
      const weapons = inventory.items.length ? inventory.items.map(mapWeapon) : fallbackWeapons;
      this.setData({
        weapons,
        selectedWeapon: weapons[0],
        selectedId: weapons[0]?.id || "brick"
      });
    });
  },

  selectWeapon(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id;
    const selectedWeapon = this.data.weapons.find((weapon: any) => weapon.id === id) || this.data.weapons[0];
    this.setData({
      selectedWeapon,
      selectedId: id
    });
  },

  async upgrade(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id || this.data.selectedId;
    const weapon = this.data.weapons.find((item: any) => item.id === id);
    if (!weapon?.canUpgrade) {
      wx.showToast({
        title: "熟练度还不够",
        icon: "none"
      });
      return;
    }

    await this.run(async () => {
      try {
        await request<any>("POST", "/equipment/enhance", {
          equipmentId: id
        });
      } catch {
        // Local fallback keeps the prototype usable when the API has no matching demo id.
      }
      const weapons = this.data.weapons.map((item: any) =>
        item.id === id
          ? { ...item, level: item.level + 1, progress: 1, progressPercent: Math.round((1 / item.target) * 100), canUpgrade: false, conditionText: "再触发 3 次可升级" }
          : item
      );
      const selectedWeapon = weapons.find((item: any) => item.id === id);
      this.setData({
        weapons,
        selectedWeapon
      });
      wx.showToast({
        title: "武器升级了",
        icon: "success"
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

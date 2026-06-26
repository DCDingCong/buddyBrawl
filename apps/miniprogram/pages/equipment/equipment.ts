import { request } from "../../services/api";
import { qualityName, slotName } from "../../services/format";

function mapItem(item: any) {
  return {
    ...item,
    slotText: slotName(item.slot),
    qualityText: qualityName(item.quality),
    statusText: item.isEquipped ? "已穿戴" : "可穿戴",
    costText: `强化消耗 ${item.enhanceCost.gold} 金币`,
    canEnhance: item.enhanceLevel < item.maxEnhanceLevel
  };
}

Page({
  data: {
    loading: false,
    error: "",
    inventory: null as any,
    items: [] as any[],
    hasItems: false
  },

  onShow() {
    this.loadInventory();
  },

  async loadInventory() {
    await this.run(async () => {
      const inventory = await request<any>("GET", "/inventory/equipment");
      this.setInventory(inventory);
    });
  },

  async equip(event: WechatMiniprogram.TouchEvent) {
    const equipmentId = event.currentTarget.dataset.id;
    await this.run(async () => {
      const inventory = await request<any>("POST", "/equipment/equip", {
        equipmentId
      });
      this.setInventory(inventory);
    });
  },

  async enhance(event: WechatMiniprogram.TouchEvent) {
    const equipmentId = event.currentTarget.dataset.id;
    await this.run(async () => {
      const inventory = await request<any>("POST", "/equipment/enhance", {
        equipmentId
      });
      this.setInventory(inventory);
      wx.showToast({
        title: "强化成功",
        icon: "success"
      });
    });
  },

  setInventory(inventory: any) {
    const items = inventory.items.map(mapItem);
    this.setData({
      inventory,
      items,
      hasItems: items.length > 0
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

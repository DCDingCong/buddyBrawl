import { request } from "../../services/api";

Page({
  data: {
    loading: false,
    error: "",
    hasItems: false,
    inventory: null as any
  },

  onShow() {
    this.loadInventory();
  },

  async loadInventory() {
    await this.run(async () => {
      const inventory = await request("GET", "/inventory/equipment");
      this.setData({
        inventory,
        hasItems: inventory.items.length > 0
      });
    });
  },

  async equip(event: WechatMiniprogram.TouchEvent) {
    const equipmentId = event.currentTarget.dataset.id;
    await this.run(async () => {
      const inventory = await request("POST", "/equipment/equip", {
        equipmentId
      });
      this.setData({
        inventory,
        hasItems: inventory.items.length > 0
      });
    });
  },

  async enhance(event: WechatMiniprogram.TouchEvent) {
    const equipmentId = event.currentTarget.dataset.id;
    await this.run(async () => {
      const inventory = await request("POST", "/equipment/enhance", {
        equipmentId
      });
      this.setData({
        inventory,
        hasItems: inventory.items.length > 0
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

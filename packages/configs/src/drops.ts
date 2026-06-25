export interface DropItemConfig {
  type: "gold" | "exp" | "enhanceMaterial" | "equipment";
  amount: number;
  weight: number;
  configId?: string;
}

export interface DropPoolConfig {
  id: string;
  items: DropItemConfig[];
}

export const dropConfigs: DropPoolConfig[] = [
  {
    id: "starter_equipment",
    items: [
      { type: "gold", amount: 30, weight: 60 },
      { type: "enhanceMaterial", amount: 1, weight: 30 },
      { type: "equipment", amount: 1, weight: 10, configId: "bamboo_staff_common" }
    ]
  }
];

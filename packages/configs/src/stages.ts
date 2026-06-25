export interface StageConfig {
  id: string;
  name: string;
  order: number;
  goldPerHour: number;
  expPerHour: number;
  dropPoolId: string;
}

export const stageConfigs: StageConfig[] = [
  {
    id: "bamboo_forest_1",
    name: "Bamboo Forest 1",
    order: 1,
    goldPerHour: 40,
    expPerHour: 24,
    dropPoolId: "starter_equipment"
  }
];

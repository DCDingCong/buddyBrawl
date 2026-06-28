import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const miniRoot = resolve(repoRoot, "apps/miniprogram");

function readMiniFile(path: string) {
  return readFileSync(resolve(miniRoot, path), "utf8");
}

describe("Buddy Brawl v0.2 miniprogram UI contract", () => {
  it("uses the v0.2 three-tab navigation and registered pages", () => {
    const appConfig = JSON.parse(readMiniFile("app.json")) as {
      pages: string[];
      tabBar: { list: Array<{ pagePath: string; text: string }> };
    };

    expect(appConfig.pages).toEqual(
      expect.arrayContaining([
        "pages/home/home",
        "pages/battle-animation/battle-animation",
        "pages/battle-report/battle-report",
        "pages/equipment/equipment",
        "pages/friend-ranking/friend-ranking"
      ])
    );
    expect(appConfig.tabBar.list).toEqual([
      { pagePath: "pages/home/home", text: "首页" },
      { pagePath: "pages/equipment/equipment", text: "武器" },
      { pagePath: "pages/friend-ranking/friend-ranking", text: "好友排名" }
    ]);
  });

  it("keeps first-level pages aligned to the newspaper and weapon-growth design", () => {
    const combined = [
      "pages/home/home.wxml",
      "pages/battle-animation/battle-animation.wxml",
      "pages/battle-report/battle-report.wxml",
      "pages/equipment/equipment.wxml",
      "pages/equipment/equipment.ts",
      "pages/friend-ranking/friend-ranking.wxml",
      "components/newspaper-report/newspaper-report.wxml"
    ]
      .map(readMiniFile)
      .join("\n");

    expect(combined).toContain("胖达刚刚又惹事了");
    expect(combined).toContain("第 {{round}} 回合");
    expect(combined).toContain("今日乱斗报");
    expect(combined).toContain("我的武器");
    expect(combined).toContain("好友排名（按等级）");
    expect(combined).toContain("胖达小报");
    expect(combined).toContain("再触发");

    expect(combined).not.toMatch(/战力|宝箱|装备工坊|金币强化|竞技场|冒险收益/);
  });
});

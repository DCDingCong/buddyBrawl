# Buddy Brawl V0.2 Auto Brawl Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the V0.2 backend foundation for automatic brawl events, equipment-linked techniques, battle report progression, ranking-based challenge/revenge, and simplified task data.

**Architecture:** Keep the existing Fastify + Prisma + package-based monorepo. Add small bounded modules instead of folding V0.2 logic into the current `home`, `arena`, or `equipment` services: techniques own combat-trigger configuration, patrol owns offline event settlement, rankings own list/revenge presentation, and tasks expose daily/main task summaries. Existing equipment and arena tables remain compatible while new fields and response types expose the V0.2 product layer.

**Tech Stack:** TypeScript, Fastify, Prisma/PostgreSQL, Vitest, pnpm workspaces, existing `@buddy-brawl/shared`, `@buddy-brawl/configs`, and `@buddy-brawl/battle` packages.

---

## File Structure

- Modify `packages/shared/src/domain-types.ts`: add technique, patrol, ranking, and task summary domain types.
- Modify `packages/shared/src/api-types.ts`: add V0.2 home, battle event, ranking, patrol, and task response fields.
- Create `packages/configs/src/techniques.ts`: define technique configs and equipment-level unlock rules.
- Modify `packages/configs/src/index.ts`: export technique configs.
- Modify `packages/configs/src/validators.ts`: validate technique configs and equipment technique rules.
- Test `packages/configs/tests/validators.test.ts`: cover valid and invalid technique configuration.
- Modify `packages/battle/src/types.ts`: add technique inputs and enriched battle events.
- Modify `packages/battle/src/engine.ts`: select technique triggers from equipment levels.
- Modify `packages/battle/src/report.ts`: generate Chinese technique battle text.
- Test `packages/battle/tests/engine.test.ts`: assert deterministic technique triggers and cooldown behavior.
- Modify `services/api/prisma/schema.prisma`: add `equipmentProficiency`, `PatrolState`, `PatrolEvent`, `BattleReportView`, and revenge metadata fields if needed.
- Create Prisma migration under `services/api/prisma/migrations/<timestamp>_v0_2_auto_brawl/`.
- Create `services/api/src/modules/techniques/technique-service.ts`: resolve unlocked technique pool from player equipment.
- Create `services/api/src/modules/patrol/patrol-repository.ts`, `prisma-patrol-repository.ts`, `patrol-service.ts`: settle offline events with max reward time.
- Create `services/api/src/modules/rankings/ranking-repository.ts`, `prisma-ranking-repository.ts`, `ranking-service.ts`: level ranking with challenge/revenge state.
- Modify `services/api/src/modules/arena/*`: save technique-enriched battles, complete battle tasks, and support revenge challenge input.
- Modify `services/api/src/modules/tasks/*`: split daily and main task summaries.
- Modify `services/api/src/modules/home/*`: return event-first V0.2 home data and task modal summary.
- Create `services/api/src/routes/patrol.ts` and `services/api/src/routes/rankings.ts`.
- Modify `services/api/src/routes/home.ts`, `arena.ts`, `battles.ts`, `tasks.ts`.
- Test `services/api/tests/*`: add focused route tests for each V0.2 module.

## Task 1: Version and Documentation Contract

**Files:**
- Modify: `docs/superpowers/specs/2026-06-26-buddy-brawl-product-design-v2-auto-affiliate.md`
- Modify: `docs/superpowers/specs/2026-06-26-buddy-brawl-phase-3-acceptance.md`
- Modify: `docs/superpowers/plans/2026-06-26-buddy-brawl-phase-3-mvp-miniprogram.md`

- [ ] **Step 1: Normalize user-facing version names**

Replace first-customer-facing version references with:

```md
Buddy Brawl V0.1 Demo
```

Use `V0.2` only for the automatic brawl redesign described in the V2 product document. Do not use `V1.0` for any demo, first open test, or pre-commercial release.

- [ ] **Step 2: Run a version wording scan**

Run:

```powershell
rg -n "V1|1\\.0|首版|第一版本|Demo|V0" docs
```

Expected: any remaining `V1` or `1.0` references are historical or explicitly say they are not used for early releases.

- [ ] **Step 3: Commit**

```powershell
git add docs/superpowers/specs docs/superpowers/plans
git commit -m "docs: align early product versions with V0 scheme"
```

## Task 2: Technique Configs and Equipment Unlock Rules

**Files:**
- Create: `packages/configs/src/techniques.ts`
- Modify: `packages/configs/src/index.ts`
- Modify: `packages/configs/src/validators.ts`
- Test: `packages/configs/tests/validators.test.ts`
- Modify: `packages/shared/src/domain-types.ts`

- [ ] **Step 1: Write failing config tests**

Add tests to `packages/configs/tests/validators.test.ts`:

```ts
it("accepts equipment-level technique unlock rules", () => {
  const result = validateConfigs();

  expect(result.ok).toBe(true);
});

it("rejects technique unlock rules that reference missing equipment", () => {
  const result = validateConfigs({
    ...validConfigs,
    equipmentTechniqueRules: [
      {
        equipmentConfigId: "missing_equipment",
        requiredLevel: 2,
        techniqueConfigId: "brick_block",
        triggerWeight: 10
      }
    ]
  });

  expect(result.ok).toBe(false);
  expect(result.errors).toContain("equipmentTechniqueRule missing_equipment:brick_block references missing equipment missing_equipment");
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
pnpm --filter @buddy-brawl/configs test
```

Expected: tests fail because `equipmentTechniqueRules` and `techniqueConfigs` do not exist.

- [ ] **Step 3: Add shared technique types**

Add to `packages/shared/src/domain-types.ts`:

```ts
export type TechniqueType = "weapon_action" | "guard" | "counter" | "passive" | "special";
export type TechniqueRarity = "common" | "uncommon" | "rare" | "epic";
export type TechniqueTriggerCondition = "always" | "on_attack" | "on_defend" | "on_critical" | "low_hp";

export interface TechniqueEffect {
  kind: "damage" | "block" | "counter" | "buff";
  value: number;
}
```

- [ ] **Step 4: Create technique config file**

Create `packages/configs/src/techniques.ts`:

```ts
import type { TechniqueEffect, TechniqueRarity, TechniqueTriggerCondition, TechniqueType } from "@buddy-brawl/shared";

export interface TechniqueConfig {
  id: string;
  name: string;
  type: TechniqueType;
  rarity: TechniqueRarity;
  triggerCondition: TechniqueTriggerCondition;
  baseWeight: number;
  cooldownRounds: number;
  effect: TechniqueEffect;
  reportTextTemplates: string[];
}

export interface EquipmentTechniqueRule {
  equipmentConfigId: string;
  requiredLevel: number;
  techniqueConfigId: string;
  triggerWeight: number;
}

export const techniqueConfigs: TechniqueConfig[] = [
  {
    id: "brick_smack",
    name: "板砖敲一下",
    type: "weapon_action",
    rarity: "common",
    triggerCondition: "on_attack",
    baseWeight: 20,
    cooldownRounds: 0,
    effect: { kind: "damage", value: 4 },
    reportTextTemplates: ["{actor}抄起板砖敲了{target}一下，额外造成 {value} 点伤害。"]
  },
  {
    id: "brick_block",
    name: "板砖格挡",
    type: "guard",
    rarity: "common",
    triggerCondition: "on_defend",
    baseWeight: 12,
    cooldownRounds: 2,
    effect: { kind: "block", value: 6 },
    reportTextTemplates: ["{actor}举起板砖挡了一下，少挨了 {value} 点伤害。"]
  }
];

export const equipmentTechniqueRules: EquipmentTechniqueRule[] = [
  {
    equipmentConfigId: "bamboo_staff_common",
    requiredLevel: 1,
    techniqueConfigId: "brick_smack",
    triggerWeight: 20
  },
  {
    equipmentConfigId: "bamboo_staff_common",
    requiredLevel: 2,
    techniqueConfigId: "brick_block",
    triggerWeight: 12
  }
];
```

- [ ] **Step 5: Export configs and validate**

Update `packages/configs/src/index.ts`:

```ts
export * from "./techniques.js";
```

Update `validateConfigs` so the optional test config shape includes `techniques` and `equipmentTechniqueRules`, defaulting to `techniqueConfigs` and `equipmentTechniqueRules`. Validate missing equipment, missing technique, `requiredLevel >= 1`, `triggerWeight > 0`, non-empty `reportTextTemplates`, and positive `effect.value`.

- [ ] **Step 6: Run tests**

Run:

```powershell
pnpm --filter @buddy-brawl/configs test
pnpm typecheck
```

Expected: config tests and typecheck pass.

- [ ] **Step 7: Commit**

```powershell
git add packages/shared/src/domain-types.ts packages/configs/src packages/configs/tests/validators.test.ts
git commit -m "feat: add equipment technique configs"
```

## Task 3: Battle Engine Technique Triggers

**Files:**
- Modify: `packages/battle/src/types.ts`
- Modify: `packages/battle/src/engine.ts`
- Modify: `packages/battle/src/report.ts`
- Test: `packages/battle/tests/engine.test.ts`
- Modify: `packages/shared/src/api-types.ts`

- [ ] **Step 1: Write failing battle tests**

Add to `packages/battle/tests/engine.test.ts`:

```ts
it("records triggered equipment techniques in battle events", () => {
  const result = simulateBattle({
    ...baseInput,
    seed: 1,
    attackerTechniques: [
      {
        techniqueConfigId: "brick_smack",
        name: "板砖敲一下",
        triggerCondition: "on_attack",
        triggerWeight: 100,
        cooldownRounds: 0,
        effect: { kind: "damage", value: 4 },
        reportTextTemplates: ["{actor}抄起板砖敲了{target}一下，额外造成 {value} 点伤害。"]
      }
    ],
    defenderTechniques: []
  });

  expect(result.events.some((event) => event.techniqueConfigId === "brick_smack")).toBe(true);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
pnpm --filter @buddy-brawl/battle test
```

Expected: TypeScript compile or test failure because `attackerTechniques` and `techniqueConfigId` are missing.

- [ ] **Step 3: Extend battle types**

Add to `packages/battle/src/types.ts`:

```ts
export interface TechniqueSnapshot {
  techniqueConfigId: string;
  name: string;
  triggerCondition: "always" | "on_attack" | "on_defend" | "on_critical" | "low_hp";
  triggerWeight: number;
  cooldownRounds: number;
  effect: {
    kind: "damage" | "block" | "counter" | "buff";
    value: number;
  };
  reportTextTemplates: string[];
}
```

Extend `BattleInput` with:

```ts
attackerTechniques?: TechniqueSnapshot[];
defenderTechniques?: TechniqueSnapshot[];
```

Extend `BattleEvent` with optional:

```ts
techniqueConfigId?: string;
techniqueName?: string;
techniqueEffectKind?: string;
```

- [ ] **Step 4: Implement minimal trigger selection**

In `packages/battle/src/engine.ts`, default missing technique arrays to `[]`. On attack, select the first eligible technique where `rng.next() * 100 < triggerWeight`, apply `damage` effects by increasing damage, and set event technique fields. Keep cooldown support by tracking `lastTriggeredRound` per side and technique id.

- [ ] **Step 5: Update report text**

In `packages/battle/src/report.ts`, add:

```ts
export function formatTechniqueText(template: string, actorName: string, targetName: string, value: number): string {
  return template.replace("{actor}", actorName).replace("{target}", targetName).replace("{value}", String(value));
}
```

Use the first template when a technique triggers; otherwise keep the current basic attack text.

- [ ] **Step 6: Run battle tests**

Run:

```powershell
pnpm --filter @buddy-brawl/battle test
pnpm typecheck
```

Expected: battle tests and typecheck pass.

- [ ] **Step 7: Commit**

```powershell
git add packages/battle packages/shared/src/api-types.ts
git commit -m "feat: trigger equipment techniques in battles"
```

## Task 4: Persist Equipment Proficiency and Patrol Tables

**Files:**
- Modify: `services/api/prisma/schema.prisma`
- Create: `services/api/prisma/migrations/<timestamp>_v0_2_auto_brawl/migration.sql`
- Test: covered by Prisma-backed route tests in later tasks

- [ ] **Step 1: Update Prisma schema**

Add to `EquipmentInstance`:

```prisma
proficiency Int @default(0)
triggerCount Int @default(0)
lastTriggeredAt DateTime?
```

Add models:

```prisma
model PatrolState {
  id                  String   @id @default(cuid())
  playerId            String   @unique
  lastSettledAt        DateTime @default(now())
  dailyGeneratedCount  Int      @default(0)
  pendingEventCount    Int      @default(0)
  updatedAt            DateTime @updatedAt

  player Player @relation(fields: [playerId], references: [id])
}

model PatrolEvent {
  id                       String   @id @default(cuid())
  playerId                 String
  type                     String
  summary                  String
  rewards                  Json
  relatedBattleId          String?
  relatedPlayerId          String?
  relatedEquipmentConfigId String?
  relatedTechniqueConfigId String?
  actionType               String?
  seenAt                   DateTime?
  createdAt                DateTime @default(now())

  player Player @relation(fields: [playerId], references: [id])

  @@index([playerId, createdAt])
  @@index([playerId, seenAt])
}

model BattleReportView {
  id        String   @id @default(cuid())
  playerId  String
  battleId  String
  viewedAt  DateTime @default(now())

  @@unique([playerId, battleId])
}
```

Add `patrolState` and `patrolEvents` relations to `Player`.

- [ ] **Step 2: Create migration**

Run:

```powershell
pnpm --filter @buddy-brawl/api prisma migrate dev --name v0_2_auto_brawl --create-only
```

Expected: a migration file is generated. If local DB is unavailable, hand-write equivalent SQL and run `pnpm --filter @buddy-brawl/api prisma:generate`.

- [ ] **Step 3: Generate Prisma client**

Run:

```powershell
pnpm --filter @buddy-brawl/api prisma:generate
pnpm typecheck
```

Expected: Prisma client generation and typecheck pass.

- [ ] **Step 4: Commit**

```powershell
git add services/api/prisma/schema.prisma services/api/prisma/migrations
git commit -m "feat: add V0.2 patrol and equipment progress schema"
```

## Task 5: Technique Service for Player Battle Inputs

**Files:**
- Create: `services/api/src/modules/techniques/technique-service.ts`
- Modify: `services/api/src/modules/arena/arena-repository.ts`
- Modify: `services/api/src/modules/arena/prisma-arena-repository.ts`
- Test: `services/api/tests/arena-routes.test.ts`

- [ ] **Step 1: Write failing route test**

In `services/api/tests/arena-routes.test.ts`, add an equipped item at `enhanceLevel: 2` and expect at least one saved battle event to include `techniqueConfigId` when a deterministic seed triggers it.

```ts
expect(response.json().data.events.some((event: { techniqueConfigId?: string }) => event.techniqueConfigId)).toBe(true);
```

- [ ] **Step 2: Run failing API test**

Run:

```powershell
pnpm --filter @buddy-brawl/api test -- tests/arena-routes.test.ts
```

Expected: failure because arena battles do not pass technique snapshots to the battle engine.

- [ ] **Step 3: Implement technique resolver**

Create `services/api/src/modules/techniques/technique-service.ts`:

```ts
import { equipmentTechniqueRules, techniqueConfigs } from "@buddy-brawl/configs";
import type { TechniqueSnapshot } from "@buddy-brawl/battle";

export interface TechniqueEquipmentInput {
  configId: string;
  enhanceLevel: number;
}

export function resolveTechniqueSnapshots(equipment: TechniqueEquipmentInput[]): TechniqueSnapshot[] {
  return equipment.flatMap((item) =>
    equipmentTechniqueRules
      .filter((rule) => rule.equipmentConfigId === item.configId && item.enhanceLevel >= rule.requiredLevel)
      .map((rule) => {
        const config = techniqueConfigs.find((technique) => technique.id === rule.techniqueConfigId);
        if (!config) {
          throw new Error(`Technique config ${rule.techniqueConfigId} was not found.`);
        }

        return {
          techniqueConfigId: config.id,
          name: config.name,
          triggerCondition: config.triggerCondition,
          triggerWeight: rule.triggerWeight,
          cooldownRounds: config.cooldownRounds,
          effect: config.effect,
          reportTextTemplates: config.reportTextTemplates
        };
      })
  );
}
```

- [ ] **Step 4: Pass techniques into arena battle**

In `ArenaService.challenge`, call `resolveTechniqueSnapshots(attacker.equipment)` and `resolveTechniqueSnapshots(defender.equipment)`, then pass `attackerTechniques` and `defenderTechniques` to `simulateBattle`.

- [ ] **Step 5: Run tests**

Run:

```powershell
pnpm --filter @buddy-brawl/api test -- tests/arena-routes.test.ts
pnpm test
pnpm typecheck
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add services/api/src/modules/techniques services/api/src/modules/arena services/api/tests/arena-routes.test.ts
git commit -m "feat: resolve equipment techniques for arena battles"
```

## Task 6: Battle Report Viewed Task

**Files:**
- Modify: `services/api/src/modules/arena/arena-repository.ts`
- Modify: `services/api/src/modules/arena/prisma-arena-repository.ts`
- Modify: `services/api/src/modules/arena/arena-service.ts`
- Modify: `services/api/src/modules/tasks/task-service.ts`
- Modify: `packages/configs/src/tasks.ts`
- Test: `services/api/tests/arena-routes.test.ts`
- Test: `services/api/tests/task-routes.test.ts`

- [ ] **Step 1: Update task configs**

Replace daily task list with:

```ts
{
  id: "daily_login",
  name: "每日进入游戏",
  type: "login",
  targetCount: 1,
  rewards: [{ type: "gold", amount: 50 }]
},
{
  id: "daily_view_battle_report",
  name: "查看一份战报",
  type: "view_battle_report",
  targetCount: 1,
  rewards: [{ type: "gold", amount: 40 }]
},
{
  id: "daily_complete_battle",
  name: "完成一场战斗",
  type: "complete_battle",
  targetCount: 1,
  rewards: [{ type: "gold", amount: 60 }]
}
```

Extend task type unions in shared/config/task repository types.

- [ ] **Step 2: Write failing tests**

Add tests:

```ts
test("viewing a battle report records daily report progress", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/battles/battle-1",
    headers: { authorization: "Bearer player-1" }
  });

  expect(response.statusCode).toBe(200);
  expect(taskRepository.progressByType.view_battle_report).toBe(1);
});
```

And:

```ts
expect(tasks.map((task) => task.taskId)).toEqual([
  "daily_login",
  "daily_view_battle_report",
  "daily_complete_battle"
]);
```

- [ ] **Step 3: Implement report view logging**

When `ArenaService.getBattle` succeeds, call repository method `recordBattleReportView(playerId, battleId, viewedAt)` and increment task progress type `view_battle_report`.

- [ ] **Step 4: Complete battle task**

When `ArenaService.challenge` saves a challenge, increment task progress type `complete_battle` for attacker. If revenge later uses same service path, it also counts.

- [ ] **Step 5: Run tests**

Run:

```powershell
pnpm --filter @buddy-brawl/api test -- tests/arena-routes.test.ts tests/task-routes.test.ts
pnpm test
pnpm typecheck
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add packages/configs/src/tasks.ts packages/shared/src services/api/src/modules/arena services/api/src/modules/tasks services/api/tests
git commit -m "feat: add V0.2 daily battle tasks"
```

## Task 7: Patrol Settlement with Max Reward Time

**Files:**
- Create: `services/api/src/modules/patrol/patrol-repository.ts`
- Create: `services/api/src/modules/patrol/prisma-patrol-repository.ts`
- Create: `services/api/src/modules/patrol/patrol-service.ts`
- Create: `services/api/src/routes/patrol.ts`
- Modify: `services/api/src/app.ts`
- Modify: `packages/shared/src/api-types.ts`
- Test: `services/api/tests/patrol-routes.test.ts`

- [ ] **Step 1: Write failing patrol route test**

Create `services/api/tests/patrol-routes.test.ts`:

```ts
test("settles offline patrol with an eight hour reward cap", async () => {
  const app = await createTestApp({
    lastSettledAt: new Date("2026-06-25T00:00:00.000Z"),
    now: () => new Date("2026-06-26T00:00:00.000Z")
  });

  const response = await app.inject({
    method: "POST",
    url: "/patrol/settle",
    headers: { authorization: "Bearer player-1" }
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().data.settledMinutes).toBe(480);
  expect(response.json().data.events.length).toBeLessThanOrEqual(5);
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
pnpm --filter @buddy-brawl/api test -- tests/patrol-routes.test.ts
```

Expected: route and module missing.

- [ ] **Step 3: Implement patrol service**

Implement `PatrolService.settle(playerId)` with:

```ts
const maxSettlementMinutes = 480;
const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - lastSettledAt.getTime()) / 60000));
const settledMinutes = Math.min(elapsedMinutes, maxSettlementMinutes);
```

Generate events:

- `settledMinutes < 10`: 0 or 1 event.
- `10 <= settledMinutes < 120`: 1 to 2 events.
- `120 <= settledMinutes <= 480`: 2 to 3 events.
- `elapsedMinutes > 480`: add a max cap summary event if event count is below 5.

Rewards auto-apply to gold and pet exp.

- [ ] **Step 4: Register route**

Add `POST /patrol/settle`, protected by bearer token, returning:

```ts
{
  settledMinutes: number;
  capped: boolean;
  events: PatrolEventView[];
  resources: { gold: number };
}
```

- [ ] **Step 5: Run tests**

Run:

```powershell
pnpm --filter @buddy-brawl/api test -- tests/patrol-routes.test.ts
pnpm test
pnpm typecheck
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add services/api/src/modules/patrol services/api/src/routes/patrol.ts services/api/src/app.ts services/api/tests/patrol-routes.test.ts packages/shared/src/api-types.ts
git commit -m "feat: add capped patrol settlement"
```

## Task 8: Event-First Home Response

**Files:**
- Modify: `services/api/src/modules/home/home-repository.ts`
- Modify: `services/api/src/modules/home/prisma-home-repository.ts`
- Modify: `services/api/src/modules/home/home-service.ts`
- Modify: `packages/shared/src/api-types.ts`
- Test: `services/api/tests/home-routes.test.ts`

- [ ] **Step 1: Write failing home test**

Add:

```ts
expect(response.json().data.v02).toMatchObject({
  primaryAction: {
    type: "battle",
    label: "开打"
  },
  taskButton: {
    label: "今日任务"
  }
});
expect(response.json().data.v02.recentEvents.length).toBeLessThanOrEqual(3);
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
pnpm --filter @buddy-brawl/api test -- tests/home-routes.test.ts
```

Expected: `v02` field is missing.

- [ ] **Step 3: Add V0.2 home view**

Extend `HomeResponse` with:

```ts
v02: {
  statusLine: string;
  recentEvents: PatrolEventView[];
  primaryAction: { type: "battle" | "revenge" | "viewReport"; label: string; targetPlayerId?: string; battleId?: string };
  taskButton: { label: "今日任务"; unclaimedCount: number };
  compactResources: { gold: number };
}
```

Home service should choose `revenge` if an unseen `ambushed` event exists, otherwise `battle`.

- [ ] **Step 4: Hide complex first-layer fields from frontend later**

Do not remove old fields yet. Keep `adventure`, `equipped`, and `resources` for backward compatibility. The mini program can switch to `v02` in a later frontend task.

- [ ] **Step 5: Run tests**

Run:

```powershell
pnpm --filter @buddy-brawl/api test -- tests/home-routes.test.ts
pnpm test
pnpm typecheck
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add services/api/src/modules/home services/api/tests/home-routes.test.ts packages/shared/src/api-types.ts
git commit -m "feat: add event-first home response"
```

## Task 9: Level Ranking with Challenge and Revenge State

**Files:**
- Create: `services/api/src/modules/rankings/ranking-repository.ts`
- Create: `services/api/src/modules/rankings/prisma-ranking-repository.ts`
- Create: `services/api/src/modules/rankings/ranking-service.ts`
- Create: `services/api/src/routes/rankings.ts`
- Modify: `services/api/src/app.ts`
- Modify: `services/api/src/modules/arena/arena-service.ts`
- Test: `services/api/tests/ranking-routes.test.ts`

- [ ] **Step 1: Write failing ranking test**

Create `services/api/tests/ranking-routes.test.ts`:

```ts
test("lists level ranking entries with challenge or revenge action", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/rankings/level",
    headers: { authorization: "Bearer player-1" }
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().data.entries[0]).toMatchObject({
    playerId: "player-2",
    level: 3,
    action: {
      type: "revenge",
      label: "复仇"
    }
  });
});
```

- [ ] **Step 2: Implement ranking module**

Ranking entry shape:

```ts
{
  playerId: string;
  nickname: string;
  petName: string;
  level: number;
  rank: number;
  recentStatus: string;
  action: { type: "challenge" | "revenge"; label: "挑战" | "复仇" };
}
```

Sort by current pet level descending, then arena score descending, then created time ascending.

- [ ] **Step 3: Add revenge endpoint**

Add route:

```http
POST /rankings/revenge
```

Body:

```json
{ "targetPlayerId": "player-2" }
```

It should reuse `ArenaService.challenge(attackerPlayerId, targetPlayerId)` and mark the result as `battleIntent: "revenge"` in response.

- [ ] **Step 4: Run tests**

Run:

```powershell
pnpm --filter @buddy-brawl/api test -- tests/ranking-routes.test.ts
pnpm test
pnpm typecheck
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```powershell
git add services/api/src/modules/rankings services/api/src/routes/rankings.ts services/api/src/app.ts services/api/tests/ranking-routes.test.ts
git commit -m "feat: add level rankings with challenge and revenge actions"
```

## Task 10: Daily and Main Task Modal Data

**Files:**
- Modify: `services/api/src/modules/tasks/task-service.ts`
- Modify: `services/api/src/routes/tasks.ts`
- Modify: `packages/shared/src/api-types.ts`
- Test: `services/api/tests/task-routes.test.ts`

- [ ] **Step 1: Write failing task summary test**

Add:

```ts
test("returns daily and main tasks for the task modal", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/tasks/summary",
    headers: { authorization: "Bearer player-1" }
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().data.daily.map((task: { taskId: string }) => task.taskId)).toEqual([
    "daily_login",
    "daily_view_battle_report",
    "daily_complete_battle"
  ]);
  expect(response.json().data.main[0]).toMatchObject({
    category: "main",
    name: expect.stringContaining("升级")
  });
});
```

- [ ] **Step 2: Implement task summary response**

Add shared type:

```ts
export interface TaskSummaryResponse {
  daily: TaskView[];
  main: TaskView[];
}
```

Add route `GET /tasks/summary` that returns daily tasks and main tasks separately.

- [ ] **Step 3: Run tests**

Run:

```powershell
pnpm --filter @buddy-brawl/api test -- tests/task-routes.test.ts
pnpm test
pnpm typecheck
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```powershell
git add services/api/src/modules/tasks services/api/src/routes/tasks.ts services/api/tests/task-routes.test.ts packages/shared/src/api-types.ts
git commit -m "feat: add daily and main task summaries"
```

## Task 11: Docker and Manual API Verification

**Files:**
- No source changes expected.
- Update acceptance notes only if behavior differs from plan.

- [ ] **Step 1: Run full local verification**

Run:

```powershell
pnpm test
pnpm typecheck
pnpm build
```

Expected: all pass.

- [ ] **Step 2: Rebuild Docker API and apply migrations**

Run:

```powershell
docker compose up -d --build api
docker compose exec -T api pnpm prisma migrate deploy
```

Expected: API and Postgres are running, migrations apply cleanly.

- [ ] **Step 3: Verify HTTP flows**

Run:

```powershell
$login = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3000/auth/wechat-phone' -ContentType 'application/json' -Body (@{ phoneCode='mock-phone-code-13900000009'; nickname='V0.2玩家' } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.data.token)" }
Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:3000/home' -Headers $headers
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3000/patrol/settle' -Headers $headers
Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:3000/rankings/level' -Headers $headers
Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:3000/tasks/summary' -Headers $headers
```

Expected:

- Home response contains `v02`.
- Patrol response has `settledMinutes <= 480`.
- Rankings response contains level entries with `挑战` or `复仇`.
- Task summary contains daily and main task arrays.

- [ ] **Step 4: Commit acceptance note**

Create or update:

```text
docs/superpowers/specs/2026-06-26-buddy-brawl-v0-2-backend-acceptance.md
```

Record commands, results, and any limitations.

- [ ] **Step 5: Final commit**

```powershell
git add docs/superpowers/specs/2026-06-26-buddy-brawl-v0-2-backend-acceptance.md
git commit -m "docs: record V0.2 backend verification"
```

## Self-Review

- Spec coverage: This plan covers V0.x versioning, max patrol rewards, event-first home, Q-style level rankings, challenge/revenge actions, simplified daily tasks, main tasks, gold preservation, and equipment-level technique triggers.
- Scope decision: Frontend UI changes are deliberately excluded except response shapes needed by the mini program. A separate frontend plan should update home, battle report, rankings, and task modal UI after these backend APIs land.
- Type consistency: Technique, patrol, ranking, and task names are consistent across shared types, configs, services, and tests.
- Placeholder scan: No `TBD`, `TODO`, or undefined future-only implementation placeholders remain. Timestamped migration folder name is intentionally variable because Prisma creates it at execution time.

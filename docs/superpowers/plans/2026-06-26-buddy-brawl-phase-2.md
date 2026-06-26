# Buddy Brawl 二阶段实施与调试计划

> 面向智能体执行：实现本计划时优先使用 `superpowers:subagent-driven-development`，按模块分派、逐项验收。每个模块完成后必须运行对应测试，再进入下一个模块。

## 1. 目标

二阶段目标是把一阶段工程底座推进到“后端玩法闭环可调试”的状态：玩家可以初始化账号，拥有主宠物，读取主页数据，领取挂机收益，管理和强化装备，发起真实玩家异步自动战斗，并查看战报和排行榜。

本阶段仍不追求完整美术包装和完整小程序体验，重点是服务端业务闭环、接口契约、数据库一致性和可调试性。

## 2. 当前状态

一阶段已完成：

- 单仓库工程结构。
- 本地 Docker 环境。
- PostgreSQL + Prisma 数据模型。
- Fastify API 骨架。
- 共享类型包。
- 配置包和配置校验。
- 基础自动战斗引擎。
- `/health` 健康检查。

二阶段当前已完成两个后端切片：

- `POST /auth/dev-login`
- `GET /me`
- `GET /pet/current`
- `services/api/tests/player-routes.test.ts`
- `GET /home`
- `services/api/tests/home-routes.test.ts`

截至 2026-06-26，本地验证结果：

- `pnpm --filter @buddy-brawl/api test -- tests/player-routes.test.ts` 通过。
- `pnpm --filter @buddy-brawl/api test -- tests/home-routes.test.ts` 通过。
- `pnpm --filter @buddy-brawl/api test` 通过。
- `pnpm test` 通过。
- `pnpm --filter @buddy-brawl/api typecheck` 通过。
- `pnpm typecheck` 通过。

## 3. 二阶段开发范围

### 3.1 玩家初始化与本地开发登录

目标：

- 支持本地开发登录。
- 同一个 `devOpenId` 多次登录必须幂等。
- 新玩家自动创建默认熊猫、挂机状态、竞技状态、任务进度。
- 返回后续接口可使用的本地 token。

接口：

- `POST /auth/dev-login`
- `GET /me`
- `GET /pet/current`

主要文件：

- `services/api/src/routes/auth.ts`
- `services/api/src/routes/player.ts`
- `services/api/src/modules/player/player-service.ts`
- `services/api/src/modules/player/player-repository.ts`
- `services/api/src/modules/player/prisma-player-repository.ts`
- `packages/shared/src/api-types.ts`
- `services/api/tests/player-routes.test.ts`

调试重点：

- 重复登录不会重复创建玩家和宠物。
- 返回的 token 能访问 `/me` 和 `/pet/current`。
- 未带 token 访问玩家接口返回 `401`。
- 默认宠物、挂机状态、竞技状态、任务进度都完整创建。

### 3.2 主页数据接口

目标：

- 小程序首页能一次性拿到玩家核心展示数据。
- 数据来自数据库和配置，不写死展示 Demo。

建议接口：

- `GET /home`

返回内容：

- 玩家昵称、头像、竞技积分。
- 当前主宠物等级、经验、属性。
- 当前挂机关卡。
- 可领取挂机收益预估。
- 当前穿戴装备摘要。
- 今日竞技挑战次数。
- 未领取任务数量。

建议文件：

- `services/api/src/routes/home.ts`
- `services/api/src/modules/home/home-service.ts`
- `services/api/src/modules/home/home-repository.ts`
- `services/api/src/modules/home/prisma-home-repository.ts`
- `services/api/tests/home-routes.test.ts`
- `packages/shared/src/api-types.ts`

调试重点：

- 新玩家登录后立即访问 `/home` 不报错。
- 主页数据中的宠物、挂机状态、竞技状态来自同一个玩家。
- 空装备背包时接口仍返回稳定结构。

### 3.3 挂机冒险

目标：

- 玩家可以查看挂机状态。
- 服务端按时间结算金币和经验。
- 玩家可以领取挂机收益。
- 领取收益必须幂等，避免重复领取。

建议接口：

- `GET /adventure/status`
- `POST /adventure/claim`
- `POST /adventure/challenge`

建议文件：

- `services/api/src/routes/adventure.ts`
- `services/api/src/modules/adventure/adventure-service.ts`
- `services/api/src/modules/adventure/adventure-repository.ts`
- `services/api/tests/adventure-routes.test.ts`
- `packages/shared/src/api-types.ts`

调试重点：

- 挂机收益由服务端根据 `lastClaimedAt` 计算。
- 连续快速领取第二次时收益接近 0 或按最小时间规则处理。
- 领取时金币、经验、宠物经验、奖励流水在同一事务内更新。
- 关卡配置不存在时启动或接口应显式失败，不返回假数据。

### 3.4 装备背包、穿戴和强化

目标：

- 玩家可以查看装备背包。
- 玩家可以穿戴或替换装备。
- 同一玩家同一装备槽位最多只能穿戴一件装备。
- 装备支持简单强化。

建议接口：

- `GET /inventory/equipment`
- `POST /equipment/equip`
- `POST /equipment/enhance`

建议文件：

- `services/api/src/routes/equipment.ts`
- `services/api/src/modules/equipment/equipment-service.ts`
- `services/api/src/modules/equipment/equipment-repository.ts`
- `services/api/tests/equipment-routes.test.ts`
- `packages/shared/src/api-types.ts`
- `packages/configs/src/equipment.ts`

调试重点：

- 穿戴武器后主宠物战斗属性发生变化。
- 替换同槽位装备时旧装备取消穿戴，新装备穿戴成功。
- 强化等级不能超过配置上限。
- 强化扣除材料和提升等级必须在同一事务内完成。
- 材料不足时返回明确错误，不修改装备等级。

### 3.5 异步竞技自动战斗

目标：

- 玩家可以获取真实玩家对手。
- 玩家可以发起异步自动战斗。
- 服务端用战斗引擎结算胜负。
- 战斗保存双方快照、随机种子、事件和奖励。
- 胜负影响竞技积分。

建议接口：

- `GET /arena/opponents`
- `POST /arena/challenge`
- `GET /arena/recent-battles`

建议文件：

- `services/api/src/routes/arena.ts`
- `services/api/src/modules/arena/arena-service.ts`
- `services/api/src/modules/arena/arena-repository.ts`
- `services/api/tests/arena-routes.test.ts`
- `packages/battle/src/engine.ts`
- `packages/shared/src/api-types.ts`

调试重点：

- 推荐对手不能包含自己。
- 没有足够真实玩家时返回明确空列表或开发测试玩家策略。
- 同一场战斗保存随机种子，可复盘。
- 积分变更、战报保存、挑战次数扣减必须在同一事务内完成。
- 战斗使用快照，不受战后装备变化影响。

### 3.6 战报查询

目标：

- 玩家可以查看最近战斗。
- 玩家可以查看单场战报详情。
- 战报结构能直接支持小程序逐回合展示。

建议接口：

- `GET /battles/:battleId`
- `GET /arena/recent-battles`

建议文件：

- `services/api/src/routes/battles.ts`
- `services/api/src/modules/battle-records/battle-record-service.ts`
- `services/api/tests/battle-record-routes.test.ts`
- `packages/shared/src/api-types.ts`

调试重点：

- 玩家只能查看和自己相关的战报。
- 战报包含双方快照、胜负、回合事件、奖励。
- 战报详情接口不重新结算战斗。

### 3.7 排行榜

目标：

- 提供竞技积分排行榜。
- 提供我的排名。
- 首版用 PostgreSQL 查询实现，不引入 Redis。

建议接口：

- `GET /leaderboard`
- `GET /leaderboard/me`

建议文件：

- `services/api/src/routes/leaderboard.ts`
- `services/api/src/modules/leaderboard/leaderboard-service.ts`
- `services/api/tests/leaderboard-routes.test.ts`
- `packages/shared/src/api-types.ts`

调试重点：

- 排行榜按积分倒序。
- 同分时使用稳定排序规则，例如创建时间或玩家 ID。
- 我的排名必须和榜单排序逻辑一致。

### 3.8 任务进度与奖励

目标：

- 玩家可以读取任务。
- 行为触发任务进度变化。
- 玩家可以领取任务奖励。

建议接口：

- `GET /tasks`
- `POST /tasks/:taskId/claim`

建议文件：

- `services/api/src/routes/tasks.ts`
- `services/api/src/modules/tasks/task-service.ts`
- `services/api/tests/task-routes.test.ts`
- `packages/configs/src/tasks.ts`
- `packages/shared/src/api-types.ts`

调试重点：

- 登录、领取挂机收益、强化装备、竞技挑战能推进对应任务。
- 已领取任务不能重复领取。
- 奖励发放和任务状态更新必须在同一事务内完成。

### 3.9 小程序最小调试页面

目标：

- 不做完整美术包装，先建立可调试的小程序页面。
- 页面能连接本地 API，完成主要后端流程验证。

建议页面：

- 登录页或调试入口。
- 首页。
- 挂机页。
- 装备页。
- 竞技页。
- 战报页。

建议文件：

- `apps/miniprogram/app.json`
- `apps/miniprogram/app.ts`
- `apps/miniprogram/app.wxss`
- `apps/miniprogram/pages/home/*`
- `apps/miniprogram/pages/adventure/*`
- `apps/miniprogram/pages/equipment/*`
- `apps/miniprogram/pages/arena/*`
- `apps/miniprogram/pages/battle-report/*`
- `apps/miniprogram/services/api.ts`

调试重点：

- 微信开发者工具开启“不校验合法域名”。
- 小程序请求 `http://127.0.0.1:3000`。
- token 能在本地缓存并随请求携带。
- API 错误能在页面上显示，不静默失败。

## 4. 二阶段调试计划

### 4.1 后端自动化调试

每个模块完成后运行：

```bash
pnpm --filter @buddy-brawl/api test
pnpm --filter @buddy-brawl/api typecheck
```

每个跨包变更完成后运行：

```bash
pnpm test
pnpm typecheck
```

### 4.2 本地 Docker 调试

启动环境：

```bash
docker compose up -d --build api
```

查看状态：

```bash
docker compose ps
```

查看 API 日志：

```bash
docker compose logs -f api
```

健康检查：

```bash
curl http://127.0.0.1:3000/health
```

### 4.3 接口手工调试顺序

推荐按以下顺序手工调试：

1. `GET /health`
2. `POST /auth/dev-login`
3. `GET /me`
4. `GET /pet/current`
5. `GET /home`
6. `GET /adventure/status`
7. `POST /adventure/claim`
8. `GET /inventory/equipment`
9. `POST /equipment/equip`
10. `POST /equipment/enhance`
11. `GET /arena/opponents`
12. `POST /arena/challenge`
13. `GET /arena/recent-battles`
14. `GET /battles/:battleId`
15. `GET /leaderboard`
16. `GET /leaderboard/me`

### 4.4 数据库调试

Adminer 地址：

- `http://127.0.0.1:8080`

连接信息：

- 系统：PostgreSQL
- 服务器：`postgres`
- 用户名：`buddy`
- 密码：`buddy_dev_password`
- 数据库：`buddy_brawl`

重点检查表：

- `Player`
- `Pet`
- `AdventureState`
- `EquipmentInstance`
- `ArenaState`
- `BattleRecord`
- `TaskProgress`
- `RewardLog`

### 4.5 小程序调试

微信开发者工具中需要确认：

- 项目目录指向 `apps/miniprogram`。
- 开启“不校验合法域名”。
- 本地 API 地址为 `http://127.0.0.1:3000`。
- 登录后 token 写入本地缓存。
- 所有接口请求带 `Authorization: Bearer <token>`。

## 5. 二阶段验收标准

二阶段完成后必须满足：

- 新玩家可以通过开发登录创建完整初始状态。
- 首页可以读取玩家、宠物、挂机、装备、竞技和任务摘要。
- 挂机收益可以服务端结算并领取。
- 装备可以查看、穿戴、替换和强化。
- 异步竞技可以选择真实玩家对手并结算战斗。
- 战斗记录可以查询和复盘。
- 排行榜可以查看总榜和我的排名。
- 小程序最小调试页面能跑通主要流程。
- 所有关键资源变更都有事务保护。
- `pnpm test` 通过。
- `pnpm typecheck` 通过。
- Docker 环境下 `GET /health` 通过。

## 6. 暂不纳入二阶段

以下内容推迟到后续阶段：

- 微信正式登录。
- 正式 HTTPS 域名。
- 好友挑战邀请链路。
- 赛季结算。
- 支付和广告。
- 完整美术资源、皮肤、套装外观。
- 配置后台。
- Redis 排行榜缓存。
- 后台运营管理界面。

## 7. 推荐执行顺序

1. 收口玩家初始化切片，确保中文命名和接口契约稳定。
2. 开发主页数据接口。
3. 开发挂机冒险。
4. 开发装备背包、穿戴和强化。
5. 开发异步竞技和战报。
6. 开发排行榜。
7. 开发任务进度和奖励。
8. 开发小程序最小调试页面。
9. 全流程联调和验收归档。

## 8. 2026-06-26 执行记录

二阶段当前实现已覆盖本计划定义的主要后端玩法闭环。

已完成后端切片：

- 玩家初始化和本地开发登录：`POST /auth/dev-login`、`GET /me`、`GET /pet/current`。
- 首页摘要：`GET /home`。
- 挂机冒险：`GET /adventure/status`、`POST /adventure/claim`、`POST /adventure/challenge`。
- 装备背包、穿戴和强化：`GET /inventory/equipment`、`POST /equipment/equip`、`POST /equipment/enhance`。
- 异步竞技和战报：`GET /arena/opponents`、`POST /arena/challenge`、`GET /arena/recent-battles`、`GET /battles/:battleId`。
- 排行榜：`GET /leaderboard`、`GET /leaderboard/me`。
- 任务和奖励：`GET /tasks`、`POST /tasks/:taskId/claim`；登录、领取挂机收益、装备强化和竞技挑战会推进任务进度。
- 微信小程序最小调试页面：`apps/miniprogram` 下已包含首页、挂机、装备、竞技和战报页面，并有本地 API 客户端和 token 存储。

已验证结果：

- `pnpm --filter @buddy-brawl/api test` 通过。
- `pnpm test` 通过。
- `pnpm typecheck` 通过。
- `docker compose up -d --build api` 通过。
- `docker compose exec -T api pnpm prisma migrate deploy` 显示没有待应用迁移。
- `curl http://127.0.0.1:3000/health` 返回 `{"status":"ok","service":"buddy-brawl-api"}`。
- Docker API 手工流程通过：开发登录、当前玩家、当前宠物、首页、任务、挂机状态、挂机领取、装备背包、穿戴、强化、竞技对手、竞技挑战、最近战报、战报详情、排行榜、我的排名。

注意事项：

- 竞技战斗随机种子已限制在 PostgreSQL `integer` 范围内。
- 新开发玩家会获得初始装备和资源，便于不用手动改库就能调试穿戴和强化。
- API Docker 启动命令会先执行 `pnpm prisma:generate`，保证挂载开发依赖卷后 Prisma Client 可用。
- 小程序当前仍偏“调试工具”，用户可见文案、导航、空状态和新手引导需要在第三阶段收口。

# Buddy Brawl 一阶段实施计划

## 1. 目标

一阶段目标是交付一个可运行、可测试、可扩展的工程底座，而不是写死数据的展示 Demo。

本阶段完成后，项目应具备：

- 微信小程序目录占位，后续可接入原生小程序页面。
- 独立 TypeScript 服务端骨架。
- 本地 Docker 环境，包含 PostgreSQL、Adminer 和 API 服务。
- Prisma 数据模型和可追踪迁移。
- 前后端共享类型包。
- 配置包和配置校验能力。
- 基础自动战斗引擎，支持固定随机种子的确定性结算。
- 最小健康检查接口和自动化验收命令。

## 2. 技术范围

采用轻量单仓库结构：

```text
BuddyBrawl/
  apps/
    miniprogram/
  services/
    api/
  packages/
    shared/
    configs/
    battle/
  docs/
  docker-compose.yml
  package.json
  pnpm-workspace.yaml
```

技术栈：

- TypeScript
- pnpm workspace
- Fastify
- Prisma
- PostgreSQL
- Docker Compose
- Vitest

## 3. 阶段边界

一阶段包含：

- 工程初始化和依赖管理。
- 本地 Docker 开发环境。
- 服务端健康检查。
- 核心数据模型。
- 配置化种子数据。
- 配置校验测试。
- 基础战斗引擎测试。

一阶段不包含：

- 微信真实登录。
- 完整小程序页面。
- 正式服务器部署。
- 玩家异步 PK 接口。
- 挂机收益接口。
- 装备强化接口。
- 支付、广告、好友挑战、赛季系统。

## 4. 任务拆分

### 4.1 单仓库工程底座

建立根目录工程文件：

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `.gitignore`
- `.dockerignore`
- `apps/miniprogram/README.md`

验收标准：

- 项目依赖通过项目级 `pnpm install` 安装。
- 不进行全局依赖安装。
- `pnpm test` 和 `pnpm typecheck` 可以从根目录统一执行。

### 4.2 共享类型包

建立 `packages/shared`，用于沉淀前后端共享领域类型和接口类型。

核心内容：

- 宠物快照。
- 装备快照。
- 属性结构。
- 奖励结构。
- 健康检查响应。
- 战斗请求和战斗结果视图。

验收标准：

- 包可独立类型检查。
- 其他包可以通过 `@buddy-brawl/shared` 引用类型。

### 4.3 配置包

建立 `packages/configs`，首版配置以代码仓库内结构化配置为主。

首批配置：

- 宠物模板。
- 等级经验。
- 装备模板。
- 技能模板。
- 冒险关卡。
- 掉落池。
- 任务。

配置校验至少覆盖：

- 宠物引用的技能必须存在。
- 关卡引用的掉落池必须存在。
- 掉落池权重必须有效。
- 装备掉落引用的装备必须存在。
- 装备部位、品质、强化上限等基础字段必须合法。

验收标准：

- `packages/configs` 有自动化测试。
- 首版配置通过校验。
- 后续扩展配置时可以先写配置再跑校验。

### 4.4 战斗引擎包

建立 `packages/battle`，战斗结算独立于服务端和小程序页面。

首版规则：

- 根据速度决定先手。
- 普通攻击自动执行。
- 支持暴击。
- 支持装备属性加成。
- 支持最大回合数。
- 固定随机种子下输出完全一致。

验收标准：

- 同一输入和同一随机种子得到同一战报结果。
- 单元测试覆盖确定性和胜负输出。
- 输出结构化战报事件，便于后续小程序展示。

### 4.5 服务端骨架

建立 `services/api`。

核心内容：

- Fastify 应用初始化。
- CORS。
- 环境变量读取。
- 配置启动校验。
- `/health` 健康检查接口。
- Prisma Client 延迟初始化封装。

验收标准：

- API 能在本地 Docker 容器中启动。
- `GET /health` 返回 `{"status":"ok","service":"buddy-brawl-api"}`。
- 健康检查不依赖数据库查询，方便快速判断服务进程状态。

### 4.6 数据模型和迁移

建立 `services/api/prisma/schema.prisma`。

首版模型覆盖：

- `Player`：玩家档案。
- `Pet`：玩家宠物。
- `EquipmentInstance`：玩家装备实例。
- `AdventureState`：挂机冒险状态。
- `ArenaState`：竞技状态。
- `BattleRecord`：战斗记录。
- `TaskProgress`：任务进度。
- `RewardLog`：奖励流水。
- `ConfigVersion`：配置版本。

关键约束：

- 玩家当前宠物必须通过外键关联到 `Pet`。
- 玩家同一装备槽位最多只能穿戴一件装备。
- 任务进度按玩家和任务唯一。
- 奖励流水按来源和玩家做幂等约束。

验收标准：

- Prisma Client 可生成。
- 迁移文件可追踪。
- 本地 PostgreSQL 能成功应用迁移。

### 4.7 本地 Docker 环境

建立 `docker-compose.yml` 和 `services/api/Dockerfile`。

容器组成：

- `postgres`：PostgreSQL 16。
- `adminer`：本地数据库管理界面。
- `api`：Fastify 服务端。

安全约束：

- 本地端口只绑定到 `127.0.0.1`。
- `.env` 和真实密钥不提交。
- 容器由当前项目的 Compose 文件管理。

默认访问：

- API：`http://127.0.0.1:3000`
- Adminer：`http://127.0.0.1:8080`
- PostgreSQL：`127.0.0.1:5432`

## 5. 验收命令

一阶段验收需要执行：

```bash
pnpm install
pnpm test
pnpm typecheck
docker compose up -d --build api
curl http://127.0.0.1:3000/health
```

数据库迁移需要执行：

```bash
cd services/api
pnpm prisma migrate deploy
pnpm prisma generate
```

## 6. 当前执行结果

截至当前验收：

- `pnpm install` 已完成。
- `pnpm test` 已通过。
- `pnpm typecheck` 已通过。
- Prisma 迁移已应用到本地 PostgreSQL。
- Docker API 镜像已成功构建。
- API 健康检查已通过。
- PostgreSQL、Adminer、API 当前均只绑定到 `127.0.0.1`。

详细结果见：

- `docs/superpowers/specs/2026-06-25-buddy-brawl-phase-1-acceptance.md`

## 7. 下一阶段入口

二阶段建议围绕真实玩法闭环展开：

1. 玩家初始化与本地开发登录。
2. 主宠物创建与主页数据接口。
3. 挂机状态读取、收益结算和领取。
4. 装备背包、穿戴、替换和简单强化。
5. 真实玩家异步竞技挑战。
6. 战报保存、查询和排行榜。

# Buddy Brawl 二阶段玩家初始化切片计划

> 面向智能体执行：该切片已经作为二阶段第一块后端能力实现并通过本地接口测试。后续若继续扩展，应先保持本文件描述的接口契约稳定。

## 1. 目标

建立二阶段第一个可运行后端切片：本地开发登录、玩家幂等初始化、当前玩家查询、当前宠物查询。

## 2. 架构

路由层只处理 HTTP 入参和响应，玩家初始化规则放在 `PlayerService`。服务层依赖 `PlayerRepository` 接口，测试环境使用内存仓储，生产环境使用 Prisma 仓储。

## 3. 技术栈

- TypeScript
- Fastify
- Vitest
- Prisma
- pnpm workspace

## 4. 文件职责

- `services/api/src/modules/player/player-service.ts`：负责玩家初始化、登录返回结构、当前玩家和当前宠物查询。
- `services/api/src/modules/player/player-repository.ts`：定义玩家仓储接口和初始化后玩家记录结构。
- `services/api/src/modules/player/prisma-player-repository.ts`：使用 Prisma 实现玩家查询和初始化事务。
- `services/api/src/routes/auth.ts`：注册本地开发登录接口。
- `services/api/src/routes/player.ts`：注册 `/me` 和 `/pet/current`。
- `services/api/src/app.ts`：注册玩家相关路由，并支持测试时注入仓储。
- `packages/shared/src/api-types.ts`：补充玩家、宠物、开发登录响应类型。
- `services/api/tests/player-routes.test.ts`：使用 Fastify inject 和内存仓储测试接口行为。

## 5. 已完成接口

### 5.1 `POST /auth/dev-login`

用途：

- 本地开发登录。
- 按 `devOpenId` 幂等创建或读取玩家。
- 新玩家初始化默认宠物、挂机状态、竞技状态和任务进度。

请求示例：

```json
{
  "devOpenId": "dev-open-id-1",
  "nickname": "Tester"
}
```

响应核心字段：

- `token`：当前临时使用玩家 ID 作为 bearer token。
- `player`：玩家摘要。
- `currentPet`：当前主宠物。
- `adventure`：挂机状态摘要。
- `arena`：竞技状态摘要。
- `taskProgressCount`：初始化任务进度数量。

### 5.2 `GET /me`

用途：

- 读取当前玩家摘要。

请求要求：

- 必须携带 `Authorization: Bearer <token>`。

未携带 token 时返回：

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Bearer token is required."
  }
}
```

### 5.3 `GET /pet/current`

用途：

- 读取当前主宠物。

请求要求：

- 必须携带 `Authorization: Bearer <token>`。

## 6. 已验证行为

测试文件：

- `services/api/tests/player-routes.test.ts`

已覆盖：

- `POST /auth/dev-login` 可以创建玩家、默认宠物、挂机状态、竞技状态和任务进度。
- 同一个 `devOpenId` 重复登录返回同一个玩家和同一个宠物。
- `GET /me` 未携带 bearer token 返回 `401`。
- `GET /pet/current` 携带登录 token 后返回初始化宠物。

截至 2026-06-26，本地验证命令：

```bash
pnpm --filter @buddy-brawl/api test -- tests/player-routes.test.ts
pnpm --filter @buddy-brawl/api typecheck
```

验证结果：

- `player-routes.test.ts` 4 个测试通过。
- API 类型检查通过。

## 7. 后续收口事项

进入二阶段后续模块前，建议先处理：

- 将测试数据中的宠物展示名从英文改为中文，保持产品中文语境一致。
- 明确临时 token 只用于本地开发，正式微信登录切片再替换为 JWT 或服务端会话。
- 确认 `/home` 接口复用当前玩家和当前宠物查询逻辑，避免重复写初始化判断。

# Buddy Brawl 一阶段验收记录

## 验收项

- [x] `pnpm install` 成功。
- [x] `pnpm test` 成功。
- [x] `pnpm typecheck` 成功。
- [x] `docker compose up -d` 成功。
- [x] `curl http://localhost:3000/health` 返回 `{"status":"ok","service":"buddy-brawl-api"}`。
- [x] Prisma 迁移已应用到本地 PostgreSQL。
- [x] 配置校验测试通过。
- [x] 战斗引擎确定性测试通过。
- [x] PostgreSQL、Adminer 和 API 的本地端口均只绑定到 `127.0.0.1`。

## 当前不包含

- 微信真实登录。
- 小程序完整页面。
- 玩家异步 PK 接口。
- 挂机收益接口。
- 装备强化接口。

## 本次关键结果

- 已建立 pnpm workspace 单仓库结构。
- 已建立 `packages/shared` 共享类型包。
- 已建立 `packages/configs` 配置包，并提供配置校验。
- 已建立 `packages/battle` 基础战斗引擎，支持固定随机种子下的确定性结算。
- 已建立 `services/api` Fastify 服务端骨架。
- 已建立 PostgreSQL Prisma schema，并完成本地迁移。
- 已建立本地 Docker Compose 环境，包含 PostgreSQL、Adminer 和 API 服务。

## 执行备注

- 项目依赖通过项目级 `pnpm install` 安装，没有进行全局安装。
- Docker 容器由当前项目 `docker-compose.yml` 管理。
- API Docker 镜像使用 Node 22，以兼容 pnpm 11。
- API Dockerfile 已安装 OpenSSL，并在镜像构建时显式执行 Prisma Client 生成。

## 下一阶段建议

第二阶段实现玩家初始化、挂机收益、装备强化、竞技挑战和战报持久化接口。

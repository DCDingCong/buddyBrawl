# Buddy Brawl V0.2 Backend Acceptance

Date: 2026-06-26

## Scope

This acceptance record covers the V0.2 backend foundation for:

- V0.x versioning contract.
- Equipment-linked battle techniques.
- Battle report technique metadata.
- Patrol state, patrol events, and battle report view persistence.
- Arena challenge technique pools.
- V0.2 daily tasks: login, view battle report, complete battle.
- `POST /patrol/settle` with 480-minute max reward time.
- `/home` backward-compatible `v02` response.
- `GET /rankings/level` and `POST /rankings/revenge`.
- `GET /tasks/summary`.

## Verification

Automated verification passed:

- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `pnpm --filter @buddy-brawl/api prisma:generate`

Docker verification passed:

- `docker compose up -d --build api`
- `docker compose exec -T api pnpm prisma migrate deploy`

Migration applied:

- `20260626161000_v0_2_patrol_reports_equipment_progress`

Manual HTTP smoke verification passed against `http://127.0.0.1:3000`:

- `POST /auth/wechat-phone`: login returned `ok: true`.
- `GET /home`: response includes `v02`, primary action `开打`.
- `POST /patrol/settle`: response includes `maxRewardMinutes: 480`.
- `GET /rankings/level`: response returned ranked entries.
- `GET /tasks/summary`: response returned 3 daily tasks and 2 main tasks.

## Notes

- V0.2 remains backend-first. Existing V0.1 routes are retained for compatibility.
- Gold remains in the economy and is included in V0.2 summaries.
- `enhanceMaterial` remains for compatibility but is not part of the new home primary loop.
- Revenge route currently reuses the arena challenge settlement path. Friend graph and season-specific revenge rules are left for a later product pass.

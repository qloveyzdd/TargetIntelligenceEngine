---
phase: 01-foundation-goal-backbone
plan: 01
subsystem: infra
tags: [nextjs, postgres, drizzle, workspace, analysis-run]
requires: []
provides:
  - 单仓单应用脚手架
  - analysis run 聚合模型与仓储
  - 首页与 run 详情页统一骨架
affects: [goal-card, dimensions, api, testing]
tech-stack:
  added: [Next.js, Drizzle ORM, PostgreSQL, Vitest]
  patterns: [run aggregate storage, server shell, unified workspace shell]
key-files:
  created:
    - package.json
    - src/db/schema.ts
    - src/features/analysis-run/repository.ts
    - src/components/workspace/run-shell.tsx
    - src/app/runs/[runId]/page.tsx
  modified:
    - package-lock.json
    - package.json
key-decisions:
  - "用单个 Next.js 应用承载页面和服务接口，先不拆前后端。"
  - "analysis run 作为聚合根，统一承载五类核心对象。"
  - "测试默认允许 memory store，真实运行默认走 PostgreSQL。"
patterns-established:
  - "Pattern 1: 仓储层优先围绕 AnalysisRun 聚合暴露 create/get/update。"
  - "Pattern 2: 首页和 run 详情页共用同一个 RunShell。"
requirements-completed: [GOAL-01, GOAL-02]
duration: 1h 05m
completed: 2026-04-10
---

# Phase 01-01 Summary

**Next.js 工作台骨架、analysis run 聚合仓储和首页 / run 详情页统一壳层已经就位**

## Performance

- **Duration:** 1h 05m
- **Started:** 2026-04-10T02:31:00+08:00
- **Completed:** 2026-04-10T03:36:51+08:00
- **Tasks:** 3
- **Files modified:** 19

## Accomplishments
- 建好了单应用脚手架、依赖脚本、Docker Postgres 配置和基础 layout。
- 固定了 `analysis run` 的五类核心对象骨架，以及可替换的仓储层。
- 首页和 `/runs/[runId]` 已经能展示统一的工作台空骨架。

## Task Commits

Each task was committed atomically:

1. **Task 1: 建立单应用脚手架和本地开发基础设施** - `9b10549` (feat)
2. **Task 2: 建立 analysis run 聚合 schema、类型和仓储** - `5e59668` (feat)
3. **Task 3: 建立首页与 run 详情页的空骨架** - `3bc2c38` (feat)

**Plan metadata:** 当前 SUMMARY 由后续文档提交记录。

## Files Created/Modified
- `package.json` - 项目脚本、依赖和测试命令入口
- `src/db/schema.ts` - `analysis_runs` 主表 JSONB 骨架
- `src/features/analysis-run/repository.ts` - memory / postgres 双模式仓储
- `src/components/workspace/run-shell.tsx` - 单页工作台壳层
- `src/app/runs/[runId]/page.tsx` - run 重开页面

## Decisions Made
- 用 `analysis run` 聚合根承载 `goal`、`dimensions`、`candidates`、`evidence`、`stageGoals`，避免现在就过度拆表。
- 在测试环境允许 `ANALYSIS_RUN_STORE=memory`，这样单测和后续 E2E 可以稳定运行。
- 首页与详情页都复用 `RunShell`，保证后续 GoalCard 流程只改一处布局主干。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 增加 `.gitignore` 避免工作区噪音**
- **Found during:** Task 1
- **Issue:** 安装依赖后 `node_modules` 和构建缓存会污染仓库状态
- **Fix:** 新增 `.gitignore`，忽略 `node_modules`、`.next`、测试报告和 tsbuildinfo
- **Files modified:** `.gitignore`
- **Verification:** `git status` 不再被依赖目录淹没
- **Committed in:** `9b10549`

**2. [Rule 3 - Blocking] 补装 `@types/pg` 解决类型检查失败**
- **Found during:** Task 3 的 `typecheck`
- **Issue:** `pg` 缺少类型声明，`tsc` 无法通过
- **Fix:** 在 `package.json` 中新增 `@types/pg` 并重新安装
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** `npm run typecheck` passes
- **Committed in:** `3bc2c38`

---

**Total deviations:** 2 auto-fixed
**Impact on plan:** 都是为了保证仓库可执行和类型检查可通过，没有引入额外业务范围。

## Issues Encountered
- `npm install` 首次因为缓存目录权限被沙箱拦截，改用提权后恢复。
- `next@^16.2.5` 在 npm 上不存在，修正为实际可用的 `^16.2.3` 后安装成功。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 已经可以开始接入 GoalCard 结构化生成、编辑和确认流程。
- PostgreSQL 和 OpenAI 环境变量还需要在本地 `.env.local` 中配置，Plan 02 才能跑通真实接口。

---
*Phase: 01-foundation-goal-backbone*
*Completed: 2026-04-10*

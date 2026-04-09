---
phase: 2
slug: dimension-engine-search-planning
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 2 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test:unit -- --run` |
| **Full suite command** | `npm run check && npm run test:e2e` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit -- --run`
- **After every plan wave:** Run `npm run check && npm run test:e2e`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DIME-02 | T-02-01 | 只有服务端能收敛维度结构并归一化权重 | unit | `npm run test:unit -- --run` | `src/features/dimensions/normalize-dimension-weights.ts` | pending |
| 02-01-02 | 01 | 1 | DIME-03 | T-02-01 | 维度定义、方向、证据需求必须经过服务端校验后再落库 | unit | `npm run test:unit -- --run` | `src/features/dimensions/dimension-schema.ts` | pending |
| 02-01-03 | 01 | 1 | DIME-04 | T-02-02 | disabled 维度必须保留但不参与后续权重和 leader 计划 | unit | `npm run test:unit -- --run` | `src/features/dimensions/merge-dimensions.ts` | pending |
| 02-02-01 | 02 | 2 | SRCH-01 | T-02-03 | `same_goal` SearchPlan 只生成草案，不触发真实搜索 | unit | `npm run test:unit -- --run` | `src/features/search-plan/generate-search-plan.ts` | pending |
| 02-02-02 | 02 | 2 | SRCH-02 | T-02-02 | `dimension_leader` 只针对 enabled 维度生成计划项 | unit | `npm run test:unit -- --run` | `src/features/search-plan/schema.ts` | pending |
| 02-02-03 | 02 | 2 | SRCH-01, SRCH-02 | T-02-03 | SearchPlan 草案和确认状态必须写回同一条 run | unit/integration | `npm run test:unit -- --run` | `src/app/api/runs/[runId]/route.ts` | pending |
| 02-03-01 | 03 | 3 | DIME-02, DIME-03, DIME-04 | T-02-01 | 重开 run 时必须回显已确认维度，而不是重新生成 | e2e | `npm run test:e2e` | `tests/e2e/dimension-search-plan-workflow.spec.ts` | pending |
| 02-03-02 | 03 | 3 | SRCH-01, SRCH-02 | T-02-03 | 重开 run 时必须回显已确认 SearchPlan，而不是重新生成 | e2e | `npm run test:e2e` | `tests/e2e/dimension-search-plan-workflow.spec.ts` | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/features/dimensions/normalize-dimension-weights.test.ts` - 覆盖 enabled 维度归一化
- [ ] `src/features/dimensions/merge-dimensions.test.ts` - 覆盖 core/domain/project 合并与去重
- [ ] `src/features/search-plan/schema.test.ts` - 覆盖 SearchPlan schema 收敛
- [ ] `tests/e2e/dimension-search-plan-workflow.spec.ts` - 覆盖维度编辑和 SearchPlan 确认主链路

---

## Manual-Only Verifications

All phase behaviors should have automated verification. No manual-only checks planned.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

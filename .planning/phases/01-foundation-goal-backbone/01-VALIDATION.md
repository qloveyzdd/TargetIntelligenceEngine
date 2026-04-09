---
phase: 1
slug: foundation-goal-backbone
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test:unit -- --run` |
| **Full suite command** | `npm run check && npm run test:e2e` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit -- --run`
- **After every plan wave:** Run `npm run check && npm run test:e2e`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | GOAL-01 | N/A | 页面和脚手架只暴露必要输入入口，不在客户端泄露服务端密钥 | unit/config | `npm run typecheck` | `src/app/page.tsx` | pending |
| 01-01-02 | 01 | 1 | GOAL-02 | N/A | run 聚合持久化只接受服务端数据库访问 | unit | `npm run test:unit -- --run` | `src/db/schema.ts` | pending |
| 01-02-01 | 02 | 2 | GOAL-03 | N/A | GoalCard 生成必须走结构化 schema，不接受自由文本落库 | unit | `npm run test:unit -- --run` | `src/features/goal-card/schema.ts` | pending |
| 01-02-02 | 02 | 2 | GOAL-04 | N/A | 用户编辑 GoalCard 后必须显式提交，刷新后仍能取回同一 run | e2e | `npm run test:e2e` | `tests/e2e/goalcard-workflow.spec.ts` | pending |
| 01-03-01 | 03 | 3 | DIME-01 | N/A | 初版通用维度模板写入 run 时保持固定字段和默认权重 | unit | `npm run test:unit -- --run` | `src/features/dimensions/build-initial-dimensions.ts` | pending |
| 01-03-02 | 03 | 3 | GOAL-04 | N/A | run 详情页只能读取已存在 run，并显示 candidates / evidence / stage_goals 空骨架 | e2e | `npm run test:e2e` | `src/app/runs/[runId]/page.tsx` | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` - 建立单元测试入口
- [ ] `playwright.config.ts` - 建立端到端测试入口
- [ ] `tests/e2e/goalcard-workflow.spec.ts` - 覆盖主闭环
- [ ] `package.json` 包含 `lint`、`typecheck`、`test:unit`、`test:e2e`、`check` 脚本

---

## Manual-Only Verifications

All phase behaviors should have automated verification. No manual-only checks planned.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

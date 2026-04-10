---
phase: 6
slug: stage-goals-gsd-handoff
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
---

# Phase 6 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test:unit -- --run` |
| **Focused E2E command** | `npm run test:e2e -- tests/e2e/stage-goals-handoff-workflow.spec.ts` |
| **Full suite command** | `npm run check && npm run test:e2e` |
| **Estimated runtime** | task-level `<60s`, wave/full `~120s` |

---

## Sampling Rate

- **After every task commit:** 只跑该任务对应的聚焦 unit 或单条 E2E spec
- **After every wave:** 跑 `npm run check && npm run test:e2e`
- **Before `/gsd-verify-work`:** Full suite 必须是 green
- **Max feedback latency:** task-level `<60s`, wave-level `~120s`

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | STAG-01, STAG-02 | T-06-01 | `StageGoal` 契约扩展后仍能稳定 roundtrip，且上游 scoring 变化会清空陈旧 `stageGoals` | unit | `npm run test:unit -- --run src/features/analysis-run/repository.test.ts` | `src/features/analysis-run/repository.test.ts` | pending |
| 06-01-02 | 01 | 1 | STAG-01, STAG-02 | T-06-02 | `buildStageGoals()` 固定输出三阶段，并保留 `basedOnGaps`、`referenceProducts`、`successMetrics`、`deliverables`、`risks` | unit | `npm run test:unit -- --run src/features/stage-goals/build-stage-goals.test.ts src/app/api/runs/[runId]/stage-goals/route.test.ts` | `src/features/stage-goals/build-stage-goals.test.ts` | pending |
| 06-02-01 | 02 | 2 | STAG-03 | T-06-03 | `handoff` 导出结构稳定，可直接消费 `run.stageGoals`，不依赖 UI 临时拼装 | unit | `npm run test:unit -- --run src/features/stage-goals/build-stage-goal-handoff.test.ts src/app/api/runs/[runId]/handoff/route.test.ts` | `src/features/stage-goals/build-stage-goal-handoff.test.ts` | pending |
| 06-02-02 | 02 | 2 | STAG-01, STAG-02, STAG-03 | T-06-04 | 工作台能生成阶段目标、展示三阶段内容、导出 handoff，并在 reopen 后回显 persisted `stageGoals` | unit + e2e | `npm run test:unit -- --run src/components/workspace/stage-goals-panel.test.tsx src/components/workspace/run-shell.test.tsx && npm run test:e2e -- tests/e2e/stage-goals-handoff-workflow.spec.ts` | `tests/e2e/stage-goals-handoff-workflow.spec.ts` | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

No standalone Wave 0.  
Phase 6 的验证文件都在对应任务内创建并接通，不需要额外 `MISSING` 占位验证。

---

## Manual-Only Verifications

All planned Phase 6 behaviors should have automated coverage. No manual-only checks planned.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency is bounded below wave/full limits
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready

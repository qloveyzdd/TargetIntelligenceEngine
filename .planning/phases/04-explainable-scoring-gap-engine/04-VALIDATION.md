---
phase: 4
slug: explainable-scoring-gap-engine
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
---

# Phase 4 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test:unit -- --run` |
| **Focused E2E command** | `npm run test:e2e -- tests/e2e/scoring-gap-workflow.spec.ts` |
| **Full suite command** | `npm run check && npm run test:e2e` |
| **Estimated runtime** | task-level `<60s`, wave/full `~120s` |

---

## Sampling Rate

- **After every task commit:** Run only that task对应的聚焦 unit 或单条 E2E spec
- **After every wave:** Run `npm run check && npm run test:e2e`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** task-level `<60s`, wave-level `~120s`

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SCOR-01 | T-04-01 | `run.scoring` 契约必须在 schema / migration / mapper 三层一致，并预留后续 scorecards + gaps 结构 | unit | `npm run test:unit -- --run src/features/analysis-run/repository.test.ts` | `src/features/analysis-run/types.ts` | pending |
| 04-01-02 | 01 | 1 | SCOR-01 | T-04-02 | repository create/get/update 必须完整 roundtrip `run.scoring`，reopen 不丢字段 | unit | `npm run test:unit -- --run src/features/analysis-run/repository.test.ts` | `src/features/analysis-run/repository.test.ts` | pending |
| 04-02-01 | 02 | 2 | EVID-03, SCOR-01 | T-04-03 | evidence 必须有稳定 `id`，评分与 gap 只能引用 `evidenceIds`，不能靠数组位置 | unit | `npm run test:unit -- --run src/features/evidence/schema.test.ts src/features/evidence/assign-evidence-id.test.ts src/features/evidence/extract-evidence.test.ts` | `src/features/evidence/assign-evidence-id.test.ts` | pending |
| 04-02-02 | 02 | 2 | EVID-03, SCOR-01 | T-04-04 | `unknown` 不当低分，scoring snapshot 必须暴露 `coverage` 与 `unknownCount` | unit | `npm run test:unit -- --run src/features/scoring/evidence-assessment.test.ts src/features/scoring/build-scoring-snapshot.test.ts` | `src/features/scoring/build-scoring-snapshot.test.ts` | pending |
| 04-02-03 | 02 | 2 | SCOR-01 | T-04-05 | scoring route 可缓存并重算，且上游更新会清空旧 `run.scoring` | unit | `npm run test:unit -- --run src/features/analysis-run/repository.test.ts src/app/api/runs/[runId]/scoring/route.test.ts` | `src/app/api/runs/[runId]/scoring/route.test.ts` | pending |
| 04-03-01 | 03 | 3 | SCOR-02 | T-04-06 | gap 必须持久化 benchmark provenance，benchmark 不足时返回 unknown | unit | `npm run test:unit -- --run src/features/scoring/build-gap-priorities.test.ts src/app/api/runs/[runId]/scoring/route.test.ts` | `src/features/scoring/build-gap-priorities.test.ts` | pending |
| 04-03-02 | 03 | 3 | SCOR-01, SCOR-02 | T-04-07 | 工作台必须在 Evidence 完成后触发 `POST /api/runs/[runId]/scoring`，并用持久化 `run.scoring` 刷新面板；解释面板可展开到 evidence contribution / `evidenceIds` / benchmark metadata | unit | `npm run test:unit -- --run src/components/workspace/run-shell.test.tsx src/components/workspace/scoring-panel.test.tsx` | `src/components/workspace/run-shell.test.tsx` | pending |
| 04-03-03 | 03 | 3 | SCOR-01, SCOR-02 | T-04-08 | E2E 必须覆盖 Evidence 完成后生成评分、面板展示结果，以及 reopen 后恢复 persisted scoring 与 gaps，而不是前端临时状态 | e2e | `npm run test:e2e -- tests/e2e/scoring-gap-workflow.spec.ts` | `tests/e2e/scoring-gap-workflow.spec.ts` | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

No standalone Wave 0. 当前 8 个任务都在任务内创建并执行对应测试文件，没有 `MISSING` 自动验证占位。

---

## Manual-Only Verifications

All planned Phase 4 behaviors have automated coverage. No manual-only checks planned.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency is bounded below wave/full limits
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready

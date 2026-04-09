---
phase: 3
slug: candidate-recall-evidence-intake
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 3 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test:unit -- --run` |
| **Full suite command** | `npm run check && npm run test:e2e` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit -- --run`
- **After every plan wave:** Run `npm run check && npm run test:e2e`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SRCH-03 | T-03-01 | 候选召回结果必须先归一化后再写回 run，不能直接把原始命中结果落库 | unit | `npm run test:unit -- --run` | `src/features/candidate-recall/normalize-candidates.ts` | pending |
| 03-01-02 | 01 | 1 | SRCH-03 | T-03-02 | 同一产品多次命中时必须合并 `matched_modes`，不能重复存储 | unit | `npm run test:unit -- --run` | `src/features/candidate-recall/select-top-candidates.ts` | pending |
| 03-01-03 | 01 | 1 | SRCH-04 | T-03-03 | 深挖对象必须截断为前 5 个候选，不能无限扩张 | unit | `npm run test:unit -- --run` | `src/app/api/runs/[runId]/candidates/route.ts` | pending |
| 03-02-01 | 02 | 2 | EVID-01 | T-03-04 | 证据任务必须按 candidate + dimension + source URL 生成，而不是候选粗摘要 | unit | `npm run test:unit -- --run` | `src/features/evidence/extract-evidence.ts` | pending |
| 03-02-02 | 02 | 2 | EVID-02 | T-03-04 | 每条 evidence 必须保留 URL、excerpt、extractedValue、confidence、capturedAt | unit | `npm run test:unit -- --run` | `src/features/evidence/schema.ts` | pending |
| 03-02-03 | 02 | 2 | EVID-01, EVID-02 | T-03-05 | 官方源优先于 review/community，review 不能默认替代官方证据 | unit/integration | `npm run test:unit -- --run` | `src/app/api/runs/[runId]/evidence/route.ts` | pending |
| 03-03-01 | 03 | 3 | SRCH-03, SRCH-04 | T-03-01 | 工作台必须展示候选列表、`matched_modes` 和前 5 深挖结果 | e2e | `npm run test:e2e` | `tests/e2e/candidate-evidence-workflow.spec.ts` | pending |
| 03-03-02 | 03 | 3 | EVID-01, EVID-02 | T-03-04 | 重开 run 时必须回显 evidence 列表，而不是重新生成临时片段 | e2e | `npm run test:e2e` | `tests/e2e/candidate-evidence-workflow.spec.ts` | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/features/candidate-recall/normalize-candidates.test.ts` - 覆盖域名优先去重和名称兜底
- [ ] `src/features/candidate-recall/select-top-candidates.test.ts` - 覆盖前 5 深挖选择规则
- [ ] `src/features/evidence/schema.test.ts` - 覆盖 evidence 结构与必填字段
- [ ] `src/features/evidence/extract-evidence.test.ts` - 覆盖 evidence 细颗粒度提取
- [ ] `tests/e2e/candidate-evidence-workflow.spec.ts` - 覆盖候选召回到 evidence 回显主链路

---

## Manual-Only Verifications

All planned Phase 3 behaviors should have automated verification. No manual-only checks planned.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

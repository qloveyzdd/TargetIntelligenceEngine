---
phase: 5
slug: visual-intelligence-surface
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
---

# Phase 5 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test:unit -- --run` |
| **Focused E2E command** | `npm run test:e2e -- tests/e2e/visual-intelligence-surface.spec.ts` |
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
| 05-01-01 | 01 | 1 | VIZ-01 | T-05-01 | 雷达图模型必须只消费 `run.scoring` 中已有分数，默认只展示目标与前 3 个已评分候选，不触发新的评分计算 | unit | `npm run test:unit -- --run src/features/visuals/build-radar-chart-model.test.ts` | `src/features/visuals/build-radar-chart-model.test.ts` | pending |
| 05-01-02 | 01 | 1 | VIZ-01 | T-05-02 | ECharts 客户端组件必须在有尺寸容器中初始化，更新时调用安全的 set/update 流程，卸载时释放实例 | unit | `npm run test:unit -- --run src/components/workspace/radar-chart.test.tsx` | `src/components/workspace/radar-chart.test.tsx` | pending |
| 05-02-01 | 02 | 1 | VIZ-02 | T-05-03 | 关系图节点和边必须只由 `goal / dimensions / candidates / gaps` 派生，`Evidence` 不进入主图，`Stage Goal` 不伪造节点 | unit | `npm run test:unit -- --run src/features/visuals/build-relationship-graph.test.ts` | `src/features/visuals/build-relationship-graph.test.ts` | pending |
| 05-02-02 | 02 | 1 | VIZ-02 | T-05-04 | dagre 布局必须稳定输出可渲染节点坐标，避免每次 render 都重排抖动 | unit | `npm run test:unit -- --run src/features/visuals/build-relationship-graph.test.ts` | `src/features/visuals/build-relationship-graph.test.ts` | pending |
| 05-03-01 | 03 | 2 | VIZ-01, VIZ-02 | T-05-05 | 雷达图和关系图必须共用单一解释面板状态，点击对象后只更新当前选中目标，不跳独立详情页 | unit | `npm run test:unit -- --run src/features/visuals/build-visual-explanation.test.ts src/components/workspace/visual-intelligence-surface.test.tsx` | `src/components/workspace/visual-intelligence-surface.test.tsx` | pending |
| 05-03-02 | 03 | 2 | VIZ-01, VIZ-02 | T-05-06 | 工作台在已有 scoring 时必须稳定挂载雷达图、关系图和解释面板；reopen run 后图面仍可见 | unit | `npm run test:unit -- --run src/components/workspace/run-shell.test.tsx src/components/workspace/visual-intelligence-surface.test.tsx` | `src/components/workspace/run-shell.test.tsx` | pending |
| 05-03-03 | 03 | 2 | VIZ-01, VIZ-02 | T-05-07 | E2E 必须覆盖“评分完成 -> 图可见 -> 点击联动解释 -> 切换候选 -> reopen 后仍可用”的主链路 | e2e | `npm run test:e2e -- tests/e2e/visual-intelligence-surface.spec.ts` | `tests/e2e/visual-intelligence-surface.spec.ts` | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

No standalone Wave 0. 当前 Phase 5 的验证文件都在对应任务内创建并接通，不需要额外 `MISSING` 占位验证。

---

## Manual-Only Verifications

All planned Phase 5 behaviors should have automated coverage. No manual-only checks planned.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency is bounded below wave/full limits
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready

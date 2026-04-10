# Phase 6: Stage Goals & GSD Handoff - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 06-stage-goals-gsd-handoff
**Areas discussed:** 阶段目标拆分方式、阶段目标从 gap 推导方式、StageGoal 数据契约、GSD handoff 粒度

---

## 阶段目标拆分方式

| Option | Description | Selected |
|--------|-------------|----------|
| 固定三阶段 | 固定输出验证阶段、MVP 阶段、差异化阶段 | Yes |
| 动态阶段数量 | 根据 gap 情况动态决定输出几个阶段 | |
| 前两段固定第三段动态 | 验证和 MVP 固定，第三段按情况生成 | |

**User's choice:** 1A
**Notes:** 用户接受首版先把阶段骨架固定成三段，优先保证结构稳定和后续 GSD 可消费性。

---

## 阶段目标从 gap 推导方式

| Option | Description | Selected |
|--------|-------------|----------|
| `gap_priority` 排序 + 依赖归并 | 先按 gap 排序，再结合依赖关系归入三段阶段 | Yes |
| 模型直接写阶段目标 | 让模型主导生成阶段目标，gap 只作参考 | |
| 完全规则化 | 完全不用模型，只用规则生成阶段目标 | |

**User's choice:** 2A
**Notes:** 用户明确希望阶段目标仍然由 gap 反推，不接受脱离 gap 的自由发挥式 roadmap 生成。

---

## StageGoal 数据契约

| Option | Description | Selected |
|--------|-------------|----------|
| 在现有结构上补强字段 | 增加 `basedOnGaps`、`referenceProducts` 等字段，保留轻量结构 | Yes |
| 保持当前简版结构 | 不扩字段，继续沿用现有 `StageGoal` 最小骨架 | |
| 直接做重型 GSD 专用结构 | 直接嵌入 phase/task 级详细计划信息 | |

**User's choice:** 3A
**Notes:** 用户接受在现有 run 聚合内补强阶段目标字段，但不希望直接把本阶段做成第二套 planner。

---

## GSD handoff 粒度

| Option | Description | Selected |
|--------|-------------|----------|
| 结构化 `stageGoals` + 每阶段 focus | 作为后续 GSD 讨论和规划的输入 | Yes |
| 直接输出完整 GSD phase 草案 | 一次性展开成接近 roadmap/plan 的结构 | |
| 只做 JSON 导出 | 不关心 GSD 语义，只导出原始数据 | |

**User's choice:** 4A
**Notes:** 用户希望 handoff 真正服务后续 GSD 流程，但首版先停在“结构化输入包”这一层，不提前膨胀成功能更重的规划器。

---

## the agent's Discretion

- `gap` 到阶段的内部排序和依赖归并细节留给后续 research / planning 决定。
- 导出交互形态、字段命名风格和界面摆放由实现阶段决定，只要不违背本轮锁定的语义边界。

## Deferred Ideas

- 动态阶段数量
- 直接生成完整 GSD phase/task 草案
- 在本阶段内回头扩展评分、召回或可视化系统

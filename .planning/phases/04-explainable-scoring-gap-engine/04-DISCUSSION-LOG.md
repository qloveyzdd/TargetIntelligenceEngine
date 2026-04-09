# Phase 4: Explainable Scoring & Gap Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 04-explainable-scoring-gap-engine
**Areas discussed:** `unknown` 进入总体评分、维度分解释方式、`gap priority` 基准、Phase 4 结果粒度

---

## `unknown` 进入总体评分

| Option | Description | Selected |
|--------|-------------|----------|
| 已知维度重归一 + coverage | `unknown` 不按低分算，总分只基于已知维度重归一，并单独显示覆盖度 | Yes |
| 整体一票 unknown | 只要存在任一 `unknown`，整体分数也直接标记为 `unknown` | |
| 当作 0 分 | `unknown` 维度按 0 分进入总体分，同时额外提示数据缺失 | |

**User's choice:** 1A
**Notes:** 用户确认 `unknown` 不能被误判为低分，同时总体结果要保留 coverage 信号。

---

## 维度分解释方式

| Option | Description | Selected |
|--------|-------------|----------|
| 摘要优先，展开看贡献 | 默认展示维度结论和分数，展开后看 evidence 贡献拆解 | Yes |
| 全量平铺贡献 | 首屏直接平铺每条 evidence 的贡献细节 | |
| 只给代表性证据 | 只显示分数和少量代表性证据，不展示贡献拆解 | |

**User's choice:** 2A
**Notes:** 用户接受“先摘要、后展开”的节奏，但要求解释链最终能落回 evidence。

---

## `gap priority` 基准

| Option | Description | Selected |
|--------|-------------|----------|
| 维度前沿基准 | 每个维度以当前最强的 evidence-backed 候选为 benchmark，并标出来源 | Yes |
| 只看直接对手 | 只以 `same_goal` 候选作为 gap 基准，`dimension_leader` 仅作参考 | |
| 双轨 gap | 同时计算 `same_goal gap` 和 `frontier gap` 两套结果 | |

**User's choice:** 3A
**Notes:** 用户确认 benchmark 不强制区分 `same_goal` 或 `dimension_leader`，重点是证据充分且基准身份清晰。

---

## Phase 4 结果粒度

| Option | Description | Selected |
|--------|-------------|----------|
| 结构化面板 + 可展开解释 | 输出总分、维度分、gap priority，并允许逐项展开解释 | Yes |
| 只给结论 | 只显示总分和 gap 排序，解释推迟到后续 phase | |
| 常驻公式面板 | 直接把计算细节和公式长期常驻展示 | |

**User's choice:** 4A
**Notes:** 用户希望 Phase 4 先把“结果可看、解释可点开”跑通，不提前做重型分析台。

---

## the agent's Discretion

- 评分公式中的具体常数、归一化细节和 confidence 融合方式留给 research / planning 决定。
- 结果面板的具体字段排列、文案和交互细节由实现阶段决定。

## Deferred Ideas

- 雷达图、关系图和可视化联动留到 Phase 5
- 阶段目标生成与 GSD handoff 留到 Phase 6

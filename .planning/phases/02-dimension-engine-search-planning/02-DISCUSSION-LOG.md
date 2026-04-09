# Phase 2: Dimension Engine & Search Planning - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 02-dimension-engine-search-planning
**Areas discussed:** 三层维度合成, 维度可编辑范围, SearchPlan 可见性, dimension_leader 范围

---

## 三层维度合成

| Option | Description | Selected |
|--------|-------------|----------|
| A | 通用层固定，领域层预置模板挑选，项目层动态补充 | |
| B | 通用层固定，领域层和项目层都由 AI 动态生成 | X |
| C | 通用层和领域层固定模板，项目层先不做动态生成 | |

**User's choice:** B  
**Notes:** 用户希望领域层和项目层都保持动态生成，不想把 Phase 2 做成静态模板挑选器。

---

## 维度可编辑范围

| Option | Description | Selected |
|--------|-------------|----------|
| A | 只允许改权重和启停 | |
| B | 允许改权重、方向、定义、证据需求，但不允许新增自定义维度 | X |
| C | 全部可改，包含新增/删除维度 | |

**User's choice:** B  
**Notes:** 用户要的是“足够可控”，但不希望首版走到自定义维度配置器。

---

## SearchPlan 可见性

| Option | Description | Selected |
|--------|-------------|----------|
| A | 先展示搜索计划草案，用户确认后再执行 | X |
| B | 直接执行，不做确认页 | |
| C | 默认直接执行，但允许展开查看计划 | |

**User's choice:** A  
**Notes:** 搜索计划本身要可见、可确认，符合项目强调可解释的方向。

---

## dimension_leader 范围

| Option | Description | Selected |
|--------|-------------|----------|
| A | 所有维度都支持生成 leader 搜索计划 | X |
| B | 只对权重最高的前 3 个维度生成 leader 搜索计划 | |
| C | 只允许用户手动点选某个维度再生成 leader 搜索计划 | |

**User's choice:** A  
**Notes:** 用户希望所有维度都能生成 leader 计划，不希望在 Phase 2 先收窄范围。

## the agent's Discretion

- 动态维度生成的具体提示词、归一化细节和前端展示形态交给后续 research / planning 决定。

## Deferred Ideas

- None - discussion stayed within phase scope.

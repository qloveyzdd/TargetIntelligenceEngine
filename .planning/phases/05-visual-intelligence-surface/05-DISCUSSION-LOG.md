# Phase 5: Visual Intelligence Surface - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 05-visual-intelligence-surface
**Areas discussed:** 雷达图默认比较对象、关系图主节点模型、图形交互承载方式、Phase 5 最小交付范围

---

## 雷达图默认比较对象

| Option | Description | Selected |
|--------|-------------|----------|
| 当前目标 + Top 3 scored candidates | 默认展示当前目标与总分最高的前 3 个已评分候选，并允许手动增减 | Yes |
| 当前目标 + 全部候选 | 默认把所有已评分候选都放进雷达图 | |
| 先手选再出图 | 不提供默认比较对象，用户先选候选后再生成图 | |

**User's choice:** 1A
**Notes:** 用户确认首屏需要有可直接比较的默认结果，但仍保留手动增减候选的能力。

---

## 关系图主节点模型

| Option | Description | Selected |
|--------|-------------|----------|
| `Goal / Dimension / Candidate / Gap` | 主图只保留四类核心节点，Evidence 留在解释面板 | Yes |
| `Goal / Dimension / Candidate / Gap / Evidence` | 把 Evidence 也直接画进主图 | |
| `Goal / Dimension / Candidate` | 先不画 Gap，只做更轻的关系图 | |

**User's choice:** 2A
**Notes:** 用户接受主图先保持克制，避免 Evidence 节点把图面冲散。

---

## 图形交互主承载方式

| Option | Description | Selected |
|--------|-------------|----------|
| 共用右侧解释面板 | 雷达图和关系图点击后都落到同一个解释面板 | Yes |
| 各自弹层 | 每种图都有自己的解释弹层 | |
| 独立详情页 | 点击对象后跳到单独详情页 | |

**User's choice:** 3A
**Notes:** 用户希望解释入口统一，避免同一个对象在不同视图里出现两套解释逻辑。

---

## Phase 5 最小交付范围

| Option | Description | Selected |
|--------|-------------|----------|
| 雷达图 + 关系图 + 联动解释面板 + 基本高亮筛选 | 先把主要可视化链路跑通，不做复杂编辑能力 | Yes |
| 可拖拽图编辑器 | 直接做可编辑、可排版、可保存布局的图界面 | |
| 静态图展示 | 只做图，不做点击联动 | |

**User's choice:** 4A
**Notes:** 用户明确要求首版优先跑通“看结果、点对象、追解释”的主链，不提前上重交互。

---

## the agent's Discretion

- 图表库与图布局的具体接法留给 research / planning 决定，只要不违背本轮锁定的边界。
- 解释面板的字段顺序、组件拆分和响应式细节留给实现阶段决定。

## Deferred Ideas

- `Stage Goal` 节点真实出图与交互，留到 Phase 6
- 拖拽编辑、布局保存、自定义 dashboard，留到后续版本

# Phase 2: Dimension Engine & Search Planning - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只负责把已有的 GoalCard 转成稳定可编辑的三层维度集合，并基于这些维度生成可解释的 `same_goal` 与 `dimension_leader` 搜索计划草案。它不会真正执行候选召回、网页抓取和证据抽取，这些能力属于后续 Phase 3。

</domain>

<decisions>
## Implementation Decisions

### 三层维度合成
- **D-01:** 通用层继续沿用 Phase 1 已经落地的 6 个核心维度，作为维度引擎的稳定底座。
- **D-02:** 领域层不采用固定模板挑选，而是由模型根据 GoalCard 的类别、JTBD 和约束动态生成。
- **D-03:** 项目层同样由模型动态补充，重点捕捉当前目标里的个性化要求，而不是复用预设标签。
- **D-04:** 维度引擎的重点不是“生成更多维度”，而是把动态生成的领域层和项目层稳定地合并到统一结构里。

### 维度可编辑范围
- **D-05:** 用户在 Phase 2 可以修改维度的 `weight`、`direction`、`definition` 和 `evidenceNeeded`。
- **D-06:** 用户可以启用或禁用某个维度，用来满足“去掉与当前目标无关维度”的需求。
- **D-07:** 用户在本阶段不能新增自定义维度，也不做复杂的自由增删改配置器。

### SearchPlan 可见性
- **D-08:** SearchPlan 生成后必须先展示给用户，作为草案确认页，而不是直接进入执行。
- **D-09:** 搜索计划要显式区分 `same_goal` 与 `dimension_leader` 两类计划，并说明每一类计划要找什么、为什么找、预计覆盖哪些候选。
- **D-10:** 用户确认的是“计划草案”，不是最终候选结果；真正执行搜索留给下一阶段。

### dimension_leader 范围
- **D-11:** `dimension_leader` 不做收敛裁剪，所有已启用维度都允许生成 leader 搜索计划。
- **D-12:** 规划层需要接受“搜索计划会更宽”的事实，但仍然保持计划本身结构清晰，不在本阶段提前做候选去重或结果深挖。

### the agent's Discretion
- 动态生成领域层和项目层时，模型提示词的具体写法、归一化细节和去重规则由后续 research / planning 决定。
- SearchPlan 草案的具体展示形式、字段布局和交互文案由后续规划决定，只要满足“先可见、再确认”的原则即可。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目级约束
- `.planning/PROJECT.md` - 项目愿景、evidence-first 原则、开源协作和 GSD 约束
- `.planning/ROADMAP.md` - Phase 2 的目标、成功标准和计划边界
- `.planning/REQUIREMENTS.md` - 本阶段对应的需求：`DIME-02`、`DIME-03`、`DIME-04`、`SRCH-01`、`SRCH-02`
- `.planning/STATE.md` - 当前项目状态与阶段位置
- `AGENTS.md` - 项目级执行规则、中文输出要求、KISS 原则

### 上一阶段上下文
- `.planning/phases/01-foundation-goal-backbone/01-CONTEXT.md` - Phase 1 已锁定的 GoalCard、analysis run 和单页工作台决策
- `.planning/phases/01-foundation-goal-backbone/01-02-SUMMARY.md` - GoalCard 生成、编辑、确认链路已经如何落地
- `.planning/phases/01-foundation-goal-backbone/01-03-SUMMARY.md` - 初版 core dimensions 和 run reopen 行为已经如何落地
- `.planning/phases/01-foundation-goal-backbone/01-VERIFICATION.md` - Phase 1 已验证通过的边界和主链路

### 现有代码锚点
- `src/features/analysis-run/types.ts` - 当前 `Dimension`、`GoalCard`、`AnalysisRun` 的数据形状
- `src/features/dimensions/core-dimensions.ts` - 通用层 6 个核心维度的现有实现
- `src/features/dimensions/build-initial-dimensions.ts` - 当前基于 GoalCard 做轻量权重提示的起点
- `src/components/workspace/run-shell.tsx` - 当前工作台如何展示 GoalCard 和 dimensions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/dimensions/core-dimensions.ts`: 已经有 6 个稳定的通用层维度，可直接作为 Phase 2 的 core layer 输入。
- `src/features/dimensions/build-initial-dimensions.ts`: 已经有从 GoalCard 派生权重提示的最小实现，可以演进成更完整的维度合成入口。
- `src/features/analysis-run/types.ts`: `Dimension` 结构已经包含 `weight`、`direction`、`definition`、`evidenceNeeded`、`layer`，足够承接三层合并结果。
- `src/components/workspace/run-shell.tsx`: 工作台已经能展示维度摘要，后续可以在这个基础上扩展维度编辑和 SearchPlan 预览。

### Established Patterns
- 当前项目已经采用 `analysis run` 聚合根模式，Phase 2 产生的维度与 SearchPlan 应继续落在同一个 run 容器里，而不是另起独立对象体系。
- GoalCard 的输入与确认已经是单页闭环，Phase 2 应延续这个模式，不引入多步骤向导。
- 当前系统对“确认后写入结构化结果”的路径已经稳定，Phase 2 应继续以“先生成草案、再确认落库”为主。

### Integration Points
- 维度引擎会接在已确认 GoalCard 之后，成为 SearchPlan 的上游输入。
- SearchPlan 将成为 Phase 3 候选召回的直接输入，因此需要结构稳定、可回看、可确认。
- 维度编辑区与 SearchPlan 草案区都应挂在现有工作台和 run 详情页，而不是新开独立流程。

</code_context>

<specifics>
## Specific Ideas

- 本阶段要把“维度本身”变成可讨论、可编辑、可确认的对象，而不是只把它当成模型内部中间变量。
- 搜索计划本身也要可解释，因为这个项目不仅要求结果可解释，也要求“为什么这么搜”可解释。

</specifics>

<deferred>
## Deferred Ideas

- 真正的候选召回、去重、排序和深挖 - 属于 Phase 3
- 证据抽取和证据链展示 - 属于 Phase 3
- 打分、gap_priority 和阶段目标推导 - 属于 Phase 4 及之后

</deferred>

---
*Phase: 02-dimension-engine-search-planning*
*Context gathered: 2026-04-10*

# Phase 5: Visual Intelligence Surface - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只负责把 Phase 4 已经产出的 `scoring`、`gap priorities` 和 evidence-backed explanation 变成可钻取的可视化界面，让用户能从“分数结果”顺滑进入“关系理解”和“证据解释”。

本阶段的核心交付是：
- 当前目标与候选产品的雷达图对比
- `Goal / Dimension / Candidate / Gap` 的关系图
- 雷达图与关系图共用的解释面板

本阶段不负责生成 `stage_goals`，也不提前实现复杂的图编辑器、拖拽布局保存或新的评分逻辑。`VIZ-02` 中提到的阶段目标节点，在本阶段只保留扩展边界，不要求真实出现在图中，因为 Phase 6 才生成阶段目标数据。
</domain>

<decisions>
## Implementation Decisions

### 雷达图默认比较对象
- **D-01:** 雷达图默认展示“当前目标 + 总分最高的前 3 个已评分候选”。
- **D-02:** 用户可以手动增减参与比较的候选，但首屏不要求手选后才能出图。
- **D-03:** 雷达图只消费已生成 `scoring` 的候选，不能绕过评分链直接展示无解释来源的比较结果。

### 关系图主节点模型
- **D-04:** 关系图首版主节点固定为 `Goal / Dimension / Candidate / Gap`。
- **D-05:** `Evidence` 不进入主图，避免图面过密；证据只在右侧解释面板中展开。
- **D-06:** `Stage Goal` 节点在 Phase 5 不做真实渲染；如果界面需要兼容后续扩展，只保留节点类型边界，不提前做数据生成。

### 图形交互主承载方式
- **D-07:** 雷达图与关系图共用一个右侧解释面板，避免两套解释入口割裂。
- **D-08:** 点击维度、候选、gap 节点或边时，都应聚焦到同一个解释面板，并显示“为什么推荐 / 为什么关联 / 证据来自哪里”。
- **D-09:** 图形点击是解释入口，不是跳转到独立详情页；首版保持在同一工作台内完成联动。

### Phase 5 最小交付范围
- **D-10:** 首版交付包含“雷达图 + 关系图 + 联动解释面板 + 基本高亮筛选”。
- **D-11:** 本阶段不做拖拽布局编辑器、不做用户自定义排版保存。
- **D-12:** 本阶段不追求复杂可视分析工作台，只要把“看结果、点对象、追解释”这条链跑通。

### the agent's Discretion
- 雷达图的系列命名、默认排序、颜色映射和候选选择控件细节可由后续 planning / execution 决定，只要遵守“默认 top 3 scored candidates + 可手动增减”。
- 关系图的布局算法、边文案和节点视觉编码可由实现阶段决定，只要主节点模型保持 `Goal / Dimension / Candidate / Gap`。
- 右侧解释面板的字段顺序、折叠策略和响应式布局可由后续阶段决定，只要保持单一解释入口，不分裂成多套详情页。
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目级约束
- `.planning/PROJECT.md` - evidence-first 原则、可视化目标、开源与 GSD 约束
- `.planning/ROADMAP.md` - Phase 5 边界、目标与计划入口
- `.planning/REQUIREMENTS.md` - 本阶段对应需求：`VIZ-01`、`VIZ-02`
- `.planning/STATE.md` - 当前阶段位置与会话续接信息
- `AGENTS.md` - 项目级执行规范、中文输出要求与 KISS 原则

### 上游 phase 决策
- `.planning/phases/04-explainable-scoring-gap-engine/04-CONTEXT.md` - `unknown`、coverage、dimension score、gap benchmark 的已锁定决策
- `.planning/phases/04-explainable-scoring-gap-engine/04-01-SUMMARY.md` - run.scoring 契约与持久化 roundtrip
- `.planning/phases/04-explainable-scoring-gap-engine/04-02-SUMMARY.md` - scoring route、evidence ID 与生成链
- `.planning/phases/04-explainable-scoring-gap-engine/04-03-SUMMARY.md` - gap priority、解释面板与 E2E 结果

### 现有代码锚点
- `src/components/workspace/run-shell.tsx` - 当前工作台结构与 Scoring 之后的可视化接入点
- `src/components/workspace/scoring-panel.tsx` - 现有评分解释面板，可复用部分解释结构
- `src/components/workspace/candidates-panel.tsx` - 候选结果的现有展示方式
- `src/components/workspace/evidence-panel.tsx` - 证据按候选与维度分组的现有展示方式
- `src/components/workspace/analysis-placeholders.tsx` - 当前仍保留的后续占位区
- `src/features/analysis-run/types.ts` - `AnalysisRun`、`ScoringSnapshot`、`Candidate`、`Evidence` 的共享契约
- `src/features/scoring/build-scoring-snapshot.ts` - 雷达图与关系图所依赖的维度分和总体分结构
- `src/features/scoring/build-gap-priorities.ts` - 关系图中的 gap 节点来源与解释基础
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `run-shell.tsx` 已经把 GoalCard、Dimensions、SearchPlan、Candidates、Evidence、Scoring 串成单页工作台，Phase 5 最自然的做法是在 Scoring 之后承接视觉层，而不是新开独立流程。
- `scoring-panel.tsx` 已经有“摘要优先、点开解释”的节奏，Phase 5 可以把这个节奏扩展到图形交互，而不是重新发明一套解释系统。
- `build-scoring-snapshot.ts` 和 `build-gap-priorities.ts` 已经提供了维度分、总体分、gap benchmark 等结构，是雷达图和关系图的直接上游数据。

### Established Patterns
- 当前项目始终围绕单个 `analysis run` 聚合推进，图形状态也应由当前 run 派生，而不是引入额外持久化对象。
- 当前体验是顺序式分析工作台，Phase 5 的视觉层应作为解释增强层，而不是把工作流改造成图编辑器。
- evidence-first 仍然是最高优先级，可视化不能创造新结论，只能帮助用户更快钻取现有解释链。

### Integration Points
- 雷达图的系列应直接来自 `run.scoring` 中的目标轮廓与候选评分结果。
- 关系图的节点和边应由 `goal`、`dimensions`、`candidates`、`gap priorities` 组装得到，不新增独立采集链。
- 右侧解释面板应能复用当前 scoring / evidence / candidate 的现有字段，避免 UI 有内容但解释契约缺位。
</code_context>

<specifics>
## Specific Ideas

- 雷达图首版更像“可比较的评分入口”，不是排名榜；它要帮助用户快速选中值得继续看的候选。
- 关系图首版更像“导航图”，不是把每条 evidence 都画出来的知识图谱；Evidence 留在解释面板里更稳。
- 同一个对象无论从雷达图还是关系图进入，最终都应落到同一套解释面板，避免用户在两个视图里看到两种不同说法。
- 因为 Phase 6 才会生成 `stage_goals`，所以 Phase 5 不应为了满足表面节点完整性而制造假的阶段目标节点。
</specifics>

<deferred>
## Deferred Ideas

- `stage_goals` 的真实生成、展示和 GSD handoff - 属于 Phase 6
- 将 `Evidence` 也做成主图节点的重型知识图谱视图 - 不属于本阶段 MVP
- 节点拖拽保存、用户自定义布局、视图模板 - 不属于本阶段范围
- 独立详情页式可视分析台或复杂多栏 dashboard - 不属于本阶段首版范围

</deferred>

---

*Phase: 05-visual-intelligence-surface*
*Context gathered: 2026-04-10*

# Phase 6: Stage Goals & GSD Handoff - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只负责把 Phase 4 已经稳定下来的 `gap priorities`、`benchmark`、`coverage` 和证据解释链，转成可执行、可追溯、可继续消费的 `stageGoals` 结构，并给后续 GSD 流程提供结构化 handoff。

本阶段的核心交付是：
- 固定三段的阶段目标输出：验证阶段、MVP 阶段、差异化阶段
- 每个阶段目标都能回溯到 `gap`、维度和参考候选
- 一个可继续被后续 `/gsd-discuss-phase` 或规划流程消费的结构化 handoff 结果

本阶段不负责重新做候选召回、证据采集、评分公式或图形系统，也不直接生成新的 ROADMAP / PLAN 文档。它只把已有分析结果沉淀成“下一步该做什么”的结构化阶段目标。
</domain>

<decisions>
## Implementation Decisions

### 阶段拆分方式
- **D-01:** 阶段目标固定输出三段：`validation`、`mvp`、`differentiation`，分别对应验证阶段、MVP 阶段、差异化阶段。
- **D-02:** Phase 6 不按当前 run 临时动态增减阶段数量，避免 handoff 结构在不同 run 间漂移。
- **D-03:** 三段阶段目标是首版稳定骨架，后续如需更多阶段，应作为新能力而不是在本阶段内扩 scope。

### 阶段目标从 gap 推导的方式
- **D-04:** 阶段目标先基于 `gap_priority` 排序，再结合依赖关系分配到三段，而不是让模型直接自由发挥写 roadmap。
- **D-05:** `validation` 优先承接高优先级且偏风险验证、可行性验证的 gap；`mvp` 承接核心能力补齐；`differentiation` 承接拉开差异的高价值增强项。
- **D-06:** 模型在本阶段可以参与目标文案整理，但不能跳过 `gap -> stage goal` 的证据链直接拍脑袋生成结论。

### StageGoal 数据契约
- **D-07:** 现有 `StageGoal` 结构需要补强，至少要包含：`stage`、`objective`、`basedOnGaps`、`relatedDimensions`、`referenceProducts`、`successMetrics`、`deliverables`、`risks`。
- **D-08:** `benchmarkProducts` 的语义在本阶段应统一到更明确的 `referenceProducts`，避免它只像“分数基准”而没有“参考对象”含义。
- **D-09:** `basedOnGaps` 是首版必须补的字段，因为这个项目要求阶段目标必须能追到 gap，而不是只保留一段主观目标描述。

### GSD handoff 粒度
- **D-10:** 首版 handoff 只输出结构化 `stageGoals` 和每阶段建议 focus，不直接膨胀成完整 GSD phase/task 计划。
- **D-11:** handoff 要服务后续 GSD 流程，所以输出必须稳定、可解析、可复用，但不把本阶段做成第二套 planner。
- **D-12:** Phase 6 的导出重点是“让后续讨论和规划更快进入上下文”，而不是一次性替代 `/gsd-discuss-phase` 和 `/gsd-plan-phase`。

### the agent's Discretion
- `gap` 到阶段的具体依赖归并规则、优先级阈值和排序细节可由后续 research / planning 决定，只要不违背“先 gap，再阶段目标”的链路。
- `StageGoal` 在代码里的命名可按现有代码风格收敛为 camelCase，但导出语义必须保留本轮锁定的字段含义。
- handoff 的交互形态可由后续实现决定，例如面板、JSON 预览或复制动作，但首版不需要扩展成完整项目管理界面。
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目级约束
- `.planning/PROJECT.md` - evidence-first 原则、五个核心对象、阶段目标从 gap 推导、GSD 兼容约束
- `.planning/ROADMAP.md` - Phase 6 边界、目标和计划入口
- `.planning/REQUIREMENTS.md` - 本阶段对应需求：`STAG-01`、`STAG-02`、`STAG-03`
- `.planning/STATE.md` - 当前阶段位置与会话续接信息
- `AGENTS.md` - 项目级执行规范、中文输出要求与 KISS 原则

### 上游 phase 决策
- `.planning/phases/04-explainable-scoring-gap-engine/04-CONTEXT.md` - `unknown`、`coverage`、`gap benchmark` 与 explainable scoring 的已锁定决策
- `.planning/phases/05-visual-intelligence-surface/05-CONTEXT.md` - 可视化层如何消费 gap、candidate、dimension 的已锁定边界
- `.planning/phases/04-explainable-scoring-gap-engine/04-03-SUMMARY.md` - gap priority、解释面板与验证结果
- `.planning/phases/05-visual-intelligence-surface/05-03-SUMMARY.md` - 视觉层与解释面板挂载方式，说明 Phase 6 的自然接入位

### 现有代码锚点
- `src/features/analysis-run/types.ts` - `AnalysisRun`、`GapPriority`、`StageGoal` 的当前数据契约
- `src/features/scoring/build-gap-priorities.ts` - 当前 gap 结果的结构来源
- `src/components/workspace/run-shell.tsx` - 当前工作台顺序与 Phase 6 的接入位
- `src/components/workspace/analysis-placeholders.tsx` - 当前 `Stage Goals` placeholder
- `src/features/visuals/build-visual-explanation.ts` - gap、candidate、dimension 的解释聚合方式
- `src/features/visuals/build-relationship-graph.ts` - 当前图层如何消费 gap 结构

### 外部规格
- 无额外外部规格；本阶段需求以项目规划文件和以上决策为准
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/analysis-run/types.ts` 已经有 `StageGoal` 和 `GapPriority` 骨架，本阶段更适合在现有 run 聚合上补强字段，而不是另起一套阶段目标容器。
- `src/components/workspace/run-shell.tsx` 已经把分析流程串成单页工作台，Phase 6 最自然的做法是在现有视觉层之后补上阶段目标与 handoff，而不是新开独立页面流程。
- `src/components/workspace/analysis-placeholders.tsx` 还保留着 `Stage Goals` placeholder，说明现有界面本来就给本阶段留了入口。
- `src/features/visuals/build-visual-explanation.ts` 已经能把 gap、candidate、dimension 组织成可展开解释，这对阶段目标解释链是现成上游。

### Established Patterns
- 当前项目始终围绕单个 `analysis run` 聚合推进，新的阶段目标结果也应写回 `run.stageGoals`，保持 reopen-safe。
- 当前系统坚持 evidence-first 和 explainable-first，Stage Goal 不能脱离 gap、维度和参考候选独立存在。
- 当前工作台节奏是“生成结果 -> 查看摘要 -> 点开解释”，Phase 6 也应延续这个节奏，而不是直接做重型规划器。

### Integration Points
- 阶段目标生成应直接消费 `run.goal`、`run.dimensions`、`run.candidates`、`run.scoring.gaps` 和已有解释字段。
- 结构化 handoff 应建立在 `run.stageGoals` 之上，作为当前 run 的一个导出视图或接口，而不是单独旁路存储。
- Phase 6 实现完成后，应自然替换 `Stage Goals` placeholder，并成为后续 GSD 规划输入的桥接层。
</code_context>

<specifics>
## Specific Ideas

- 这个阶段的本质不是“让模型写 roadmap”，而是把已经算出来的 gap 整理成三段可执行目标。
- 三段固定结构是为了让不同 run 的输出稳定可比较，也方便后续 GSD 流程直接吃进去。
- `basedOnGaps` 必须保留，因为它是“阶段目标不是主观想象”的最直接证明。
- handoff 首版应更像“下一步规划线索包”，而不是完整项目管理系统。
</specifics>

<deferred>
## Deferred Ideas

- 直接输出完整 GSD phase/task 草案 - 超出本阶段首版边界
- 动态阶段数量、可自定义阶段模板 - 可作为后续增强能力
- 在 Phase 6 内继续扩展评分、召回、可视化逻辑 - 不属于本阶段范围

</deferred>

---

*Phase: 06-stage-goals-gsd-handoff*
*Context gathered: 2026-04-10*

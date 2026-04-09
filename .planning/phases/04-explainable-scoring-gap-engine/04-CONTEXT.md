# Phase 4: Explainable Scoring & Gap Engine - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只负责把已有的 `evidence` 结构化记录推导成可解释的评分结果，包括：
- 每个候选在每个维度上的 `dimension score`
- 候选的 `overall score`
- 基于维度差距推导出的 `gap priority`

本阶段不负责雷达图、关系图、阶段目标生成，也不提前做 Phase 5/6 的可视化和 GSD handoff。重点是把“证据如何变成分数、分数如何变成差距优先级”这条链做成可解释结果。

</domain>

<decisions>
## Implementation Decisions

### `unknown` 与总体评分
- **D-01:** 单个维度证据不足时，该维度状态显示为 `unknown`，不能按低分处理。
- **D-02:** `overall score` 只基于已有分数的维度重新归一计算，不把 `unknown` 维度按 0 分压低总分。
- **D-03:** 总体结果必须额外暴露覆盖信息，例如 `coverage`、`unknown_count` 或等价字段，让用户能看出整体分数是否建立在完整证据上。

### 维度分解释方式
- **D-04:** 每个维度默认先展示“维度结论 + 分数”的摘要结果，不要求首屏直接平铺所有证据细节。
- **D-05:** 用户展开某个维度后，必须能看到 evidence 贡献拆解，而不是只有结论。
- **D-06:** 维度分的解释链必须保持 evidence-first，不能出现脱离证据的模型主观总结。

### `gap priority` 基准
- **D-07:** 每个维度的 gap 都以该维度当前“有证据支撑的最强候选”作为 benchmark，不强制限定为 `same_goal` 或 `dimension_leader`。
- **D-08:** gap 结果里必须显式标出 benchmark 来自哪个候选，以及它属于什么推荐来源或匹配背景。
- **D-09:** 如果某个维度没有足够 benchmark 证据，就不伪造 gap 结果，应保留未知或缺失状态。

### Phase 4 结果粒度
- **D-10:** Phase 4 首版要输出结构化结果面板，至少包括候选总分、各维度分、`gap priority` 列表。
- **D-11:** 上述每类结果都必须可展开查看解释，而不是只给结论。
- **D-12:** Phase 4 不做常驻公式大面板，也不追求重型分析台，先把“可看、可点开、可追证据”的结构跑通。

### the agent's Discretion
- 具体评分公式中的系数、归一化细节、confidence 融合方式由后续 research / planning 决定，只要不违背 `unknown`、coverage 和 evidence-first 原则。
- UI 上的字段命名、展开交互文案、摘要句式可由实现阶段决定，只要保持结果可解释。
- `gap priority` 的内部计算步骤可以调整，但必须保留 benchmark 来源、差距大小和证据覆盖度这类解释支点。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目级约束
- `.planning/PROJECT.md` - 项目的 evidence-first 原则、`unknown` 处理原则、GSD 兼容约束
- `.planning/ROADMAP.md` - Phase 4 的边界、目标和计划入口
- `.planning/REQUIREMENTS.md` - 本阶段对应需求：`EVID-03`、`SCOR-01`、`SCOR-02`
- `.planning/STATE.md` - 当前阶段位置与会话续接信息
- `AGENTS.md` - 项目级执行规则、中文输出要求、KISS 原则

### 上游阶段决策
- `.planning/phases/02-dimension-engine-search-planning/02-CONTEXT.md` - 维度、SearchPlan 与确认式工作流的已锁定决策
- `.planning/phases/03-candidate-recall-evidence-intake/03-CONTEXT.md` - 候选召回、证据颗粒度、top-5 deep-dive 的已锁定决策
- `.planning/phases/03-candidate-recall-evidence-intake/03-VERIFICATION.md` - Phase 3 已验证通过的主链路边界

### 现有代码锚点
- `src/features/analysis-run/types.ts` - 当前 `AnalysisRun`、`Evidence`、`Candidate`、`StageGoal` 的数据骨架
- `src/features/analysis-run/repository.ts` - run 聚合的创建、读取、更新入口
- `src/features/analysis-run/run-mappers.ts` - run 聚合的持久化映射方式
- `src/components/workspace/run-shell.tsx` - 当前工作台的阶段顺序与结果承接位置
- `src/components/workspace/candidates-panel.tsx` - 候选结果的现有展示方式
- `src/components/workspace/evidence-panel.tsx` - 证据按候选和维度分组的现有展示方式
- `src/components/workspace/analysis-placeholders.tsx` - Phase 4/6 后续占位入口

### 外部规格
- 无额外外部规格；本阶段需求以项目规划文件和以上决策为准

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/analysis-run/types.ts`: 已经有 `Candidate`、`Evidence` 和 `AnalysisRun` 容器，Phase 4 可以继续沿用同一 run 聚合。
- `src/features/analysis-run/repository.ts`: 当前所有阶段结果都写回 run，评分结果也应延续这个模式。
- `src/components/workspace/evidence-panel.tsx`: 已经按“候选 -> 维度 -> evidence”做了分组，是 Phase 4 解释层最自然的上游输入。
- `src/components/workspace/run-shell.tsx`: 当前页面已经按 GoalCard、Dimensions、SearchPlan、Candidates、Evidence 的顺序展开，Phase 4 可以直接在 Evidence 之后承接评分结果。

### Established Patterns
- 当前项目采用单个 `analysis run` 聚合推进，每个阶段都把产物写回同一个 run，而不是拆成旁路对象。
- 当前工作流坚持“先生成结果，再允许用户查看解释”，Phase 4 也应延续这个可回看、可展开的节奏。
- 项目核心原则已经锁定为 evidence-first，任何评分结果都不能脱离 evidence 独立存在。

### Integration Points
- 评分结果应建立在 `run.candidates` 与 `run.evidence` 之上，并写回 run 聚合，供 Phase 5/6 继续消费。
- `Analysis Workspace` 里 Evidence 后面的空位就是 Phase 4 最自然的接入点，不需要新开独立流程。
- `gap priority` 的输出要能直接给 Phase 6 使用，因此需要结构稳定、可追 benchmark 和解释来源。

</code_context>

<specifics>
## Specific Ideas

- 总分不是唯一重点，coverage 也要跟着一起呈现，否则用户会把“部分证据推导出的高分”误读成完整结论。
- `dimension score` 和 `gap priority` 都应该优先呈现“结论摘要”，但必须允许点开看到证据贡献拆解。
- `gap priority` 的 benchmark 不区分 `same_goal` 或 `dimension_leader`，但界面上要把 benchmark 身份说清楚，避免用户误解成直接竞品对比。

</specifics>

<deferred>
## Deferred Ideas

- 雷达图、关系图、可视化联动 - 属于 Phase 5
- 基于 gap 结果生成阶段目标、交付物和 GSD handoff - 属于 Phase 6
- 更完整的公式常驻面板或重型分析控制台 - 不属于本阶段首版范围

</deferred>

---

*Phase: 04-explainable-scoring-gap-engine*
*Context gathered: 2026-04-10*

# Phase 3: Candidate Recall & Evidence Intake - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只负责把已确认的 `SearchPlan` 执行成可复用的候选列表与证据记录，让系统第一次真正落地 `search_plan -> candidates -> evidence` 这条主链路。它需要完成候选召回、候选归一化/去重、前 5 个候选的深挖，以及证据结构化入库。

本阶段不负责评分、`gap_priority`、雷达图、关系图、阶段目标生成，也不提前做图数据库或更复杂的情报分析。这些能力仍然属于后续 phase。
</domain>

<decisions>
## Implementation Decisions

### 候选召回来源边界
- **D-01:** 首轮候选召回允许使用 `official_site`、`docs`、`pricing`、`review` 这四类公开来源。
- **D-02:** 真正进入证据深挖时，官网、官方文档、价格页的优先级高于 review/community。
- **D-03:** 首版仍然坚持白名单公开源，不做无限制全网抓取。

### 候选去重与归一化
- **D-04:** 候选去重优先按官网域名进行；如果候选没有官网域名，再按标准化名称兜底。
- **D-05:** 同一个产品被多个 query 命中时，最终只保留一个 candidate，但要保留多个 `matched_modes`。
- **D-06:** Phase 3 需要把“同一候选被 same_goal 和 dimension_leader 同时命中”当成正常情况处理，而不是重复结果。

### 前 5 个深挖对象选择
- **D-07:** 前 5 个深挖对象不能只按单一分数硬排，而是先保留一部分 `same_goal` 直接对手。
- **D-08:** 剩余名额再按证据质量和维度覆盖补齐，确保既有直接对手，也有单点老师。
- **D-09:** 首版深挖上限仍固定为前 5 个候选，优先保证证据质量，而不是扩大数量。

### Evidence 最小颗粒度
- **D-10:** 一条 evidence 的最小单位是“一个 candidate + 一个 dimension + 一个来源片段”的结构化记录。
- **D-11:** 每条 evidence 必须保留来源类型、URL、原始片段、提取值、置信度、采集时间这些字段，作为后续评分的最小输入。
- **D-12:** 证据先按细颗粒度落库，再由后续 phase 在展示层或评分层聚合，不能在本阶段只保留候选级粗摘要。

### the agent's Discretion
- 候选召回阶段的具体 query 组合、执行顺序和内部排序细节可由后续 research / planning 决定，只要不违背“来源边界”和“前 5 深挖策略”。
- 候选标准化名称的具体算法、字段命名与内部 helper 划分可由实现阶段决定。
- Evidence 展示面板的具体布局、分组样式和交互文案可由后续 planning 决定，但数据颗粒度必须遵守本文件。
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目级约束
- `.planning/PROJECT.md` - 项目愿景、evidence-first 原则、白名单公开源约束、GSD 与开源协作要求
- `.planning/ROADMAP.md` - Phase 3 的边界、目标、成功标准与计划拆分入口
- `.planning/REQUIREMENTS.md` - 本阶段对应需求：`SRCH-03`、`SRCH-04`、`EVID-01`、`EVID-02`
- `.planning/STATE.md` - 当前阶段位置与会话续接信息
- `AGENTS.md` - 项目级执行规范、中文输出要求、KISS 原则与提交约束

### 上游 phase 决策
- `.planning/phases/02-dimension-engine-search-planning/02-CONTEXT.md` - Phase 2 已锁定的维度引擎与 SearchPlan 决策
- `.planning/phases/02-dimension-engine-search-planning/02-01-SUMMARY.md` - 三层维度、run 聚合与维度 route 的落地结果
- `.planning/phases/02-dimension-engine-search-planning/02-02-SUMMARY.md` - SearchPlan 生成、确认与 run 状态推进的落地结果
- `.planning/phases/02-dimension-engine-search-planning/02-03-SUMMARY.md` - 工作台中的 dimension / SearchPlan 面板与 E2E 主链路
- `.planning/phases/02-dimension-engine-search-planning/02-VERIFICATION.md` - Phase 2 已验证通过的主链路与边界

### 现有代码锚点
- `src/features/analysis-run/types.ts` - `Candidate`、`Evidence`、`SearchPlan`、`AnalysisRun` 的当前数据结构
- `src/db/schema.ts` - `analysis_runs` 中 candidates / evidence 的持久化入口
- `src/features/analysis-run/repository.ts` - run 聚合创建、读取、更新方式
- `src/features/search-plan/build-search-plan-input.ts` - SearchPlan 输入快照与 source hints
- `src/features/search-plan/generate-search-plan.ts` - `same_goal` / `dimension_leader` draft 的生成逻辑
- `src/components/workspace/analysis-placeholders.tsx` - Candidates / Evidence 当前仍是 placeholder 的工作台位置

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/analysis-run/types.ts`: 已经定义了 `Candidate` 与 `Evidence` 的聚合位置，Phase 3 不需要重新发明数据容器。
- `src/db/schema.ts`: `analysis_runs` 已经能直接持久化 `candidates` 和 `evidence` JSONB。
- `src/features/search-plan/build-search-plan-input.ts`: 已经提供 `sourceHintPool`，可以作为 Phase 3 召回来源边界的上游输入。
- `src/features/search-plan/generate-search-plan.ts`: 已经区分 `same_goal` 与 `dimension_leader`，可直接作为候选召回的执行输入。

### Established Patterns
- 当前项目始终围绕单个 `analysis run` 聚合根推进，新能力应继续写回同一个 run，而不是拆成旁路存储。
- 上游阶段已经形成“先生成草案、再确认、再执行下一层”的模式，Phase 3 要继续遵守这个顺序。
- Mock 优先、可重复验证、E2E 锁主链路已经是现有项目的固定模式。

### Integration Points
- 候选召回应从已确认的 `searchPlan` 开始，结果写回 `run.candidates`。
- 证据抓取与结构化应围绕“前 5 个已选候选”执行，结果写回 `run.evidence`。
- 工作台中当前的 Candidates / Evidence placeholder 是 Phase 3 的自然接入点，不需要新开一套独立流程。
</code_context>

<specifics>
## Specific Ideas

- 本阶段不是简单“搜一堆产品名”，而是要把候选为什么出现、是 direct rival 还是 dimension teacher，明确体现在 candidate 结构上。
- 候选深挖策略要体现项目本质：既看同目标直接对手，也看在单个维度上可借鉴的老师。
- Evidence 的最小颗粒度必须足够细，这样后面点击维度、评分解释、阶段目标反推时才不需要返工数据模型。
</specifics>

<deferred>
## Deferred Ideas

- 候选评分、证据驱动打分、`unknown` 与低分区分 - 属于 Phase 4
- 雷达图、关系图、点击边查看解释 - 属于 Phase 5
- 阶段目标、roadmap 反推、GSD handoff - 属于 Phase 6
- Git 工程输入、网站链接输入、无限制全网搜索 - 仍然不属于 v1 当前阶段

</deferred>

---

*Phase: 03-candidate-recall-evidence-intake*
*Context gathered: 2026-04-10*

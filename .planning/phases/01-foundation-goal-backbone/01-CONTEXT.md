# Phase 1: Foundation & Goal Backbone - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只负责建立项目骨架、核心对象和 GoalCard 输入链路，让系统具备一次分析的基础容器。这个阶段不实现真实候选召回、证据抓取、评分计算和阶段目标生成，只为后续 phase 建立稳定的数据与交互基础。

</domain>

<decisions>
## Implementation Decisions

### GoalCard 交互
- **D-01:** Phase 1 采用单页工作台交互，而不是多步骤向导。
- **D-02:** 页面上方是目标描述与补充文本输入区，生成后在同页下方展示可编辑 GoalCard。
- **D-03:** 用户必须先确认或编辑 GoalCard，后续分析步骤才允许继续。

### Analysis Run 生命周期
- **D-04:** 每次输入生成一个独立的 `analysis run`，作为一次完整分析的容器。
- **D-05:** Phase 1 先支持 run 的创建、查看和重新打开，不做 run 之间的复杂对比能力。
- **D-06:** `analysis run` 内部固定承载 `goal`、`dimensions`、`candidates`、`evidence`、`stage_goals` 五类核心对象。

### 数据骨架范围
- **D-07:** Phase 1 就建立 5 个核心对象的稳定 schema，不等到后续 phase 再反复改模型。
- **D-08:** 本阶段真正跑通 `goal` 和 `dimensions` 的基础链路；`candidates`、`evidence`、`stage_goals` 先提供 schema、存储入口和空状态。
- **D-09:** `dimensions` 在本阶段只要求支持通用层模板和基础字段，不提前实现复杂领域层生成策略。

### 最小交付形态
- **D-10:** Phase 1 交付的是可运行的纵向切片，不是静态原型。
- **D-11:** 纵向切片至少包含基础页面、Goal 输入、GoalCard 生成与编辑、run 持久化、初版通用维度模板写入。
- **D-12:** 页面可以展示 `candidates`、`evidence`、`stage_goals` 的空区域，用来体现完整骨架，但不在本阶段实现真实业务能力。

### 工程组织
- **D-13:** Phase 1 先按单仓单应用模式推进，不拆多仓。
- **D-14:** 一个 Web 应用作为主入口，服务层、存储层、LLM 编排层先在同一项目内按模块分层。
- **D-15:** 优先控制复杂度，不在本阶段引入额外服务拆分。

### the agent's Discretion
- GoalCard 表单的具体布局、字段排序和视觉细节由后续规划与实现决定。
- `analysis run` 的内部模块命名、目录组织和服务分层细节由后续规划决定。
- 初版通用维度模板的具体条目数与默认权重策略可由研究和规划阶段细化，但必须遵守项目级 evidence-first 原则。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目范围与原则
- `.planning/PROJECT.md` - 项目愿景、核心价值、开源约束、evidence-first 原则、输入边界
- `AGENTS.md` - 项目级工作方式、GSD 约束、开源上传节奏
- `README.md` - 面向开源协作的项目定义、MVP 范围和仓库协作约定

### Phase 1 范围
- `.planning/ROADMAP.md` - Phase 1 的边界、目标、成功标准和计划草案
- `.planning/REQUIREMENTS.md` - Phase 1 覆盖的需求：`GOAL-01` ~ `GOAL-04`、`DIME-01`
- `.planning/STATE.md` - 当前项目位置和阶段上下文

### 研究与架构方向
- `.planning/research/STACK.md` - 当前推荐技术栈，尤其是 React + TypeScript、OpenAI Responses API、PostgreSQL + JSONB + pgvector
- `.planning/research/ARCHITECTURE.md` - 目标系统组件划分与主链路，明确本阶段只落骨架和入口
- `.planning/research/SUMMARY.md` - MVP 收敛结论，强调先打通最小闭环

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 当前仓库还没有业务代码可复用。
- 已存在的可复用资产主要是 `.planning/` 中的项目定义、需求、路线图和研究结论。

### Established Patterns
- 当前唯一已锁定的模式是 evidence-first：任何后续能力都不能跳过证据链原则。
- 项目按 GSD 工作流推进，规划文件与状态文件是公开资产并纳入版本控制。
- Phase 1 应优先做稳定数据骨架，而不是先做复杂交互或智能能力。

### Integration Points
- 新代码将从一个 Web 应用主入口开始。
- Phase 1 需要为后续的候选召回、证据抽取、评分和阶段目标生成预留统一的 `analysis run` 结构。
- 持久化层需要从一开始就能保存 run、goal 和 dimensions，为后续 phase 继续扩展。

</code_context>

<specifics>
## Specific Ideas

- 这一阶段更像“把分析容器做出来”，不是“先把竞品搜索做出来”。
- 页面要直接让人看到完整骨架：GoalCard 是实的，后面几个区域先可以是空的，但结构要在。
- 交互上优先简洁、单页、低跳转，避免向导式流程把基础链路做复杂。

</specifics>

<deferred>
## Deferred Ideas

- 历史 run 之间的复杂对比 - 延后到后续 phase
- 领域层与项目层维度的复杂生成策略 - 主要属于 Phase 2
- 候选召回、证据抓取、评分、图形展示和阶段目标生成 - 分别在后续 phase 实现

</deferred>

---

*Phase: 01-foundation-goal-backbone*
*Context gathered: 2026-04-10*

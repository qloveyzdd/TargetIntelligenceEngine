# Target Intelligence Engine

## What This Is

Target Intelligence Engine 是一个面向产品负责人、创业者、方案设计者的目标 intelligence engine。用户输入自然语言目标描述与补充文本后，系统先生成结构化 GoalCard，再基于通用层、领域层、项目层三层维度引擎，从公开资料中召回 `same_goal` 候选与 `dimension_leader` 候选，提取证据、计算分数、分析差距，并通过雷达图与技能链式关系图展示结果。

它的重点不是“把图画出来”，而是把“目标 -> 维度 -> 候选 -> 证据 -> 阶段目标”这条链做成可解释系统。每个维度分数、每条关系、每个阶段目标都必须能够追溯到公开证据，否则宁可显示未知，也不做黑箱判断。

## Core Value

让目标拆解、竞品映射和阶段规划建立在可追溯证据上，而不是模型主观判断。

## Requirements

### Validated

<!-- 已上线并被验证有价值的需求。 -->

(None yet - ship to validate)

### Active

<!-- 当前范围，仍然是待验证假设。 -->

- [ ] 用户可以输入自然语言目标描述和补充文本，系统生成可编辑的 GoalCard
- [ ] 系统可以生成并合并通用层、领域层、项目层维度，并支持权重调整
- [ ] 系统可以按 `same_goal` 和 `dimension_leader` 两种模式召回候选产品
- [ ] 系统可以为候选产品的关键维度提取公开证据并生成可解释评分
- [ ] 系统可以通过雷达图和关系图展示目标、维度、候选、证据、阶段目标之间的关系
- [ ] 系统可以从 gap_priority 结果反推出验证阶段、MVP 阶段、差异化阶段的目标输出

### Out of Scope

<!-- 明确不做的范围，避免范围反复回流。 -->

- Git 工程、仓库和网站链接解析作为首版必做输入 - v1 先聚焦自然语言输入，把证据链跑通
- 无限深抓全网资料 - 首版只做白名单公开源，先召回 20-50 个候选，再深挖前 5 个
- 没有证据支撑的主观打分 - 缺证据显示 `unknown`，不把未知当低分
- 首版直接引入图数据库 - 先用 Postgres + JSONB + pgvector 跑通核心链路
- 一开始就做完整企业级情报平台 - 先完成 evidence-first 的 MVP，再扩能力边界

## Context

这个项目的核心数据骨架固定为 5 个对象：`goal`、`dimensions`、`candidates`、`evidence`、`stage_goals`。`goal` 负责承载目标名称、类别、JTBD、硬约束、软偏好、当前阶段；`dimensions` 负责定义维度含义、方向、权重、证据要求；`candidates` 负责表达候选产品及其匹配模式；`evidence` 负责记录具体来源、片段、提取值、置信度、时间；`stage_goals` 负责承载阶段目标、参考产品、指标与风险。

维度体系采用三层结构：
- 通用层：成本、性能、易用性、生态、可靠性、合规
- 领域层：根据产品领域补充，例如 AI 工具常见的模型质量、上下文能力、知识接入、延迟、私有部署
- 项目层：从当前输入动态抽取，例如“私有部署”“多语言”“适合中小团队”

检索必须拆成两个模式：
- `same_goal`：寻找解决同类问题的直接对手
- `dimension_leader`：寻找某个维度特别强的单点老师

分数体系不允许黑箱。维度分数必须从证据反推，整体分数由维度权重聚合，阶段目标从 gap_priority 结果推导，而不是让模型直接拍脑袋生成 roadmap。

前端交互采用双层展示：
- 上层是雷达图，做目标与候选的多维对比
- 下层是技能链式关系图，支持点维度、点产品、点边、点阶段目标继续钻取

项目的实际使用场景偏向产品决策与阶段规划，因此除了展示对比结果，还需要输出可继续消费的结构化阶段目标，以便后续进入 GSD 的 `discuss -> plan -> execute` 流程。

## Constraints

- **工作流**: 项目初始化、阶段规划和执行方式需要兼容 GSD 工作流，后续可以直接衔接 `/gsd-discuss-phase`、`/gsd-plan-phase`、`/gsd-execute-phase`
- **输入范围**: v1 只支持自然语言目标描述与可选补充文本，避免一次接入过多输入类型导致系统复杂化
- **证据优先**: 任何维度分数、候选推荐、阶段目标都必须挂接证据；证据不足时显示 `unknown`
- **数据来源**: 首版只使用公开可访问的白名单来源；官方页、官方文档、价格页权重高于社区与评测
- **实现策略**: 先打通 `目标 -> 维度 -> 证据 -> 阶段目标` 主链路，再扩展图数据库、更多输入源、更多自动化抓取能力
- **工程原则**: 保持 KISS，优先简单、稳定、可维护的数据模型与流程，而不是提前做复杂架构

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 固定 5 个核心对象作为数据骨架 | 先稳定数据形状，再扩能力，避免后续输出漂移 | - Pending |
| 维度引擎采用通用层 + 领域层 + 项目层 | 纯动态维度不稳定，纯固定维度又不够贴近目标 | - Pending |
| 检索分为 `same_goal` 和 `dimension_leader` | 既要找直接对手，也要找单点老师 | - Pending |
| 评分采用 evidence-first 方式 | 黑箱打分不可解释，无法可靠生成阶段目标 | - Pending |
| 缺证据显示 `unknown` 而不是低分 | 避免把信息不足误判成能力不足 | - Pending |
| MVP 只深挖前 5 个候选 | 控制抓取成本与复杂度，先做高质量证据链 | - Pending |
| MVP 数据层先用 Postgres + JSONB + pgvector | 关系数据、结构化文档、相似检索都能兼顾，复杂度可控 | - Pending |
| 项目需要符合 GSD 使用规范 | 后续阶段可直接进入 GSD 计划与执行链路 | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after initialization*

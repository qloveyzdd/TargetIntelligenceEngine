# Research: FEATURES

**Date:** 2026-04-10  
**Scope:** Target Intelligence Engine MVP 功能边界

## Table Stakes

这些能力不做，项目就不是一个真正可用的目标 intelligence engine。

### Goal Intake

- 目标描述输入
- 补充上下文输入
- GoalCard 结构化输出
- GoalCard 可回看、可修正

**Complexity:** Medium  
**Dependencies:** 输入界面、结构化输出 schema、持久化

### Dimension Engine

- 生成三层维度集合
- 展示维度解释、方向、权重
- 支持手动调权和禁用
- 保留每个维度需要的证据类型

**Complexity:** Medium  
**Dependencies:** GoalCard、维度 schema、评分器

### Candidate Recall

- `same_goal` 模式召回
- `dimension_leader` 模式召回
- 候选列表与召回原因展示
- 控制深挖范围

**Complexity:** Medium  
**Dependencies:** 搜索计划、候选归一化、排序策略

### Evidence Chain

- 候选-维度对的证据收集
- 证据来源、片段、提取值、时间、置信度记录
- 点击即可回看证据
- 缺证据显式标记为 `unknown`

**Complexity:** High  
**Dependencies:** 抓取器、抽取 schema、存储模型

### Explainable Scoring

- 维度得分可拆解
- 总分由维度权重聚合
- gap_priority 可排序
- 所有分数挂 `evidence_ids`

**Complexity:** High  
**Dependencies:** 证据模型、评分公式、UI 展示

### Visual Exploration

- 雷达图对比
- 关系图钻取
- 点击维度看强项产品与差距
- 点击产品看推荐原因
- 点击边看关系推导依据

**Complexity:** High  
**Dependencies:** 评分结果、节点模型、交互状态

### Stage Goal Output

- 自动生成验证阶段、MVP 阶段、差异化阶段 3 个阶段目标
- 每个阶段绑定参考产品、参考维度、成功指标、风险
- 输出结构化结果供后续 GSD 消费

**Complexity:** Medium  
**Dependencies:** gap_priority、候选对比结果、输出 schema

## Differentiators

这些能力会让产品从“能用”提升到“真正有判断价值”。

- 三层维度引擎：避免每次换 prompt 就完全变样
- `same_goal` 与 `dimension_leader` 双模式检索：让候选库既有直接对手，也有单点老师
- evidence-first 评分：不靠主观模型打分
- `unknown` 与低分分离：减少错误引导
- 边可解释关系图：用户能看出“为什么是这条关系”
- 基于 gap_priority 推阶段目标：阶段规划不再是纯主观 brainstorming

## Anti-Features

这些能力当前不应该进入 v1。

| Anti-feature | Why not now |
|--------------|-------------|
| 任意输入源一次全支持 | 先把自然语言输入与证据链做稳 |
| 全量候选深抓 | 成本太高，首版噪声太大 |
| 无证据自动评分 | 会直接破坏产品核心可信度 |
| 一开始上图数据库 | 架构复杂度超过当前问题规模 |
| 自动输出完整商业计划书 | 偏离 MVP 核心价值，且解释链不够直接 |

## Feature Dependencies

1. Goal Intake -> Dimension Engine  
2. Dimension Engine -> Search Plan / Candidate Recall  
3. Candidate Recall -> Evidence Chain  
4. Evidence Chain -> Explainable Scoring  
5. Explainable Scoring -> Visual Exploration  
6. Explainable Scoring -> Stage Goal Output

## MVP Boundary

MVP 先做：
- 文本目标输入
- 6-8 个维度的首版生成与调权
- 双模式召回
- 前 5 候选深挖
- 雷达图
- 关系图点击解释
- 三阶段目标输出

不做：
- Git 工程输入
- 网站 URL 输入
- 多轮协作与团队权限
- 全量抓取编排平台

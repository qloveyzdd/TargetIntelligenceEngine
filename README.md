# Target Intelligence Engine

Target Intelligence Engine 是一个面向产品负责人、创业者、方案设计者的目标 intelligence engine。它不是单纯“找竞品”的工具，而是把 `目标 -> 维度 -> 候选产品 -> 证据 -> 阶段目标` 这条链做成可解释系统。

用户输入自然语言目标描述和补充文本后，系统会生成 GoalCard，构建三层维度引擎，召回同目标候选与单点维度强者，提取公开证据，做可解释评分和差距分析，最后通过雷达图与技能链式关系图展示，并输出阶段目标、成功指标和风险。

## 核心原则

- 证据优先：没有证据的结论不算结论
- 缺证据显示 `unknown`，不把未知当低分
- 检索分为 `same_goal` 和 `dimension_leader`
- 阶段目标从 gap 推导，不靠模型主观拍脑袋
- `.planning/` 是公开项目资产，和代码一起维护

## 核心对象

项目围绕 5 个核心对象构建：

- `goal`: 当前目标或项目的结构化定义
- `dimensions`: 用来分析目标的维度、权重、方向与证据需求
- `candidates`: 候选产品集合，包含匹配模式与强项维度
- `evidence`: 每个候选在每个维度上的证据条目
- `stage_goals`: 从差距分析反推出的阶段目标

## MVP 范围

当前规划中的 MVP 聚焦这条最短闭环：

1. 输入一句目标描述和补充文本
2. 自动生成 GoalCard
3. 生成 6-8 个维度并支持调权
4. 按 `same_goal` 和 `dimension_leader` 双模式召回候选
5. 深挖前 5 个候选
6. 生成可追溯评分与 gap_priority
7. 展示雷达图和关系图
8. 输出验证 / MVP / 差异化三个阶段目标

## 技术方向

- Frontend: React + TypeScript
- Radar / score charts: Apache ECharts
- Interactive relation graph: React Flow
- AI orchestration: OpenAI Responses API + Structured Outputs + Function Calling
- Data: PostgreSQL + JSONB + pgvector
- Retrieval / crawling: 白名单公开源 + Playwright

## 开源协作约定

- 本仓库按开源项目维护
- `.planning/` 公开，规划、研究、需求和路线图默认纳入版本控制
- 关键节点需要上传远端仓库：
  - 初始化完成后
  - 每个 phase 完成后
  - 每个 milestone 完成后

## GSD 工作方式

这个项目按 GSD 工作流推进，当前初始化产物已就位：

- 项目定义：[`PROJECT.md`](./.planning/PROJECT.md)
- 需求定义：[`REQUIREMENTS.md`](./.planning/REQUIREMENTS.md)
- 路线图：[`ROADMAP.md`](./.planning/ROADMAP.md)
- 项目状态：[`STATE.md`](./.planning/STATE.md)

下一步通常从 Phase 1 开始：

```bash
/gsd-discuss-phase 1
```

## 当前状态

- 项目已完成初始化
- 已定义 6 个 phase
- v1 已收敛为证据优先的最小闭环

## 仓库

- Remote: [qloveyzdd/TargetIntelligenceEngine](https://github.com/qloveyzdd/TargetIntelligenceEngine)

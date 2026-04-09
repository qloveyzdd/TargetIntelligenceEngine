# Research: STACK

**Date:** 2026-04-10  
**Scope:** Target Intelligence Engine MVP 技术栈建议  
**Method:** 基于目标结构、交互需求与官方文档做技术选型收敛

## Recommended Stack

| Area | Recommendation | Why | Confidence |
|------|----------------|-----|------------|
| App shell | React + TypeScript Web App | 需要高交互、多视图状态管理、节点图与图表混合展示 | High |
| Radar / score charts | Apache ECharts | 官方支持丰富图表、关系图、Canvas/SVG 渲染与多维数据可视化，适合雷达图和分数对比 | High |
| Drill-down graph | React Flow | 官方定位就是 interactive flowgraphs，支持自定义 node/edge、拖拽、缩放、连线，适合技能链式关系图 | High |
| LLM orchestration | OpenAI Responses API + Structured Outputs + Function Calling | Responses API 原生支持 stateful context、built-in tools、web search、function calling；Structured Outputs 适合稳定输出 GoalCard / Dimensions / SearchPlan / StageGoals | High |
| Search / evidence retrieval | 白名单搜索 + 两阶段检索 | 先召回 20-50 个候选，再深挖前 5 个，能控制抓取成本并提升证据质量 | High |
| Persistence | PostgreSQL + JSONB + pgvector | 结构化业务数据、证据文档、向量召回可以放在同一库；pgvector 支持 exact/approximate nearest neighbor search，同时保留 JOIN 与 ACID | High |
| Dynamic page capture | Playwright worker | 官方支持 Chromium / Firefox / WebKit，适合处理动态页面、价格页和文档页采集 | High |

## Prescriptive Guidance

### 1. 前端层

- 采用 React + TypeScript 作为基础交互层
- 雷达图、分数对比、趋势摘要用 ECharts
- 关系链、节点钻取、边解释、阶段目标挂点用 React Flow

这样做的核心原因是把“图表”和“关系网络”分层处理：
- ECharts 更适合数值对比、雷达、柱状、辅助统计
- React Flow 更适合节点关系、拖拽、展开、钻取和解释性 UI

### 2. LLM 与结构化输出层

MVP 不要做成一个大 prompt 全包，拆成 4 个固定输出对象：
- `GoalCard`
- `Dimensions`
- `SearchPlan`
- `StageGoals`

这样能稳定接口边界，也便于后面加缓存、重试和审计。

### 3. 数据层

优先使用 Postgres 单库承载：
- 目标记录
- 维度定义与权重
- 候选产品与召回原因
- 证据条目与原文片段
- 阶段目标输出
- 向量索引与相似召回

这是一个推断性工程建议：对当前 MVP 来说，先把关系数据和检索数据放到同一处最省复杂度。只有当“技能链”真的发展成重度多跳路径分析，再评估图数据库。

### 4. 采集层

- 首版只抓白名单公开源
- 官方页、价格页、官方文档优先
- 社区与评测页作为补充，而不是主证据源
- 动态页面交给 Playwright worker

## What Not to Use Yet

- 不要一开始引入 Neo4j 或其他图数据库：当前问题先是“解释链跑通”，不是“复杂图算法”
- 不要做全网实时深抓：成本高、噪声大、证据可信度难控
- 不要让模型直接给最终分数：先抽证据，再算分
- 不要把所有结构塞进一条自由文本响应里：结构化输出更稳

## Sources

- OpenAI Responses API: [platform.openai.com/docs/api-reference/responses/tutorials-and-guides](https://platform.openai.com/docs/api-reference/responses/tutorials-and-guides)
- OpenAI Structured Outputs: [platform.openai.com/docs/guides/structured-outputs](https://platform.openai.com/docs/guides/structured-outputs)
- OpenAI Tools / Web Search: [platform.openai.com/docs/guides/tools?api-mode=responses](https://platform.openai.com/docs/guides/tools?api-mode=responses)
- React Flow Overview: [reactflow.dev/docs/concepts/introduction](https://reactflow.dev/docs/concepts/introduction)
- Apache ECharts Features: [echarts.apache.org/en/feature.html](https://echarts.apache.org/en/feature.html)
- Apache ECharts Homepage: [echarts.apache.org/en/](https://echarts.apache.org/en/)
- pgvector README: [github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)
- Playwright Intro: [playwright.dev/docs/intro](https://playwright.dev/docs/intro)
- Playwright Docker: [playwright.dev/docs/docker](https://playwright.dev/docs/docker)

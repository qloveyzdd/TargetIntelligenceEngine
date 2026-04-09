# Research: SUMMARY

**Date:** 2026-04-10

## Key Findings

### Stack

- 前端建议采用 React + TypeScript Web App
- 雷达图和分数对比建议用 Apache ECharts
- 技能链式关系图建议用 React Flow
- 结构化生成建议采用 OpenAI Responses API + Structured Outputs + Function Calling
- 数据层建议先用 PostgreSQL + JSONB + pgvector
- 动态页面采集建议用 Playwright worker

### Table Stakes

- GoalCard 结构化
- 三层维度引擎
- 双模式候选召回
- 可追溯证据链
- explainable scoring
- 雷达图 + 关系图
- 三阶段目标输出

### Watch Out For

- 不要黑箱打分
- 不要让维度每次都漂
- 不要把 `unknown` 当低分
- 不要把直接对手和单点老师混为一类
- 不要在 MVP 阶段过早引入图数据库
- 不要先做炫酷可视化，再补数据骨架

## Recommended MVP Cut

只做以下闭环：
1. 输入目标描述
2. 生成 GoalCard
3. 生成 6-8 个维度并支持调权
4. 按 `same_goal` 和 `dimension_leader` 双模式召回候选
5. 深挖前 5 个候选
6. 生成可追溯评分与 gap_priority
7. 展示雷达图和关系图
8. 输出验证 / MVP / 差异化三个阶段目标

## Architecture Direction

这是一个 evidence-first 的推导系统，最重要的是：

- 固定核心对象
- 固定评分与解释边界
- 把证据作为一等公民
- 让 UI 成为解释层，而不是业务真相来源

## Sources

- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses/tutorials-and-guides)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [OpenAI Tools](https://platform.openai.com/docs/guides/tools?api-mode=responses)
- [React Flow Overview](https://reactflow.dev/docs/concepts/introduction)
- [Apache ECharts Features](https://echarts.apache.org/en/feature.html)
- [Apache ECharts Homepage](https://echarts.apache.org/en/)
- [pgvector README](https://github.com/pgvector/pgvector)
- [Playwright Intro](https://playwright.dev/docs/intro)
- [Playwright Docker](https://playwright.dev/docs/docker)

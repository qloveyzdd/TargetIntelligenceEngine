# Phase 1: Foundation & Goal Backbone - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 01-foundation-goal-backbone
**Areas discussed:** GoalCard 交互, Analysis Run 生命周期, 数据骨架范围, 最小交付形态, 工程组织

---

## GoalCard 交互

| Option | Description | Selected |
|--------|-------------|----------|
| 单页工作台 | 输入、生成、编辑都在同一页完成 | Yes |
| 多步骤向导 | 分步骤收集输入并逐步确认 | |
| 纯表单配置页 | 先手工填写结构化字段，再生成 | |

**User's choice:** 全部按推荐  
**Notes:** 采用推荐默认方案：单页工作台，上方输入，下方展示可编辑 GoalCard，确认后才能继续。

---

## Analysis Run 生命周期

| Option | Description | Selected |
|--------|-------------|----------|
| 独立 run 容器 | 每次输入生成独立 run，可创建、查看、重新打开 | Yes |
| 单一全局工作区 | 所有分析共享同一状态 | |
| 先不做 run 概念 | 只做临时会话，不持久化分析容器 | |

**User's choice:** 全部按推荐  
**Notes:** 采用推荐默认方案：每次输入都是独立 `analysis run`，Phase 1 不做复杂历史对比。

---

## 数据骨架范围

| Option | Description | Selected |
|--------|-------------|----------|
| 一次建齐 5 个核心对象 | 先稳定 schema，后续 phase 往里填能力 | Yes |
| 只做 goal + dimensions | 其他对象以后再补 | |
| 先做页面，不先定模型 | 等功能长出来再定数据结构 | |

**User's choice:** 全部按推荐  
**Notes:** 采用推荐默认方案：5 个核心对象的 schema 全部建立，但本阶段只跑通 `goal` 和 `dimensions` 的基础链路。

---

## 最小交付形态

| Option | Description | Selected |
|--------|-------------|----------|
| 可运行纵向切片 | 有真实页面、GoalCard、run 持久化、空骨架区域 | Yes |
| 静态原型 | 只做 UI 原型，不接真实数据 | |
| 纯数据模型 | 只做 schema 和接口，不做页面 | |

**User's choice:** 全部按推荐  
**Notes:** 采用推荐默认方案：优先交付一个能跑通的最小骨架，而不是静态原型。

---

## 工程组织

| Option | Description | Selected |
|--------|-------------|----------|
| 单仓单应用 | 一个 Web 应用主入口，模块化分层 | Yes |
| 前后端拆仓 | 早期就拆多个应用和服务 | |
| 多工作区/多入口 | 先做复杂工程组织 | |

**User's choice:** 全部按推荐  
**Notes:** 采用推荐默认方案：Phase 1 保持单仓单应用，先控制复杂度。

---

## the agent's Discretion

- GoalCard 具体 UI 布局与视觉层次
- `analysis run` 的内部目录命名与模块拆分
- 通用维度模板的具体字段数量和默认权重细节

## Deferred Ideas

- 历史 run 对比
- 复杂领域层 / 项目层维度生成
- 候选召回、证据抓取、评分、图形展示、阶段目标生成

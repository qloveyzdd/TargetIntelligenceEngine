# Research: ARCHITECTURE

**Date:** 2026-04-10  
**Scope:** Target Intelligence Engine MVP 架构建议

## Major Components

### 1. Goal Intake Layer

负责接收用户输入并生成首版 GoalCard。

**Responsibilities**
- 接收自然语言目标描述与补充文本
- 生成 `goal` 对象
- 提供 GoalCard 审阅与修订入口

### 2. Dimension Engine

负责根据 GoalCard 合成三层维度。

**Responsibilities**
- 加载通用层维度模板
- 注入领域层维度模板
- 从当前输入提取项目层维度
- 计算默认权重、方向、证据需求

### 3. Search Planning Layer

把当前目标转换成可执行检索任务。

**Responsibilities**
- 生成 `same_goal` 查询
- 生成 `dimension_leader` 查询
- 控制每轮召回数量与深挖数量
- 记录检索计划与来源白名单

### 4. Candidate Retrieval Layer

负责候选召回、归一化、去重和排序。

**Responsibilities**
- 召回同目标候选
- 召回维度冠军候选
- 合并为统一候选池
- 标记 `matched_modes`

### 5. Evidence Extraction Layer

负责候选页面采集与证据结构化。

**Responsibilities**
- 抓取公开页面内容
- 提取候选-维度相关证据
- 输出 `evidence` 对象
- 记录来源、片段、提取值、置信度、时间

### 6. Scoring & Gap Engine

把证据转成维度得分、总体得分与差距优先级。

**Responsibilities**
- 按维度聚合证据
- 计算 `dimension_score`
- 计算 `overall_score`
- 计算 `gap_priority`
- 显式处理 `unknown`

### 7. Visualization Layer

负责结果的解释型展示。

**Responsibilities**
- 雷达图对比目标与候选
- 关系图展示 Goal / Dimension / Candidate / Evidence / Stage Goal
- 点击查看解释链与原始证据

### 8. Stage Goal Generator

基于 gap 结果生成阶段目标。

**Responsibilities**
- 产出验证阶段、MVP 阶段、差异化阶段
- 绑定参考产品、维度、指标、风险
- 输出结构化结果供 GSD 后续流程消费

### 9. Persistence Layer

负责保存所有结构化对象与中间状态。

**Responsibilities**
- 保存 analysis run
- 保存 goal / dimensions / candidates / evidence / stage_goals
- 保存检索与抽取缓存
- 保存向量表示与相似检索索引

## Data Flow

1. 用户输入目标描述与补充文本  
2. Goal Intake 生成 GoalCard  
3. Dimension Engine 合成三层维度  
4. Search Planning 生成双模式检索计划  
5. Candidate Retrieval 召回并排序候选  
6. Evidence Extraction 对前 5 候选做深挖  
7. Scoring & Gap Engine 计算维度分数和差距优先级  
8. Visualization Layer 展示雷达图与关系图  
9. Stage Goal Generator 输出阶段目标  
10. Persistence Layer 保存整次 run

## Suggested Data Model

```json
{
  "goal": {},
  "dimensions": [],
  "candidates": [],
  "evidence": [],
  "stage_goals": []
}
```

在 MVP 中，这 5 类对象已经足够支撑完整闭环。

## Build Order Implications

推荐构建顺序：

1. Goal Intake + Persistence 基础骨架
2. Dimension Engine
3. Search Planning + Candidate Retrieval
4. Evidence Extraction
5. Scoring & Gap Engine
6. Visualization Layer
7. Stage Goal Generator

原因很简单：如果没有稳定的数据骨架，后面的图和阶段目标都会漂。

## Architecture Notes

- 这是一个明显的“证据链优先”系统，不是“界面优先”系统
- `same_goal` 和 `dimension_leader` 必须从模型和 UI 上区分开
- `evidence` 是核心资产，不是附属调试信息
- UI 只是解释层，真正的产品价值在结构化数据与推导链

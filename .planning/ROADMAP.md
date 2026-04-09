# Roadmap: Target Intelligence Engine

## Overview

This roadmap starts from the data backbone instead of the visual layer. We first stabilize GoalCard, dimensions, dual-mode retrieval, evidence intake, and explainable scoring, then move into visualization and Stage Goal output.

## Phases

- [x] **Phase 1: Foundation & Goal Backbone** - 固定核心对象、GoalCard 输入与 run 容器 (completed 2026-04-10)
- [x] **Phase 2: Dimension Engine & Search Planning** - 建立三层维度引擎与双模式 SearchPlan (completed 2026-04-10)
- [x] **Phase 3: Candidate Recall & Evidence Intake** - 召回候选产品并沉淀结构化证据 (completed 2026-04-10)
- [ ] **Phase 4: Explainable Scoring & Gap Engine** - 从证据推导维度分数、总体分数与 gap priority
- [ ] **Phase 5: Visual Intelligence Surface** - 用雷达图和关系图展示结果并支持钻取
- [ ] **Phase 6: Stage Goals & GSD Handoff** - 输出阶段目标并生成可供 GSD 使用的结构化结果

## Phase Details

### Phase 1: Foundation & Goal Backbone
**Goal**: 建立项目骨架、五个核心对象和 GoalCard 输入链路  
**Depends on**: Nothing  
**Requirements**: GOAL-01, GOAL-02, GOAL-03, GOAL-04, DIME-01  
**Plans**: 3

Plans:
- [x] 01-01: 建立应用骨架与 analysis run 数据模型
- [x] 01-02: 实现 GoalCard 生成与编辑流
- [x] 01-03: 接入首版通用维度模板与持久化

### Phase 2: Dimension Engine & Search Planning
**Goal**: 把目标输入转成稳定维度和可确认的 SearchPlan  
**Depends on**: Phase 1  
**Requirements**: DIME-02, DIME-03, DIME-04, SRCH-01, SRCH-02  
**Plans**: 3

Plans:
- [x] 02-01: 实现三层维度生成、合并和归一化
- [x] 02-02: 实现 SearchPlan schema、生成和确认
- [x] 02-03: 把维度编辑和 SearchPlan 接入工作台并补齐 E2E

### Phase 3: Candidate Recall & Evidence Intake
**Goal**: 召回候选产品并把关键证据结构化保存  
**Depends on**: Phase 2  
**Requirements**: SRCH-03, SRCH-04, EVID-01, EVID-02  
**Plans**: 3

Plans:
- [x] 03-01: 实现候选召回、归一化、排序和失效链
- [x] 03-02: 实现证据任务队列、页面加载和结构化抽取
- [x] 03-03: 把 Candidates / Evidence 接入工作台并补齐 E2E

### Phase 4: Explainable Scoring & Gap Engine
**Goal**: 从证据推出维度得分、overall score 和 gap priority  
**Depends on**: Phase 3  
**Requirements**: EVID-03, SCOR-01, SCOR-02  
**Plans**: 3

Plans:
- [ ] 04-01: 固化 run.scoring 契约与持久化 roundtrip
- [ ] 04-02: 实现 evidence 稳定 ID、评分生成路由与失效链
- [ ] 04-03: 实现 gap priority、解释面板与聚焦 E2E

### Phase 5: Visual Intelligence Surface
**Goal**: 把分数与关系结果做成可钻取的可视化界面  
**Depends on**: Phase 4  
**Requirements**: VIZ-01, VIZ-02  
**Plans**: 3

Plans:
- [ ] 05-01: 实现雷达图和分数对比视图
- [ ] 05-02: 实现关系图节点、边与钻取交互
- [ ] 05-03: 实现证据、差距和推荐理由的联动面板

### Phase 6: Stage Goals & GSD Handoff
**Goal**: 从 gap 结果生成阶段目标，并输出 GSD 可消费结果  
**Depends on**: Phase 5  
**Requirements**: STAG-01, STAG-02, STAG-03  
**Plans**: 2

Plans:
- [ ] 06-01: 实现 Stage Goals 生成与解释逻辑
- [ ] 06-02: 实现结构化导出与 GSD handoff 格式

## Progress

**Execution Order:** 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Goal Backbone | 3/3 | Complete | 2026-04-10 |
| 2. Dimension Engine & Search Planning | 3/3 | Complete | 2026-04-10 |
| 3. Candidate Recall & Evidence Intake | 3/3 | Complete | 2026-04-10 |
| 4. Explainable Scoring & Gap Engine | 0/3 | Not started | - |
| 5. Visual Intelligence Surface | 0/3 | Not started | - |
| 6. Stage Goals & GSD Handoff | 0/2 | Not started | - |

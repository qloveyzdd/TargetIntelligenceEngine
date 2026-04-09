# Roadmap: Target Intelligence Engine

## Overview

这条路线从“稳定数据骨架”开始，而不是从“漂亮图形”开始。我们先把 GoalCard、维度引擎、双模式检索、证据链、可解释评分这几个基础环节打通，再把结果表达到雷达图和关系图，最后产出可继续进入 GSD 流程的阶段目标。这样路线会更稳，也更符合这个项目 evidence-first 的本质。

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Foundation & Goal Backbone** - 固定核心对象、输入模型与 GoalCard 流程
- [ ] **Phase 2: Dimension Engine & Search Planning** - 建立三层维度引擎与双模式检索计划
- [ ] **Phase 3: Candidate Recall & Evidence Intake** - 召回候选并建立证据链
- [ ] **Phase 4: Explainable Scoring & Gap Engine** - 把证据转成可解释评分与差距优先级
- [ ] **Phase 5: Visual Intelligence Surface** - 用雷达图和关系图做结果解释与钻取
- [ ] **Phase 6: Stage Goals & GSD Handoff** - 生成阶段目标并输出可供 GSD 消费的结果

## Phase Details

### Phase 1: Foundation & Goal Backbone
**Goal**: 建立项目骨架、核心对象和 GoalCard 输入链路
**Depends on**: Nothing (first phase)
**Requirements**: GOAL-01, GOAL-02, GOAL-03, GOAL-04, DIME-01
**Success Criteria** (what must be TRUE):
  1. 用户提交目标描述和补充文本后，可以得到结构化 GoalCard
  2. 系统可以保存 `goal`、`dimensions`、`candidates`、`evidence`、`stage_goals` 五类核心对象骨架
  3. 用户可以在进入检索前修改 GoalCard
**Plans**: 3 plans

Plans:
- [ ] 01-01: 建立应用骨架与 analysis run 数据模型
- [ ] 01-02: 实现 GoalCard 生成与编辑流程
- [ ] 01-03: 接入初版通用层维度模板与持久化

### Phase 2: Dimension Engine & Search Planning
**Goal**: 把目标输入转成稳定维度和双模式检索计划
**Depends on**: Phase 1
**Requirements**: DIME-02, DIME-03, DIME-04, SRCH-01, SRCH-02
**Success Criteria** (what must be TRUE):
  1. 用户可以调整维度权重、方向、定义和是否启用
  2. 系统可以同时生成 `same_goal` 和 `dimension_leader` 两类检索计划
  3. 每个检索计划都能说明它要找什么、为什么找、找多少
**Plans**: 3 plans

Plans:
- [ ] 02-01: 实现三层维度合成与人工调权
- [ ] 02-02: 实现双模式 SearchPlan 生成器
- [ ] 02-03: 建立候选归一化、去重和排序输入接口

### Phase 3: Candidate Recall & Evidence Intake
**Goal**: 召回候选产品并把关键证据结构化保存
**Depends on**: Phase 2
**Requirements**: SRCH-03, SRCH-04, EVID-01, EVID-02
**Success Criteria** (what must be TRUE):
  1. 用户可以看到候选产品列表及其 `matched_modes`
  2. 系统只深挖前 5 个候选，并能说明召回理由
  3. 每个候选-维度对都可以挂接结构化证据
**Plans**: 3 plans

Plans:
- [ ] 03-01: 实现候选召回、归一化与排序
- [ ] 03-02: 实现白名单来源抓取与结构化抽取
- [ ] 03-03: 实现 evidence 存储模型与查看接口

### Phase 4: Explainable Scoring & Gap Engine
**Goal**: 从证据链稳定推导分数、差距和优先级
**Depends on**: Phase 3
**Requirements**: EVID-03, SCOR-01, SCOR-02
**Success Criteria** (what must be TRUE):
  1. 系统可以明确区分低分与 `unknown`
  2. 用户可以查看维度得分由哪些证据组成
  3. 系统可以输出 overall score 与 gap_priority 结果
**Plans**: 2 plans

Plans:
- [ ] 04-01: 实现维度评分、总体评分与 unknown 处理
- [ ] 04-02: 实现 gap_priority 计算与解释接口

### Phase 5: Visual Intelligence Surface
**Goal**: 把分数和关系以可钻取方式展示给用户
**Depends on**: Phase 4
**Requirements**: VIZ-01, VIZ-02
**Success Criteria** (what must be TRUE):
  1. 用户可以通过雷达图比较目标与候选在各维度的差异
  2. 用户可以在关系图中点击维度、产品、边和阶段目标查看解释
  3. 图层展示与底层结构化结果一致，不单独发明业务语义
**Plans**: 3 plans

Plans:
- [ ] 05-01: 实现雷达图与分数对比视图
- [ ] 05-02: 实现关系图节点、边和钻取交互
- [ ] 05-03: 实现证据、差距、推荐理由的联动面板

### Phase 6: Stage Goals & GSD Handoff
**Goal**: 从 gap 结果生成阶段目标，并输出 GSD 可消费产物
**Depends on**: Phase 5
**Requirements**: STAG-01, STAG-02, STAG-03
**Success Criteria** (what must be TRUE):
  1. 系统可以生成验证阶段、MVP 阶段、差异化阶段三个阶段目标
  2. 每个阶段目标都绑定相关维度、参考产品、成功指标、交付物和风险
  3. 阶段目标可以以结构化结果导出，并能直接服务后续 GSD 规划
**Plans**: 2 plans

Plans:
- [ ] 06-01: 实现 StageGoals 生成与解释逻辑
- [ ] 06-02: 实现阶段目标结构化导出与 GSD 对接格式

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Goal Backbone | 0/3 | Not started | - |
| 2. Dimension Engine & Search Planning | 0/3 | Not started | - |
| 3. Candidate Recall & Evidence Intake | 0/3 | Not started | - |
| 4. Explainable Scoring & Gap Engine | 0/2 | Not started | - |
| 5. Visual Intelligence Surface | 0/3 | Not started | - |
| 6. Stage Goals & GSD Handoff | 0/2 | Not started | - |

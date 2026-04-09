# Requirements: Target Intelligence Engine

**Defined:** 2026-04-10  
**Core Value:** 让目标拆解、竞品映射和阶段规划建立在可追溯证据上，而不是模型主观判断

## v1 Requirements

### Goal Intake

- [x] **GOAL-01**: 用户可以输入一句自然语言目标描述发起分析
- [x] **GOAL-02**: 用户可以补充额外上下文文本，例如约束、偏好和当前阶段
- [x] **GOAL-03**: 系统可以把输入整理成结构化 GoalCard，至少包含名称、类别、JTBD、硬约束、软偏好、当前阶段
- [x] **GOAL-04**: 用户可以在执行检索前查看并修改 GoalCard

### Dimensions

- [x] **DIME-01**: 系统可以输出通用层、领域层、项目层合并后的维度列表
- [x] **DIME-02**: 用户可以调整每个维度的权重
- [x] **DIME-03**: 用户可以查看并修改维度方向、定义和证据需求
- [x] **DIME-04**: 用户可以禁用与当前目标无关的维度

### Candidate Search

- [x] **SRCH-01**: 用户可以执行 `same_goal` 检索以寻找同目标候选产品
- [x] **SRCH-02**: 用户可以针对选中维度执行 `dimension_leader` 检索以寻找单点强者
- [ ] **SRCH-03**: 系统可以展示候选产品列表，并标明每个候选的 `matched_modes`
- [ ] **SRCH-04**: 系统在 v1 中只对首轮排序前 5 个候选做深挖

### Evidence

- [ ] **EVID-01**: 用户可以查看某个候选在某个维度下的证据列表
- [ ] **EVID-02**: 每条证据至少包含 `source_type`、`url`、`excerpt`、`extracted_value`、`confidence`、`captured_at`
- [ ] **EVID-03**: 当某个维度证据不足时，系统显示 `unknown` 而不是低分

### Scoring

- [ ] **SCOR-01**: 用户可以查看维度得分及其证据贡献拆解
- [ ] **SCOR-02**: 用户可以查看整体分数与 `gap_priority` 结果

### Visualization

- [ ] **VIZ-01**: 用户可以查看当前目标与候选产品的雷达图对比
- [ ] **VIZ-02**: 用户可以在关系图中点击维度、产品、边和阶段目标节点查看解释信息

### Stage Goals

- [ ] **STAG-01**: 系统可以自动生成验证阶段、MVP 阶段、差异化阶段三个阶段目标
- [ ] **STAG-02**: 每个阶段目标都包含 `related_dimensions`、`reference_products`、`success_metrics`、`deliverables`、`risks`
- [ ] **STAG-03**: 用户可以导出阶段目标的结构化结果，供后续 GSD 规划流程消费

## v2 Requirements

### Additional Inputs

- **INPT-01**: 用户可以直接输入 Git 工程进行分析
- **INPT-02**: 用户可以直接输入网站链接进行分析
- **INPT-03**: 用户可以混合使用文本、链接和工程作为输入源

### Collaboration

- **COLL-01**: 多个用户可以共享同一个分析工作区
- **COLL-02**: 用户可以对证据和阶段目标留下批注

### Advanced Intelligence

- **ADVN-01**: 系统可以对历史分析运行进行相似目标召回
- **ADVN-02**: 系统可以对阶段目标生成更完整的执行建议
- **ADVN-03**: 系统可以支持图数据库驱动的多跳关系探索

## Out of Scope

| Feature | Reason |
|---------|--------|
| 全网无限深抓 | 首版先控制抓取成本和证据质量 |
| 无证据自动评分 | 与项目核心价值冲突 |
| 一开始接入图数据库 | 当前 MVP 不需要复杂图算法 |
| 自动输出完整商业计划书 | 超出证据链 MVP 范围 |
| 团队权限与多租户 | 不是首版核心路径 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GOAL-01 | Phase 1 | Complete |
| GOAL-02 | Phase 1 | Complete |
| GOAL-03 | Phase 1 | Complete |
| GOAL-04 | Phase 1 | Complete |
| DIME-01 | Phase 1 | Complete |
| DIME-02 | Phase 2 | Complete |
| DIME-03 | Phase 2 | Complete |
| DIME-04 | Phase 2 | Complete |
| SRCH-01 | Phase 2 | Complete |
| SRCH-02 | Phase 2 | Complete |
| SRCH-03 | Phase 3 | Pending |
| SRCH-04 | Phase 3 | Pending |
| EVID-01 | Phase 3 | Pending |
| EVID-02 | Phase 3 | Pending |
| EVID-03 | Phase 4 | Pending |
| SCOR-01 | Phase 4 | Pending |
| SCOR-02 | Phase 4 | Pending |
| VIZ-01 | Phase 5 | Pending |
| VIZ-02 | Phase 5 | Pending |
| STAG-01 | Phase 6 | Pending |
| STAG-02 | Phase 6 | Pending |
| STAG-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 - OK

---
*Requirements defined: 2026-04-10*  
*Last updated: 2026-04-10 after Phase 2 completion*

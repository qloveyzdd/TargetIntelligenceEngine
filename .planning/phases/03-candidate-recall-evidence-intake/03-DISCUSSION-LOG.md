# Phase 3: Candidate Recall & Evidence Intake - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 03-candidate-recall-evidence-intake
**Areas discussed:** 候选召回来源边界, 候选去重与归一化规则, 前 5 个深挖对象选择, Evidence 最小颗粒度

---

## 候选召回来源边界

| Option | Description | Selected |
|--------|-------------|----------|
| A | 首轮召回允许 `official_site / docs / pricing / review`，但深挖证据时优先官网、文档、价格页 | X |
| B | 首轮只允许 `official_site / docs / pricing`，完全不碰 review/community | |
| C | 首轮把 review/community 也和官网同权处理 | |

**User's choice:** A  
**Notes:** 用户希望首轮召回面不要过窄，但真正进入证据链时仍然坚持官方源优先，避免稀释 evidence-first。  

---

## 候选去重与归一化规则

| Option | Description | Selected |
|--------|-------------|----------|
| A | 只按官网域名去重 | |
| B | 先按官网域名去重，没有官网再按标准化名称兜底，同产品保留多个 `matched_modes` | X |
| C | 不去重，先全量保留，后面再人工处理 | |

**User's choice:** B  
**Notes:** 用户接受 MVP 做稳妥的双层去重，不想把重复候选留到后面再人工清理。  

---

## 前 5 个深挖对象选择

| Option | Description | Selected |
|--------|-------------|----------|
| A | 先保留一部分 `same_goal` 直接对手，再按证据质量和维度覆盖补齐到前 5 | X |
| B | 完全按 SearchPlan 命中次数排序 | |
| C | 完全按官网信息完整度排序 | |

**User's choice:** A  
**Notes:** 用户希望候选池既能看到直接对手，也能看到单点老师，不接受纯机械排序。  

---

## Evidence 最小颗粒度

| Option | Description | Selected |
|--------|-------------|----------|
| A | 一条 evidence 就是一个“候选 + 维度 + 来源片段”记录 | X |
| B | 先按候选聚合一大块 evidence，后面再拆 | |
| C | 先只存 URL，不存片段和提取值 | |

**User's choice:** A  
**Notes:** 用户明确希望后续评分、点击解释和阶段目标反推都建立在细颗粒度证据上，而不是粗摘要。  

## the agent's Discretion

- 候选召回 query 的内部组合、归一化 helper 的具体实现、Evidence 面板的展示方式交给后续 research / planning。

## Deferred Ideas

- 候选打分、gap 计算、可视化展示、阶段目标生成仍然保持在后续 phase，不在本次讨论内展开。

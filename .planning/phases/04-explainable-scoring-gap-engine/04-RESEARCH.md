# Phase 4: Explainable Scoring & Gap Engine - Research

**Researched:** 2026-04-10
**Domain:** evidence-first 评分、`unknown` 处理、总体分聚合、`gap priority` 计算与解释
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md and project rules)

### Locked Decisions
- **D-01:** 单个维度证据不足时显示 `unknown`，不能按低分处理。
- **D-02:** `overall score` 只基于已知维度重归一计算，不把 `unknown` 按 0 分压低总分。
- **D-03:** 总体结果必须额外暴露 `coverage`、`unknown_count` 或等价覆盖信息。
- **D-04:** 每个维度默认先展示“结论 + 分数”，展开后再看证据贡献拆解。
- **D-05:** 维度解释链必须能落回 evidence 贡献，而不是只有最终结论。
- **D-06:** 评分解释必须保持 evidence-first，不能出现脱离 evidence 的模型主观总结。
- **D-07:** `gap priority` 的 benchmark 必须是当前维度最强的 evidence-backed 候选，不强制限定为 `same_goal` 或 `dimension_leader`。
- **D-08:** gap 结果里必须标明 benchmark 候选及其来源背景。
- **D-09:** benchmark 证据不足时，不伪造 gap 结果，应保留未知状态。
- **D-10:** Phase 4 首版要输出结构化结果面板，至少包括候选总分、各维度分、`gap priority` 列表。
- **D-11:** 上述每类结果都必须可展开查看解释。
- **D-12:** Phase 4 不做常驻公式大面板，先把“可看、可点开、可追证据”的结构跑通。

### Project-Level Constraints
- **P-01:** `AGENTS.md` 明确要求任何分数、关系和阶段目标都要能反查 `evidence_ids`。
- **P-02:** 项目继续沿用单个 `analysis run` 聚合根，不要为了评分层过早拆复杂子系统。
- **P-03:** 当前 `Evidence` 记录仍是自由文本 `excerpt + extractedValue`，尚未包含可直接聚合的数值评分。

### the agent's Discretion
- 具体评分系数、字段命名、面板布局、route 命名和 mock 细节可以由 planning 决定。
- 只要不违背 evidence-first、`unknown`、coverage 和 `evidence_ids` 追踪原则，内部实现可以适度收敛。

### Deferred Ideas (OUT OF SCOPE)
- 雷达图和关系图联动
- 阶段目标生成与 GSD handoff
- 真正的“来源发布时间 freshness”建模

</user_constraints>

<research_summary>
## Summary

Phase 4 最稳的做法不是再让模型“直接给候选打分”，而是把评分拆成两层：

1. **Evidence Assessment 层**
   - 输入单条 `evidence` 和对应 `dimension`
   - 输出该 evidence 在该维度上的标准化信号，例如 `evidenceScore`、`status`、`rationale`
   - 每条结果都绑定稳定 `evidenceId`

2. **Deterministic Aggregation 层**
   - 本地代码基于 `evidenceScore + sourceWeight + confidence` 聚合出 `dimension score`
   - 再按已知维度重归一得到 `overall score`
   - 再基于 benchmark 与 cohort baseline 计算 `gap priority`

这样做的好处是：
- **不黑箱。** 模型不再直接输出候选总分，只负责把单条证据映射成结构化信号。
- **可追溯。** 每个维度分和总体分都能回挂到 `evidence_ids`。
- **更适配现有数据。** 当前 `Evidence` 只有文本和提取值，没有现成数值分；如果不先做 evidence assessment，本地无法可靠聚合。
- **不破坏 Phase 1 的核心对象约束。** 评分可以作为 run 上的派生快照持久化，不需要重构目标、维度、候选、证据这五个核心对象。

**Primary recommendation:**  
Phase 4 继续沿用当前 `Next.js Route Handlers + OpenAI Responses API + Structured Outputs + PostgreSQL JSONB`，但评分本身改成“模型只评估单条 evidence，最终分数在本地确定性聚合”。
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.x | 承接评分 / gap Route Handlers 与工作台结果面板 | 当前项目已在使用，继续沿用最稳 |
| OpenAI Responses API | `openai@6.5.0` | 对单条 evidence 做 Structured Outputs 评估 | 当前仓库已有稳定接入方式 |
| Structured Outputs | OpenAI 官方能力 | 把 evidence assessment 限制为严格 JSON 输出 | 已在 GoalCard / Dimensions / SearchPlan / Evidence 中验证过 |
| Drizzle + PostgreSQL JSONB | 当前仓库版本 | 持久化评分快照和 gap 结果到 `analysis_runs` | 保持 run 聚合根，不引入新表 |

### Supporting
| Library / Tool | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 3.x | 覆盖评分公式、`unknown`、coverage、gap 规则 | 所有纯逻辑都应优先落在这里 |
| Playwright Test | 1.56.x | 覆盖“Evidence -> Scoring -> Reopen” 主链路 | 保证结果面板不是临时计算态 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 直接让模型对候选打总分 | 单条 evidence 评估 + 本地聚合 | 候选级模型评分更快，但会破坏 explainable scoring |
| 纯本地正则 / heuristics 给 evidence 打分 | Structured Outputs 做 evidence assessment | 纯本地对 `excerpt` 和 `extractedValue` 的泛化能力不足，尤其是 usability / ecosystem 这类维度 |
| 新建独立评分表 | 继续挂在 `analysis_runs` JSONB | 独立表更细，但当前查询模式仍是“围绕一个 run 回看评分结果”，JSONB 更简单 |
| 真实 freshness 因子 | v1 先把 freshness 固定为 1.0 | 当前只有 `capturedAt`，没有可信的来源发布时间，不应伪造新鲜度 |
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Pattern 1: Stable Evidence Identity Before Scoring
**What:**  
在进入评分层前，先给每条 evidence 补稳定 `id`，后续所有 contribution、dimension score、overall score、gap priority 都只引用 `evidenceIds`。

**Why:**  
项目规则已经要求所有分数都能反查 `evidence_ids`。如果继续依赖数组位置或 `url + excerpt` 临时拼 key，重开 run 或重生成时会很脆弱。

### Pattern 2: Assess Evidence, Not Candidate
**What:**  
先对单条 evidence 做标准化评估，再由本地代码聚合，不允许模型直接对候选或整维度给黑箱总分。

**Why:**  
当前 `Evidence` 记录不是直接可算的数值信号；但只让模型评估单条 evidence，仍然满足“分数从证据反推”的原则。

### Pattern 3: Unknown Is a Coverage State
**What:**  
`unknown` 只表示“这个维度没有足够可评估 evidence”，不等于低分。总体分只用已知维度重归一，同时保留 coverage。

**Why:**  
这是用户明确锁定的产品原则，也是 Phase 4 最容易做错的地方。

### Pattern 4: Frontier Benchmark, Cohort Baseline
**What:**  
对每个维度保留两个参考值：
- `frontierScore`: 当前维度最强的 evidence-backed 候选
- `cohortBaselineScore`: 若存在 `same_goal` 候选，则取该维度最强 `same_goal` 分数；否则取所有 evidence-backed 候选的中位数

`gap priority` 由 `frontierScore - cohortBaselineScore` 驱动，同时记录 frontier 候选是谁。

**Why:**  
这样既遵守了“benchmark 取当前最强候选”的决定，也避免凭空编造“目标自己当前是多少分”。

### Pattern 5: Persist a Derived Scoring Snapshot
**What:**  
评分层不要篡改原始 `candidates` 和 `evidence`，而是在 run 上保存一个派生的 scoring snapshot。

**Recommended shape:**
```ts
type EvidenceAssessment = {
  evidenceId: string;
  candidateId: string;
  dimensionId: string;
  evidenceScore: number | null;
  status: "supporting" | "limiting" | "mixed" | "insufficient";
  rationale: string;
};

type DimensionScorecard = {
  candidateId: string;
  dimensionId: string;
  status: "known" | "unknown";
  score: number | null;
  coverage: number;
  evidenceIds: string[];
  topEvidenceIds: string[];
  summary: string;
};

type CandidateScorecard = {
  candidateId: string;
  overallScore: number | null;
  coverage: number;
  unknownCount: number;
  dimensionScores: DimensionScorecard[];
};

type GapPriority = {
  dimensionId: string;
  status: "known" | "unknown";
  benchmarkCandidateId: string | null;
  benchmarkScore: number | null;
  cohortBaselineScore: number | null;
  gapSize: number | null;
  priority: number | null;
  evidenceIds: string[];
  summary: string;
};
```

**Why:**  
这能保持原始证据不变，又让 Phase 5/6 有稳定输入。

### Recommended Weighting

建议 v1 固定这组简单权重：

```ts
const sourceWeight = {
  official_site: 1.0,
  docs: 0.9,
  pricing: 0.85,
  review: 0.6
} as const;
```

建议公式：

```ts
evidenceContributionWeight = sourceWeight[sourceType] * confidence;

dimensionScore =
  weightedAverage(evidenceScore, evidenceContributionWeight) * 100;

overallScore =
  weightedAverage(knownDimensionScore, normalizedEnabledDimensionWeight);

gapPriority =
  dimensionWeight * gapSize * benchmarkCoverage * dependencyFactor;
```

其中：
- `freshnessFactor` 在 v1 固定为 `1.0`
- `dependencyFactor` 在 v1 固定为 `1.0`
- 先保证可解释和稳定，不提前发明尚不存在的数据依赖

</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 候选级总分 | 让模型读完整个候选后直接打总分 | evidence assessment + 本地聚合 | 候选级打分不可解释 |
| evidence 引用 | 用数组下标或 URL 临时拼引用 | 稳定 `evidence.id` | Phase 5/6 会继续消费这些引用 |
| `unknown` 处理 | 没证据就按 0 分 | `status: unknown` + coverage | 避免错误惩罚未知 |
| freshness | 用 `capturedAt` 假装来源发布时间 | v1 固定 `1.0` | 当前没有可信发布时间 |
| gap 结果 | 直接编造“目标自己当前分数” | frontier vs cohort baseline | 当前没有第一方产品能力证据 |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: 没有 `evidence_ids`
**What goes wrong:**  
分数能显示出来，但点不开贡献来源，Phase 5/6 只能重新回推，最终返工数据模型。

**How to avoid:**  
Phase 4 一开始就给 evidence 补稳定 `id`，所有评分结果只挂 `evidenceIds`。

### Pitfall 2: 直接对 candidate 或 dimension 让模型打分
**What goes wrong:**  
会得到看似顺滑但无法审计的黑箱分数，和项目核心原则冲突。

**How to avoid:**  
模型只评估单条 evidence；维度分、总分和 gap 全部本地算。

### Pitfall 3: 把 `unknown` 混成低分
**What goes wrong:**  
数据稀缺的候选会被系统性压低，导致后续阶段目标偏掉。

**How to avoid:**  
`unknown` 与低分严格分离，总分旁边强制展示 coverage。

### Pitfall 4: 用 `capturedAt` 伪装 freshness
**What goes wrong:**  
所有 evidence 往往在同一轮采集，freshness 其实没有区分度，最后只是制造伪精度。

**How to avoid:**  
v1 把 freshness 设为常数，等以后有来源发布时间再启用。

### Pitfall 5: gap 直接等于 frontier 分数
**What goes wrong:**  
看起来都有 gap，但本质是在重复“这个维度很重要”，没有真正的差距语义。

**How to avoid:**  
gap 必须带一个 cohort baseline，哪怕只是 `same_goal` 最佳分数或 cohort 中位数。
</common_pitfalls>

<validation_architecture>
## Validation Architecture

Phase 4 适合继续沿用“单元逻辑验证 + 一条主链路 E2E”的组合：

1. **快速反馈层**
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test:unit -- --run`

2. **主链路验证层**
   - `npm run test:e2e`
   - 覆盖主路径：
     - Evidence 已存在时可生成 scoring snapshot
     - `unknown` 维度不会被当成 0 分
     - `overall score` 会显示 coverage / unknown_count
     - gap 列表会标出 frontier benchmark
     - 重开 `/runs/[runId]` 后评分结果仍然存在

建议测试落点：
- `src/features/scoring/evidence-assessment-schema.test.ts`
- `src/features/scoring/score-dimensions.test.ts`
- `src/features/scoring/score-overall.test.ts`
- `src/features/scoring/build-gap-priorities.test.ts`
- `src/app/api/runs/[runId]/scoring/route.test.ts`
- `tests/e2e/scoring-gap-workflow.spec.ts`

本阶段依然不应该依赖真实外网测试。  
evidence assessment 需要提供稳定 mock 路径，让 unit 和 E2E 在 `MOCK_OPENAI=true` 下可重复通过。
</validation_architecture>

<sources>
## Sources

### Primary (HIGH confidence)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) - 严格 JSON Schema 输出与 `strict: true`
- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses) - 当前仓库使用的统一 Responses 接口

### Repo-local (HIGH confidence)
- `AGENTS.md` - `evidence_ids` 追溯要求与项目级 KISS / evidence-first 约束
- `.planning/PROJECT.md` - evidence-first、`unknown` 处理和核心对象边界
- `.planning/REQUIREMENTS.md` - `EVID-03`、`SCOR-01`、`SCOR-02`
- `.planning/phases/04-explainable-scoring-gap-engine/04-CONTEXT.md` - 用户已锁定的 Phase 4 决策
- `src/features/analysis-run/types.ts` - 当前 run 聚合与 Evidence 结构
- `src/features/evidence/extract-evidence.ts` - 当前 evidence 由 Structured Outputs 生成，但尚无数值评分
- `src/app/api/runs/[runId]/evidence/route.ts` - 当前 scoring 的直接上游入口
- `package.json` - 当前依赖版本与测试命令
- `.planning/research/FEATURES.md` - explainable scoring 与 `evidence_ids` 的原始功能边界

</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Next.js Route Handlers + OpenAI Structured Outputs + JSONB aggregate persistence
- Patterns: evidence identity, evidence assessment, deterministic aggregation, coverage-first scoring, frontier gap
- Pitfalls: `unknown` 误判、缺少 `evidence_ids`、伪 freshness、直接黑箱 candidate 评分

**Confidence breakdown:**
- Stack reuse: HIGH
- Scoring architecture: HIGH
- Gap baseline recommendation: MEDIUM
- UI integration details: MEDIUM

**Research date:** 2026-04-10
**Valid until:** 2026-05-10
</metadata>

---

*Phase: 04-explainable-scoring-gap-engine*
*Research completed: 2026-04-10*
*Ready for planning: yes*

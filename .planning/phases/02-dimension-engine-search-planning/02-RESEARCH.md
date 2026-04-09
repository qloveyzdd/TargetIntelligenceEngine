# Phase 2: Dimension Engine & Search Planning - Research

**Researched:** 2026-04-10
**Domain:** 三层维度引擎、可编辑维度集合、SearchPlan 草案与确认链路
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 通用层继续沿用 Phase 1 已落地的 6 个 core dimensions，作为维度引擎的稳定底座。
- **D-02:** 领域层不采用固定模板挑选，而是由模型根据 GoalCard 的类别、JTBD 和约束动态生成。
- **D-03:** 项目层同样由模型动态补充，用来捕捉当前目标里的个性化要求。
- **D-04:** 本阶段重点不是生成更多维度，而是把 core / domain / project 三层维度稳定合并到统一结构。
- **D-05:** 用户在 Phase 2 可以修改 `weight`、`direction`、`definition` 和 `evidenceNeeded`。
- **D-06:** 用户可以启用或禁用某个维度，用来移除当前目标无关维度。
- **D-07:** 本阶段不支持新增自定义维度，也不做复杂自由配置器。
- **D-08:** SearchPlan 生成后必须先展示给用户作为草案确认页，不能直接执行。
- **D-09:** SearchPlan 必须显式区分 `same_goal` 和 `dimension_leader` 两类计划，并说明找什么、为什么找、预计找多少。
- **D-10:** 用户确认的是搜索计划草案，不是最终候选结果；真正执行检索留给下一阶段。
- **D-11:** `dimension_leader` 不做范围裁剪，所有启用维度都允许生成 leader 计划。
- **D-12:** 本阶段不提前做候选去重、网页抓取、证据抽取和真实搜索执行。

### the agent's Discretion
- 动态维度生成的提示词、归一化细节和去重规则由 research / planning 定义。
- SearchPlan 草案的具体字段布局、展示文案和页面编排由 planning 决定。
- 为了让 SearchPlan 能被 Phase 3 直接消费，可以引入辅助型 run 字段，但不能破坏“五个核心对象”作为主业务骨架的原则。

### Deferred Ideas (OUT OF SCOPE)
- 候选产品真实召回、去重、排序和深挖。
- 证据抓取、结构化抽取与展示。
- 评分、gap_priority 和阶段目标生成。
</user_constraints>

<research_summary>
## Summary

Phase 2 最稳的做法不是把“维度生成”和“搜索计划”塞成一个大 prompt，而是继续沿用 Phase 1 已经验证过的模式: 服务端用 OpenAI Responses API + Structured Outputs 生成固定结构，客户端只负责编辑、确认和回显。这样可以把不稳定的模型输出收束成两个明确工件:

1. `DimensionDraftSet`: core / domain / project 三层维度的统一草案
2. `SearchPlanDraft`: `same_goal` 和 `dimension_leader` 两类搜索计划的草案

从仓库现状看，Phase 1 已经把 `AnalysisRun`、`Dimension`、`GoalCard`、`run-shell` 和 `/api/runs/[runId]` 的主闭环搭好了，所以 Phase 2 不需要改架构方向，只要把 run 聚合往前推进一层。关键变化有三个：

- `Dimension` 需要新增 `enabled`，否则无法满足 DIME-04。
- `AnalysisRunStatus` 需要扩展到 “维度草案已生成 / SearchPlan 草案已生成 / SearchPlan 已确认” 这类可追踪状态。
- `AnalysisRun` 需要增加一个 run 级辅助工件 `searchPlan`，用于保存草案与确认结果。它不是第六个核心业务对象，而是 Phase 2 到 Phase 3 的过渡工件。

权重和去重不应该做复杂算法。MVP 阶段最合理的是:
- core 维度固定保留；
- domain / project 维度由模型生成；
- 合并时按 `id/name` 归一化去重；
- 编辑后统一重新归一化 enabled 维度的权重；
- disabled 维度保留在 run 中，但不参与 leader 计划生成和后续执行。

SearchPlan 也不应该过度设计成“搜索执行器”。在这个阶段，它的本质只是一个可解释的、可确认的检索草案。每个计划项只需要稳定表达：
- 搜索模式
- 关联维度
- 查询文本
- 目标意图
- 推荐理由
- 预计召回量
- 后续执行时应优先看的来源提示

**Primary recommendation:** Phase 2 继续使用 `Next.js Route Handlers + OpenAI Structured Outputs + PostgreSQL JSONB run 聚合`，把这阶段收敛为“动态维度合成 -> 可编辑维度确认 -> SearchPlan 草案生成 -> SearchPlan 确认并持久化”这条闭环。
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.x | 继续承载页面、Route Handlers 和 run 详情页 | Phase 1 已落地，Phase 2 只是在现有工作台上扩展 |
| TypeScript | 5.x | 收紧 `Dimension`、`SearchPlan` 和 run 状态类型 | 这阶段核心就是结构稳定性 |
| OpenAI Responses API + Structured Outputs | 2026-04 官方文档能力集 | 生成 domain/project dimensions 与 SearchPlan draft | 这两类产物都天然适合严格 schema 输出 |
| Drizzle ORM + PostgreSQL JSONB | 当前仓库已用版本 | 持久化 run 扩展字段与状态流转 | 不引入新存储模型，保持 KISS |

### Supporting
| Library / Tool | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 3.x | 测试维度合成、权重归一化、SearchPlan schema 与仓储更新 | 所有纯逻辑都应落在这里 |
| Playwright | 1.56.x | 覆盖“生成维度 -> 编辑 -> 确认 -> 生成 SearchPlan -> 确认 -> 重开 run”主流程 | 保证工作台闭环不漂 |
| Native form state + `useTransition` | React 19 当前模式 | 处理维度编辑和确认操作 | 现有代码已经采用，无需新表单库 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 单独 `search_plan` 表 | 继续存在 `analysis_runs` JSONB 里 | 单独表查询更细，但当前只是阶段中间工件，独立建模收益很低 |
| 模型生成后直接覆盖所有维度 | core 固定 + AI 补 domain/project + 本地去重合并 | 纯模型输出漂移太大，不能当主骨架 |
| 引入向量或语义去重 | 简单 slug / 名称 / 证据需求去重 | 当前维度规模很小，复杂去重是过度设计 |
| 维度和 SearchPlan 分两页 | 继续挂在单页工作台与 `/runs/[runId]` | Phase 1 已锁定单页交互，分页会打断确认链路 |

**Installation:**
```bash
npm install
```

Phase 2 不推荐新增重量级依赖。优先复用现有 `openai`、`next`、`drizzle-orm`、`vitest`、`playwright`。
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Data Additions

在不推翻 Phase 1 骨架的前提下，Phase 2 建议做这几个结构增量：

```ts
type Dimension = {
  id: string
  name: string
  weight: number
  direction: 'higher_better' | 'lower_better'
  definition: string
  evidenceNeeded: string[]
  layer: 'core' | 'domain' | 'project'
  enabled: boolean
}

type SearchPlanMode = 'same_goal' | 'dimension_leader'

type SearchPlanItem = {
  id: string
  mode: SearchPlanMode
  dimensionId: string | null
  query: string
  whatToFind: string
  whyThisSearch: string
  expectedCandidateCount: number
  sourceHints: string[]
}

type SearchPlan = {
  status: 'draft' | 'confirmed'
  items: SearchPlanItem[]
  confirmedAt: string | null
}
```

`searchPlan` 是 run 辅助工件，不替代 `candidates`。真正的候选结果仍然在 Phase 3 写进 `candidates`。

### Pattern 1: Dimension Engine as a Two-Step Pipeline
**What:** 把维度引擎拆成 “AI 生成 domain/project 草案” 和 “本地合并归一化” 两步。  
**When to use:** GoalCard 已确认后，用户第一次进入维度编辑阶段。  
**Why:** 这样可以把不稳定部分限制在模型生成，把确定性规则放在本地代码里。

建议的服务拆分：

```text
src/features/dimensions/
├─ core-dimensions.ts
├─ dimension-schema.ts
├─ generate-dynamic-dimensions.ts
├─ merge-dimensions.ts
├─ normalize-dimension-weights.ts
└─ update-dimensions.ts
```

### Pattern 2: Editable Draft, Confirmed Snapshot
**What:** 用户先编辑维度草案，再显式确认；SearchPlan 也是一样。  
**When to use:** `goal_confirmed -> dimensions_ready -> search_plan_ready -> search_plan_confirmed`。  
**Why:** 当前项目强调可解释与可追溯，草案和确认态必须分开。

### Pattern 3: SearchPlan is a Planning Artifact, Not Recall Output
**What:** SearchPlan 只表达未来要怎么搜，不表达搜到了什么。  
**When to use:** 整个 Phase 2。  
**Why:** 如果在这阶段把草案和结果混在一起，Phase 3 会很难接，也会破坏“用户先确认计划再执行”的原则。

### Pattern 4: Keep the Single Workspace Surface
**What:** 继续在 `run-shell.tsx` 和 `/runs/[runId]` 上扩展，而不是另起一个搜索计划页面。  
**When to use:** 维度编辑区、SearchPlan 预览区、确认按钮。  
**Why:** 当前核心是线性确认链路，不是信息架构扩张。

### Recommended State Progression

```text
draft
-> goal_ready
-> goal_confirmed
-> dimensions_ready
-> search_plan_ready
-> search_plan_confirmed
```

这样后续 Phase 3 可以直接以 `search_plan_confirmed` 作为候选召回入口。

### Anti-Patterns to Avoid
- **直接让模型输出最终维度并落库：** 这会把 core 底座也变成漂移内容。
- **disabled 维度仍参与 leader 查询生成：** 会直接违背用户编辑结果。
- **把 SearchPlan 塞进 `candidates` 占位：** 语义错误，后续难维护。
- **为了“智能”提前加 embeddings / pgvector 去重：** Phase 2 完全不需要。
- **把维度编辑做成无限自由表单：** 用户已明确本阶段不允许自定义新增维度。
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 动态维度输出 | 自由文本解析维度列表 | Structured Outputs + 明确维度 schema | 可控、可验证、易测试 |
| 维度去重 | 复杂语义相似度算法 | 标准化 `id/name` + 简单规则合并 | 当前数量小，规则法更稳 |
| 权重修正 | 分散在组件里的临时计算 | 统一 `normalizeDimensionWeights()` | 保证 API 和 UI 一致 |
| SearchPlan 解释链 | 临时拼接文案 | 固定 schema 字段 `whatToFind / whyThisSearch / expectedCandidateCount` | Phase 3 和 UI 都能复用 |
| 维度启停 | 前端隐藏元素 | `enabled` 进入持久化数据 | 这才是真正的业务状态 |

**Key insight:** Phase 2 的核心不是“更聪明地猜”，而是“把维度和搜索计划做成可以被用户编辑、确认和重开的结构化对象”。
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: 动态维度覆盖 core 底座
**What goes wrong:** 每次重新生成维度时，连 `cost / performance / usability` 这些固定维度都漂掉。  
**Why it happens:** 把模型输出直接当成最终结果。  
**How to avoid:** core 维度始终来自本地代码常量，只允许模型补 domain / project。  
**Warning signs:** 同一个 GoalCard 多次生成后，连 core 维度数量和名称都不一致。

### Pitfall 2: 用户编辑后权重总和失真
**What goes wrong:** 用户改了几个权重后，总和不再是 1，后续评分和排序都会飘。  
**Why it happens:** 权重修正逻辑散落在组件里或只在提交时临时兜底。  
**How to avoid:** 所有维度更新都走统一的 normalize 函数，只对 enabled 维度归一化。  
**Warning signs:** 同一 run 在前端显示和数据库持久化的权重不一致。

### Pitfall 3: disabled 维度仍生成 `dimension_leader`
**What goes wrong:** 用户明明关掉了某维度，SearchPlan 里还在为它生成 leader 查询。  
**Why it happens:** SearchPlan 生成时直接读原始维度数组，没过滤 enabled。  
**How to avoid:** SearchPlan 输入永远使用 enabled dimensions 快照。  
**Warning signs:** 页面上看不到的维度，计划里却还有对应查询。

### Pitfall 4: SearchPlan 和候选结果混淆
**What goes wrong:** Phase 2 页面开始出现候选列表或匹配分数，导致边界提前失控。  
**Why it happens:** 把“怎么搜”误做成“已经搜到什么”。  
**How to avoid:** SearchPlan 只展示草案项，不展示候选实体。  
**Warning signs:** 本阶段代码里出现真实候选映射、匹配排序或外部抓取调用。

### Pitfall 5: 维度 schema 只在前端约束
**What goes wrong:** 前端表单看起来合法，但 PATCH 后 run 里混入脏字段。  
**Why it happens:** 只做组件层校验，没有服务端 coerce / sanitize。  
**How to avoid:** `/api/runs/[runId]` 对 dimension 和 search plan payload 都做服务端收敛。  
**Warning signs:** 数据库里出现空 `id`、负权重或未知 `direction`。
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources, rewritten for this project:

### Dynamic dimension generation with Structured Outputs
```ts
export async function generateDynamicDimensions(input: {
  goal: GoalCard
  coreDimensions: Dimension[]
}) {
  const response = await openai.responses.create({
    model: process.env.OPENAI_GOAL_MODEL ?? 'gpt-5.4-mini',
    input: JSON.stringify(input),
    text: {
      format: {
        type: 'json_schema',
        name: 'dynamic_dimensions',
        strict: true,
        schema: dynamicDimensionSchema
      }
    }
  })

  return JSON.parse(response.output_text)
}
```

### SearchPlan draft generation
```ts
export async function generateSearchPlan(input: {
  goal: GoalCard
  dimensions: Dimension[]
}) {
  const response = await openai.responses.create({
    model: process.env.OPENAI_GOAL_MODEL ?? 'gpt-5.4-mini',
    input: JSON.stringify(input),
    text: {
      format: {
        type: 'json_schema',
        name: 'search_plan',
        strict: true,
        schema: searchPlanSchema
      }
    }
  })

  return JSON.parse(response.output_text)
}
```

### Route Handler for confirmed dimension updates
```ts
export async function PATCH(request: Request, context: RouteContext) {
  const body = await request.json()
  const nextDimensions = coerceDimensions(body.dimensions)

  const normalized = normalizeDimensionWeights(
    nextDimensions.filter((dimension) => dimension.enabled)
  )

  return Response.json({
    run: await updateRunAggregate(runId, {
      status: 'dimensions_ready',
      dimensions: mergeDisabledBack(nextDimensions, normalized)
    })
  })
}
```

### SearchPlan JSONB persistence
```ts
export const analysisRuns = pgTable('analysis_runs', {
  // existing fields...
  searchPlan: jsonb('search_plan'),
})
```
</code_examples>

<validation_architecture>
## Validation Architecture

Phase 2 适合继续采用 “快速逻辑验证 + 单条主链路 E2E” 的组合：

1. **快速反馈层**
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test:unit -- --run`

2. **主链路验证层**
   - `npm run test:e2e`
   - 覆盖主路径:
     - 生成并确认 GoalCard
     - 自动生成三层维度草案
     - 用户编辑 `weight / direction / definition / evidenceNeeded / enabled`
     - 生成 SearchPlan 草案
     - 用户确认 SearchPlan
     - 重开 `/runs/[runId]` 看到同一份维度和 SearchPlan

建议的测试落点：
- `src/features/dimensions/merge-dimensions.test.ts`
- `src/features/dimensions/normalize-dimension-weights.test.ts`
- `src/features/dimensions/dimension-schema.test.ts`
- `src/features/search-plan/schema.test.ts`
- `src/features/search-plan/generate-search-plan.test.ts`
- `src/features/analysis-run/repository.test.ts`
- `tests/e2e/dimension-search-plan-workflow.spec.ts`

本阶段不需要跑真实网络搜索，也不应依赖真实 OpenAI 请求。E2E 继续通过 `MOCK_OPENAI=true` 或稳定替身驱动。
</validation_architecture>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 一次性大 prompt 产出所有分析中间结果 | 分工件、分 schema 产出 `GoalCard / Dimensions / SearchPlan` | LLM 工具化工作流成熟后 | 结果更稳，失败重试粒度更小 |
| 用聊天文本让用户“看懂计划” | 直接把中间工件结构化并回显 | Structured Outputs 普及后 | UI、测试和持久化都更简单 |
| 搜索计划隐含在提示词里 | SearchPlan 成为显式工件 | Agentic / tool-based 应用成熟后 | 用户可以确认计划本身，而不只看结果 |
| 用更多模型“智能去重” | 先用本地规则合并与归一化 | 当前早期产品构建经验 | 大多数漂移问题是结构问题，不是模型数量问题 |

**New tools/patterns to consider:**
- **OpenAI Structured Outputs:** 非常适合动态维度和 SearchPlan 这类固定 JSON 对象。
- **Next.js Route Handlers:** 继续作为维度确认、SearchPlan 生成与确认的边界。
- **Playwright mock routing:** 可以稳定覆盖 Phase 2 主链路而不触网。

**Deprecated/outdated:**
- **把 SearchPlan 藏在提示词里不落库：** 这会直接失去 Phase 3 的稳定输入。
- **提早把候选召回和 SearchPlan 混成一体：** 违背阶段边界，后续很难维护。
</sota_updates>

<open_questions>
## Open Questions

1. **`searchPlan` 是直接挂在 `AnalysisRun` 还是做成 run metadata？**
   - What we know: Phase 2 需要持久化草案与确认结果，Phase 3 也要直接消费。
   - What's unclear: 是新增显式字段，还是加一个更泛化的 metadata 容器。
   - Recommendation: 直接加 `searchPlan` JSONB 字段。当前需求明确，metadata 只会让类型变松。

2. **domain / project 层默认各生成多少条维度？**
   - What we know: 用户需要动态生成，但不希望维度爆炸。
   - What's unclear: 是固定 2+2、3+2，还是按输入复杂度变化。
   - Recommendation: planning 阶段先定成 `domain 2-4`、`project 1-3`，保持总维度数量可编辑又不失控。

3. **`same_goal` 查询条数是否需要固定上限？**
   - What we know: 用户选了所有 enabled dimensions 都支持 `dimension_leader`。
   - What's unclear: `same_goal` 是 1 条总查询还是 3-5 条子查询。
   - Recommendation: 先做 3 条以内 `same_goal` 计划项，避免草案过宽。
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) - 严格 JSON Schema 输出
- [OpenAI Tools Guide for Responses API](https://platform.openai.com/docs/guides/tools?api-mode=responses) - Responses API 的工具与工件边界
- [OpenAI Models Compare](https://developers.openai.com/api/docs/models/compare) - 模型能力与推荐对比
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - 服务端接口边界
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) - 继续沿用 Server Shell + Client Islands
- [Next.js Playwright Guide](https://nextjs.org/docs/testing/playwright) - 主链路 E2E
- [Drizzle PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg) - PostgreSQL `jsonb` 等列类型
- [Drizzle SQL Schema Declaration](https://orm.drizzle.team/docs/sql-schema-declaration) - schema 声明方式

### Secondary (MEDIUM confidence)
- [Playwright Mock APIs](https://playwright.dev/docs/mock) - 稳定替身与网络 mock
- [Next.js Vitest Guide](https://nextjs.org/docs/testing/vitest) - 单元测试整合

### Tertiary (LOW confidence - needs validation)
- None for Phase 2. 关键结论都可由官方文档或现有代码边界支撑。
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Next.js Route Handlers + OpenAI Structured Outputs + Drizzle JSONB
- Ecosystem: Vitest, Playwright, existing workspace shell
- Patterns: 三层维度合成、编辑确认、SearchPlan 草案持久化
- Pitfalls: 维度漂移、权重失真、disabled 维度误参与、SearchPlan 与候选混淆

**Confidence breakdown:**
- Standard stack: HIGH - 全都沿用现有代码与官方文档
- Architecture: HIGH - 与 Phase 1 真实结构连续
- Pitfalls: HIGH - 直接对应本阶段边界
- Code examples: HIGH - 基于官方模式改写

**Research date:** 2026-04-10
**Valid until:** 2026-05-10
</metadata>

---

*Phase: 02-dimension-engine-search-planning*
*Research completed: 2026-04-10*
*Ready for planning: yes*

# Phase 1: Foundation & Goal Backbone - Research

**Researched:** 2026-04-10
**Domain:** 单仓单应用的目标分析工作台骨架、GoalCard 结构化生成、run 级持久化
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Phase 1 采用单页工作台交互，而不是多步骤向导。
- **D-02:** 页面上方是目标描述与补充文本输入区，生成后在同页下方展示可编辑 GoalCard。
- **D-03:** 用户必须先确认或编辑 GoalCard，后续分析步骤才允许继续。
- **D-04:** 每次输入生成一个独立的 `analysis run`，作为一次完整分析的容器。
- **D-05:** Phase 1 先支持 run 的创建、查看和重新打开，不做 run 之间的复杂对比能力。
- **D-06:** `analysis run` 内部固定承载 `goal`、`dimensions`、`candidates`、`evidence`、`stage_goals` 五类核心对象。
- **D-07:** Phase 1 就建立 5 个核心对象的稳定 schema，不等到后续 phase 再反复改模型。
- **D-08:** 本阶段真正跑通 `goal` 和 `dimensions` 的基础链路；`candidates`、`evidence`、`stage_goals` 先提供 schema、存储入口和空状态。
- **D-09:** `dimensions` 在本阶段只要求支持通用层模板和基础字段，不提前实现复杂领域层生成策略。
- **D-10:** Phase 1 交付的是可运行的纵向切片，不是静态原型。
- **D-11:** 纵向切片至少包含基础页面、Goal 输入、GoalCard 生成与编辑、run 持久化、初版通用维度模板写入。
- **D-12:** 页面可以展示 `candidates`、`evidence`、`stage_goals` 的空区域，用来体现完整骨架，但不在本阶段实现真实业务能力。
- **D-13:** Phase 1 先按单仓单应用模式推进，不拆多仓。
- **D-14:** 一个 Web 应用作为主入口，服务层、存储层、LLM 编排层先在同一项目内按模块分层。
- **D-15:** 优先控制复杂度，不在本阶段引入额外服务拆分。

### the agent's Discretion
- GoalCard 表单的具体布局、字段排序和视觉细节由后续规划与实现决定。
- `analysis run` 的内部模块命名、目录组织和服务分层细节由后续规划决定。
- 初版通用维度模板的具体条目数与默认权重策略可由研究和规划阶段细化，但必须遵守项目级 evidence-first 原则。

### Deferred Ideas (OUT OF SCOPE)
- 历史 run 之间的复杂对比。
- 领域层与项目层维度的复杂生成策略。
- 候选召回、证据抓取、评分、图形展示和阶段目标生成。
</user_constraints>

<research_summary>
## Summary

Phase 1 最稳的实现方式不是先搭一套“完整平台”，而是先做一个最小但真实可运行的分析工作台。综合现有项目研究和官方资料，这一阶段最适合采用 `Next.js App Router + Route Handlers + PostgreSQL JSONB run 聚合存储 + OpenAI Responses API Structured Outputs`。这样可以把页面、接口、服务逻辑和数据层放在同一个应用里，既符合单仓单应用和 KISS，也方便后续 phase 逐步扩展候选、证据和图形层。

数据层不应该在 Phase 1 就过度归一化。最简单且最贴合当前需求的做法，是把一次分析视为一个 `analysis run` 聚合根，在一张 `analysis_runs` 主表里直接保存 `goal`、`dimensions`、`candidates`、`evidence`、`stage_goals` 五个 JSONB 字段。这样可以立刻满足“稳定骨架”和“可重新打开 run”，同时避免为了未来能力过早拆出一堆表。通用层维度模板也不需要先做成后台管理系统，先用代码常量定义，在 GoalCard 确认后写入 `run.dimensions` 就够了。

GoalCard 生成应该收敛成一个非常窄的服务边界：服务端调用 OpenAI Responses API，配合 Structured Outputs 输出固定 JSON 结构；前端只负责输入、展示、编辑和确认。这样能把“模型生成”和“用户确认”解耦，避免客户端状态成为真相来源，也更容易在后续 phase 延伸到 Dimensions、SearchPlan 和 StageGoals。

**Primary recommendation:** Phase 1 采用 `Next.js + Route Handlers + Drizzle + PostgreSQL(JSONB run 聚合) + OpenAI Structured Outputs`，先把“文本输入 -> GoalCard -> 确认 -> 写入 run -> 重新打开”这条闭环打通。
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.x | 单应用承载页面、路由和服务端接口 | App Router、Route Handlers、Server/Client Components 让单仓单应用更自然 |
| TypeScript | 5.x | 约束 GoalCard、run 和 dimensions 结构 | 对结构化对象和后续 phase 扩展最友好 |
| OpenAI Responses API + Structured Outputs | 2026-04 官方文档能力集 | 生成 GoalCard 且保证固定结构 | 官方当前推荐 Responses API，新项目可直接使用结构化输出和内建工具 |
| Drizzle ORM + PostgreSQL | Drizzle 当前文档版本 / PostgreSQL 16+ | 管理 `analysis_runs` schema、迁移和 JSONB 字段 | SQL-first，轻量，适合 run 聚合存储和后续 JSONB 扩展 |

### Supporting
| Library / Tool | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 3.x | 测试纯 TypeScript 逻辑与 schema 转换 | 验证 GoalCard 映射、run 仓储、dimensions 注入 |
| Playwright | 当前稳定版 | 覆盖“输入 -> 生成 -> 编辑 -> 保存 -> 重开”主流程 | 验证真实页面和接口联动 |
| React Flow | 12.9.x | 后续关系图交互 | 本 phase 只预留空区域，不提前接入 |
| Apache ECharts | 6.x | 后续雷达图与对比图 | 本 phase 只预留空区域，不提前接入 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Next.js 单应用 | Vite + Express / Fastify | 需要额外维护前后端边界，Phase 1 复杂度更高 |
| Route Handlers | Server Actions-only | 表单提交更简单，但 run 的读取、重开和后续对外接口边界不如显式 API 清晰 |
| JSONB run 聚合 | 一开始就拆 5 张对象表 | 未来查询更细，但当前会把骨架阶段变成建模阶段 |
| Drizzle | Prisma | Prisma DX 很好，但 run 聚合 + JSONB-first + 后续 pgvector 方向下，Drizzle 更贴近 SQL 和迁移控制 |

**Installation:**
```bash
npm install next react react-dom drizzle-orm pg openai
npm install -D typescript @types/node @types/react @types/react-dom drizzle-kit vitest @vitest/coverage-v8 playwright eslint
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```text
src/
├─ app/
│  ├─ page.tsx
│  ├─ runs/[runId]/page.tsx
│  └─ api/
│     ├─ goal-card/generate/route.ts
│     └─ runs/
│        ├─ route.ts
│        └─ [runId]/route.ts
├─ components/
│  └─ workspace/
│     ├─ goal-input-form.tsx
│     ├─ goal-card-editor.tsx
│     ├─ run-shell.tsx
│     └─ analysis-placeholders.tsx
├─ features/
│  ├─ analysis-run/
│  │  ├─ types.ts
│  │  ├─ repository.ts
│  │  └─ run-mappers.ts
│  ├─ goal-card/
│  │  ├─ schema.ts
│  │  ├─ generate-goal-card.ts
│  │  └─ normalize-goal-input.ts
│  └─ dimensions/
│     ├─ core-dimensions.ts
│     └─ build-initial-dimensions.ts
├─ db/
│  ├─ client.ts
│  └─ schema.ts
└─ lib/
   ├─ env.ts
   └─ openai.ts
```

### Pattern 1: Server Shell + Client Islands
**What:** 页面入口尽量保持为 Server Component，只把输入表单、GoalCard 编辑器和交互性区域做成 Client Component。  
**When to use:** 首页工作台、run 详情页、近期 run 列表。  
**Why:** 这样可以让数据加载和页面初始渲染保持简单，同时把客户端 JS 控制在必须的交互范围内。

### Pattern 2: Route Handlers 作为服务边界
**What:** 通过 `/api/goal-card/generate`、`/api/runs` 和 `/api/runs/[runId]` 暴露 Phase 1 所需能力。  
**When to use:** GoalCard 生成、run 创建、run 读取、run 更新。  
**Why:** Route Handlers 天然适合单应用里的服务边界，后续接候选召回、证据抽取时也不需要重做调用模型。

### Pattern 3: Run Aggregate as the Source of Truth
**What:** 一条 `analysis_runs` 记录就是一次分析的完整容器。  
**When to use:** Phase 1 的所有持久化。  
**Why:** 现在真正需要查询和编辑的是“这一次 run 的整体状态”，不是跨 run 统计。JSONB 聚合能让 `goal`、`dimensions`、`candidates`、`evidence`、`stage_goals` 同步演进，不会因为未来字段变化频繁改表。

推荐主表字段：

```ts
type AnalysisRunRow = {
  id: string
  status: 'draft' | 'goal_ready' | 'goal_confirmed'
  inputText: string
  inputNotes: string | null
  goal: GoalCard | null
  dimensions: Dimension[]
  candidates: Candidate[]
  evidence: Evidence[]
  stageGoals: StageGoal[]
  createdAt: string
  updatedAt: string
}
```

### Anti-Patterns to Avoid
- **一开始就拆多服务或多仓：** 当前没有业务代码，先做单应用才符合 Phase 1 目标。
- **一开始就把五类对象全部归一化成多表：** 会把 Phase 1 变成数据库设计工程，而不是用户闭环工程。
- **把 GoalCard 真相留在前端本地状态：** 重新打开 run 时会直接失真。
- **先接图形库再补骨架：** Phase 1 只要保留空区域，不要提前引入 ECharts / React Flow 的复杂性。
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 结构化模型输出 | 正则或字符串拼接解析 AI 返回文本 | Structured Outputs + 明确 JSON Schema | 模型输出很容易漂，结构化输出更稳 |
| 前后端通信 | 自定义 RPC 协议或前端直连数据库 | Next Route Handlers | Phase 1 只需要极少接口，Route Handlers 足够 |
| 核心对象存储 | 5 张对象表 + 大量 join | 单表 run 聚合 + JSONB | 当前查询维度是 run，不是全局分析 |
| 图形层能力 | 提前手写节点图和图表集成 | 先做空状态区域，后续 phase 再接 React Flow / ECharts | Phase 1 还没有真实数据，过早接图层只会制造噪音 |

**Key insight:** Phase 1 的本质是“把分析容器跑通”，不是“提前搭好整个平台”。
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: 直到 GoalCard 确认后才创建 run
**What goes wrong:** 用户刷新页面或稍后返回时，前一次生成结果找不到。  
**Why it happens:** 把“生成 GoalCard”误当成纯前端临时态。  
**How to avoid:** 用户首次提交文本时就创建 `draft` run，GoalCard 生成结果回写到这条 run。  
**Warning signs:** 只能在当前页面内看到 GoalCard，无法通过 URL 或 run id 打开。

### Pitfall 2: 客户端状态成了 GoalCard 真相来源
**What goes wrong:** 用户编辑了 GoalCard，但数据库里的 run 没同步，重新打开内容不一致。  
**Why it happens:** 编辑器和存储边界没有明确。  
**How to avoid:** 前端只维护编辑态，确认动作必须走服务端更新 run。  
**Warning signs:** 页面刷新后字段回退，或者后续 dimensions 注入拿到的是旧数据。

### Pitfall 3: 过早把 schema 设计成“未来完整版”
**What goes wrong:** 为还没实现的 candidates / evidence / stageGoals 提前拆很多表、索引和 service。  
**Why it happens:** 试图一次性覆盖整个 roadmap。  
**How to avoid:** Phase 1 只保证字段骨架存在，未实现对象先用空数组和空区域承载。  
**Warning signs:** 本阶段计划里出现大量与候选召回、评分、图可视化直接相关的实现细节。

### Pitfall 4: 用单元测试去硬测 App Router 页面行为
**What goes wrong:** 测试又脆又难维护，Server/Client 边界一变就碎。  
**Why it happens:** 把页面生命周期测试和纯函数测试混在一起。  
**How to avoid:** Vitest 只测纯函数、schema、repository 和 mapper；完整页面流程用 Playwright。  
**Warning signs:** 测试里大量模拟 `fetch`、路由上下文和 DOM 生命周期，只为验证“输入 -> 保存 -> 重开”。
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources, rewritten for this project:

### GoalCard generation service boundary
```ts
// Source basis: OpenAI Responses API + Structured Outputs docs
export async function generateGoalCard(inputText: string, inputNotes?: string) {
  const response = await openai.responses.create({
    model: process.env.OPENAI_GOAL_MODEL ?? 'gpt-5.4-mini',
    input: [
      {
        role: 'system',
        content: '你负责把用户目标整理成固定结构的 GoalCard。'
      },
      {
        role: 'user',
        content: JSON.stringify({ inputText, inputNotes })
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'goal_card',
        strict: true,
        schema: goalCardSchema
      }
    }
  })

  return JSON.parse(response.output_text)
}
```

### Next Route Handler for run creation
```ts
// Source basis: Next.js App Router Route Handlers docs
export async function POST(request: Request) {
  const body = await request.json()
  const run = await createDraftRun({
    inputText: body.inputText,
    inputNotes: body.inputNotes ?? null
  })

  return Response.json({ run })
}
```

### Drizzle schema for run aggregate
```ts
// Source basis: Drizzle schema declaration docs
export const analysisRuns = pgTable('analysis_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  status: text('status').notNull().default('draft'),
  inputText: text('input_text').notNull(),
  inputNotes: text('input_notes'),
  goal: jsonb('goal'),
  dimensions: jsonb('dimensions').notNull().default(sql`'[]'::jsonb`),
  candidates: jsonb('candidates').notNull().default(sql`'[]'::jsonb`),
  evidence: jsonb('evidence').notNull().default(sql`'[]'::jsonb`),
  stageGoals: jsonb('stage_goals').notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})
```
</code_examples>

<validation_architecture>
## Validation Architecture

Phase 1 适合采用“两层验证”：

1. **快速反馈层**
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test:unit -- --run`

2. **闭环验证层**
   - `npm run test:e2e`
   - 覆盖主流程：输入目标描述 -> 生成 GoalCard -> 编辑并确认 -> 保存 run -> 通过 URL 重新打开

建议的测试落点：
- `src/features/goal-card/schema.test.ts`：验证 GoalCard JSON schema 和默认映射
- `src/features/analysis-run/repository.test.ts`：验证 run 聚合读写和状态变迁
- `src/features/dimensions/build-initial-dimensions.test.ts`：验证初版通用维度模板注入
- `tests/e2e/goalcard-workflow.spec.ts`：验证工作台主闭环

Phase 1 不需要大而全的测试矩阵，但必须保证：
- GoalCard 结构不会漂
- run 聚合可以被重开
- dimensions 注入有稳定输出
- 页面至少有一条真实可跑通的 E2E 主路径
</validation_architecture>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 旧 Completions / Chat Completions 为中心 | Responses API 作为新项目主入口 | OpenAI 当前官方文档路径 | 结构化输出、工具调用和多模态能力边界更统一 |
| 前端全客户端渲染 | App Router 下 Server/Client Components 混合 | Next.js 13+，当前 16.x 继续强化 | 单应用里服务端数据加载更自然 |
| 先拆“前端 + API 服务” | 单仓单应用先完成垂直闭环 | 近两年全栈 React/Next 实践更成熟 | 骨架阶段能显著降低复杂度 |
| 先做图库再补数据 | 先固定数据骨架再接可视化 | 当前项目型智能工具的稳定做法 | 解释链比图层本身更重要 |

**New tools/patterns to consider:**
- **OpenAI Structured Outputs:** 直接把 GoalCard 这类固定对象做成严格 schema 输出。
- **Route Handlers + Client Islands:** 让 Phase 1 只在必须交互的位置用客户端代码。
- **JSONB-first run aggregate:** 对早期产品骨架特别有效，能让 schema 跟着对象稳定迭代。

**Deprecated/outdated:**
- **先手写一层自定义 AI parser：** 现在没必要，Structured Outputs 已覆盖这类需求。
- **为了未来需求提前做图数据库：** 当前阶段纯属过度设计。
</sota_updates>

<open_questions>
## Open Questions

1. **近期 run 入口放首页还是单独列表页？**
   - What we know: Phase 1 需要支持“查看和重新打开”。
   - What's unclear: 是在首页右侧展示近期 run，还是单独做 `/runs` 列表页。
   - Recommendation: 先在首页放一个简单近期 run 列表，详情页走 `/runs/[runId]`，避免增加额外页面负担。

2. **本地 PostgreSQL 采用哪种启动方式？**
   - What we know: Phase 1 需要真实持久化，且项目后续仍会沿用 PostgreSQL。
   - What's unclear: 是直接使用本机数据库，还是统一用 Docker Compose。
   - Recommendation: 执行阶段优先采用 Docker Compose，开源协作的复制成本更低。

3. **GoalCard 默认模型是否显式配置？**
   - What we know: Phase 1 只有一个明显的模型任务，就是 GoalCard 结构化生成。
   - What's unclear: 是写死默认模型，还是做成环境变量配置。
   - Recommendation: 代码里保留 `OPENAI_GOAL_MODEL` 环境变量，默认值可以指向 `gpt-5.4-mini`，兼顾简单和可替换性。
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) - 结构化 JSON schema 输出能力
- [OpenAI Tools Guide](https://platform.openai.com/docs/guides/tools?api-mode=responses) - Responses API 工具与服务边界
- [OpenAI Models Compare](https://developers.openai.com/api/docs/models/compare) - 模型能力对比，确认 `gpt-5.4-mini` 支持结构化调用场景
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) - App Router 项目结构
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) - Server/Client 组件分层方式
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - 单应用服务端接口边界
- [Next.js Vitest Guide](https://nextjs.org/docs/testing/vitest) - 在 Next 项目里做单元测试
- [Next.js Playwright Guide](https://nextjs.org/docs/testing/playwright) - 在 Next 项目里做 E2E 测试
- [Drizzle Schema Declaration](https://orm.drizzle.team/docs/sql-schema-declaration) - schema 代码声明方式
- [Drizzle Migrations](https://orm.drizzle.team/docs/migrations) - 迁移工作流

### Secondary (MEDIUM confidence)
- [React Flow Introduction](https://reactflow.dev/learn/concepts/introduction) - 后续关系图交互能力边界
- [Apache ECharts Features](https://echarts.apache.org/en/feature.html) - 后续雷达图与图表能力边界
- [Playwright Intro](https://playwright.dev/docs/intro) - 浏览器级端到端测试能力
- [pgvector README](https://github.com/pgvector/pgvector) - 后续向量能力与 PostgreSQL 兼容方向

### Tertiary (LOW confidence - needs validation)
- None for Phase 1. 当前关键结论都可以由官方文档或项目上下文支撑。
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Next.js App Router + Route Handlers + OpenAI Responses API
- Ecosystem: Drizzle, PostgreSQL JSONB, Vitest, Playwright
- Patterns: run 聚合存储、GoalCard 结构化生成、Server Shell + Client Islands
- Pitfalls: run 生命周期、客户端真相漂移、过度归一化、测试边界错误

**Confidence breakdown:**
- Standard stack: HIGH - 主要结论都有官方文档支撑，且与项目约束一致
- Architecture: HIGH - 直接围绕当前 phase 需求和 KISS 原则收敛
- Pitfalls: HIGH - 来自当前 phase 的边界和常见全栈实现问题
- Code examples: HIGH - 均为基于官方模式改写的项目化示例

**Research date:** 2026-04-10
**Valid until:** 2026-05-10
</metadata>

---

*Phase: 01-foundation-goal-backbone*
*Research completed: 2026-04-10*
*Ready for planning: yes*

# Phase 3: Candidate Recall & Evidence Intake - Research

**Researched:** 2026-04-10
**Domain:** 候选召回、候选归一化/去重、前 5 深挖、证据结构化入库
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 首轮候选召回允许 `official_site`、`docs`、`pricing`、`review` 四类公开来源。
- **D-02:** 证据深挖时官网、官方文档、价格页优先级高于 review/community。
- **D-03:** 首版坚持白名单公开源，不做无限制全网抓取。
- **D-04:** 候选去重先按官网域名，没有官网再按标准化名称兜底。
- **D-05:** 同一产品被多个 query 命中时，只保留一个 candidate，但保留多个 `matched_modes`。
- **D-06:** `same_goal` 与 `dimension_leader` 同时命中同一产品属于正常情况，不应当重复入库。
- **D-07:** 前 5 深挖对象要先保留一部分 `same_goal` 直接对手。
- **D-08:** 剩余名额再按证据质量和维度覆盖补齐。
- **D-09:** 深挖上限固定为前 5 个候选。
- **D-10:** 一条 evidence 的最小单位是“candidate + dimension + 来源片段”。
- **D-11:** 每条 evidence 至少包含 `source_type`、`url`、`excerpt`、`extracted_value`、`confidence`、`captured_at`。
- **D-12:** 证据先按细颗粒度入库，后续 phase 再做聚合展示或打分。

### the agent's Discretion
- 首轮召回 query 的内部执行顺序、命中分排序细节、名称标准化 helper 的具体实现由 planning 决定。
- 证据面板的最终展示样式和交互文案由 planning 决定。

### Deferred Ideas (OUT OF SCOPE)
- 证据驱动评分、`unknown` 与低分区分、gap 计算
- 雷达图、关系图和点击解释
- 阶段目标与 GSD handoff
</user_constraints>

<research_summary>
## Summary

Phase 3 最稳的做法不是一上来自己造“搜索引擎 + 抓取平台”，而是分两段：

1. **候选召回层**
   - 直接消费 Phase 2 已确认的 `SearchPlan`
   - 用 OpenAI Responses API 的 `web_search` 工具做首轮候选召回
   - 让模型输出结构化候选草案，但候选归一化、去重、排序由本地规则负责

2. **证据深挖层**
   - 只针对前 5 个候选执行
   - 优先抓官网、文档、价格页；review 只作为补充
   - 先抓页面文本，再用 Structured Outputs 抽取 evidence 记录

这样做的好处是：
- **继续沿用现有栈。** 当前项目已经在 Phase 1/2 稳定使用 `Next.js Route Handlers + OpenAI Responses API + Structured Outputs + PostgreSQL JSONB`。
- **把“候选是谁”和“证据是什么”分开。** 候选召回只负责找对象；证据深挖才负责落细颗粒度证据。
- **避免过度工程化。** v1 不需要专门引入搜索服务、爬虫平台或图数据库。

**Primary recommendation:**  
Phase 3 继续用 `Next.js Route Handlers + OpenAI web_search + Structured Outputs + PostgreSQL JSONB`。  
主链路收敛为：

`confirmed SearchPlan -> candidate recall draft -> local normalization/ranking -> top-5 evidence intake -> structured evidence persistence -> workspace display`
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.x | 承接新的 recall / evidence Route Handlers 和工作台展示 | 当前项目已经在用，继续沿用最稳 |
| OpenAI Responses API | 当前仓库 `openai@6.5.0` | 候选召回时使用 `web_search`，证据抽取时使用 Structured Outputs | 项目已经依赖 OpenAI，且官方工具支持最新公开信息与引用 |
| Structured Outputs | OpenAI 官方能力 | 候选草案和 evidence 记录的严格 JSON 输出 | 当前项目已经在 GoalCard / Dimensions / SearchPlan 上验证过 |
| Drizzle + PostgreSQL JSONB | 当前仓库版本 | 持久化 `candidates` 与 `evidence` 到 `analysis_runs` | 保持 run 聚合根不变，符合 KISS |

### Supporting
| Library / Tool | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `fetch` | Node / Next 内置 | 拉取静态官网、文档、价格页 HTML | 默认优先使用，简单可维护 |
| Playwright | 1.56.x | 处理动态页面或 JS 渲染导致 `fetch` 无法提取正文的站点 | 只作为少量 fallback，不做全量抓取引擎 |
| Vitest | 3.x | 覆盖归一化、去重、top-5 选择、evidence schema 与 route 行为 | 所有纯逻辑都应优先落在这里 |
| Playwright Test | 1.56.x | 覆盖 SearchPlan 确认后生成候选与 evidence 的主链路 | 保证 workspace 不回退成 placeholder |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 自建首轮搜索抓取器 | Responses API `web_search` | 自建控制力更强，但 v1 成本明显更高；现阶段官方工具更符合 KISS |
| 所有页面都用 Playwright 抓 | 静态页面先 `fetch`，动态页面再 Playwright fallback | 全量 Playwright 太重，且不利于 Phase 3 的反馈速度 |
| 候选和 evidence 独立建表 | 继续挂在 `analysis_runs` JSONB | 独立表更细，但当前查询模式仍然是“围绕一个 run 回看结果”，JSONB 更简单 |
| 先存粗粒度候选摘要 | 直接存 evidence 细颗粒度记录 | 粗摘要会让后续评分和解释返工数据模型 |
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Pattern 1: Recall First, Normalize Locally
**What:**  
先用 `SearchPlanItem[]` 逐项执行候选召回，得到原始候选命中，然后由本地规则做候选归一化和去重。

**Why:**  
模型和 web search 更适合“找候选”，不适合承担最终唯一 ID、去重和排序主逻辑。  
去重规则在本地更稳定，也更容易测试。

### Pattern 2: Candidate Draft Before Evidence Intake
**What:**  
先落一版 `candidates`，确认 top-5 候选，再开始证据深挖。

**Why:**  
如果一边找候选一边抓证据，执行成本会迅速失控，也很难保持“只深挖前 5 个”的阶段边界。

### Pattern 3: Evidence Extraction Is Source-Centric
**What:**  
证据抓取以“候选 + 维度 + 页面来源”为单位执行。每次抓一个来源页面，再抽取对应维度的 evidence 记录。

**Why:**  
这和用户锁定的 evidence 颗粒度完全一致，也方便后续点击维度查看证据链。

### Pattern 4: Official-First Evidence Queue
**What:**  
对每个 top-5 候选，优先队列固定为：
1. `official_site`
2. `docs`
3. `pricing`
4. `review`

**Why:**  
这能把项目的 evidence-first 原则固化进执行顺序，而不是只停留在文档描述里。

### Recommended Data Additions

建议在不破坏现有聚合根的前提下，补充这两个内部工件：

```ts
type CandidateDraft = {
  id: string
  name: string
  officialUrl: string | null
  matchedModes: SearchPlanMode[]
  matchedDimensionIds: string[]
  sourceUrls: string[]
  rawQueries: string[]
}

type EvidenceSourceTask = {
  candidateId: string
  dimensionId: string
  sourceType: "official_site" | "docs" | "pricing" | "review"
  url: string
}
```

这两个结构可以只做 feature 内部 helper，不一定要进最终公开类型。  
最终公开给 `AnalysisRun` 的仍然是 `Candidate[]` 和 `Evidence[]`。
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 首轮公开信息召回 | 自己维护搜索索引或抓取器 | Responses API `web_search` | v1 更快落地，而且能带引用来源 |
| 候选去重 | 模型主观判断“是不是同一个产品” | 官网域名优先 + 标准化名称兜底 | 本地规则更稳、更可测 |
| 页面抓取 | 全站 Playwright 浏览器抓取 | 静态 `fetch` + 动态页面 Playwright fallback | 成本低，复杂度低 |
| 证据抽取 | 正则硬拆所有字段 | Structured Outputs 抽取 evidence schema | 已经是项目验证过的固定模式 |
| evidence 入库 | 候选级摘要文本块 | 一条一条 evidence 记录 | 不会阻塞后续评分和解释链 |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: 把 recall 结果直接当最终 candidate
**What goes wrong:**  
同一产品被多个 query 命中后重复出现，`matched_modes` 丢失，后面 top-5 选择会失真。

**How to avoid:**  
召回结果先进入归一化层，再写回 `run.candidates`。

### Pitfall 2: 证据抓取没有前 5 的硬上限
**What goes wrong:**  
一旦对全部候选深挖，Phase 3 会迅速变成“抓取平台”，时间和费用都会失控。

**How to avoid:**  
top-5 选择必须在证据抓取前完成，并明确写进 route/service 边界。

### Pitfall 3: `review` 源参与权重和官方源同级
**What goes wrong:**  
召回很方便，但一旦在证据层同权处理，就会破坏 evidence-first。

**How to avoid:**  
review 只用于补充召回或补充片段，不作为官方页缺失时的默认替代。

### Pitfall 4: Evidence 只按 candidate 聚合
**What goes wrong:**  
后面点击维度、解释得分、生成阶段目标时，没有足够细的证据连接点。

**How to avoid:**  
本阶段必须直接存 candidate + dimension + excerpt 级记录。

### Pitfall 5: 动态页面 fallback 没有边界
**What goes wrong:**  
Playwright fallback 被滥用成默认抓取方式，执行速度和维护成本都会恶化。

**How to avoid:**  
把 Playwright 明确限定为 fetch 失败或正文缺失时的少量兜底。
</common_pitfalls>

<validation_architecture>
## Validation Architecture

Phase 3 继续适合“单元逻辑验证 + 一条主链路 E2E”的组合：

1. **快速反馈层**
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test:unit -- --run`

2. **主链路验证层**
   - `npm run test:e2e`
   - 覆盖主路径：
     - 已确认的 SearchPlan 触发候选召回
     - 候选被归一化、去重、写回 run
     - 页面显示候选列表和 `matched_modes`
     - 系统只对前 5 个候选做证据深挖
     - 每条 evidence 保留来源字段和片段
     - 重开 `/runs/[runId]` 后仍能看到候选与证据

建议测试落点：
- `src/features/candidate-recall/normalize-candidates.test.ts`
- `src/features/candidate-recall/select-top-candidates.test.ts`
- `src/features/evidence/schema.test.ts`
- `src/features/evidence/extract-evidence.test.ts`
- `src/app/api/runs/[runId]/candidates/route.test.ts`
- `src/app/api/runs/[runId]/evidence/route.test.ts`
- `tests/e2e/candidate-evidence-workflow.spec.ts`

本阶段仍然不应依赖真实外网测试。  
候选召回与证据抽取都应提供稳定 mock 路径，让单测和 E2E 能在 `MOCK_OPENAI=true` 下重复通过。
</validation_architecture>

<sources>
## Sources

### Primary (HIGH confidence)
- [OpenAI Web Search](https://platform.openai.com/docs/guides/tools-web-search?api-mode=responses) - Responses API 中 `web_search` 的能力、来源、引用和 domain filtering
- [OpenAI Using Tools](https://platform.openai.com/docs/guides/tools?api-mode=responses) - Responses API 工具调用的总体用法
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) - 严格 JSON Schema 输出与 `additionalProperties: false`
- [OpenAI Responses API Reference](https://platform.openai.com/docs/api-reference/responses/retrieve) - Responses output item 中 `web_search_call` 与 sources 结构
- [Playwright Pages](https://playwright.dev/docs/pages) - 页面导航与页面对象的基础能力
- [Playwright Navigations](https://playwright.dev/docs/navigations) - `page.goto()` 与页面加载行为

### Secondary (MEDIUM confidence)
- [Playwright Locators](https://playwright.dev/docs/locators) - 提取页面正文时推荐的 locator 模式
- [Playwright Tracing](https://playwright.dev/docs/api/class-tracing) - E2E 失败排查时的 trace 能力

### Repo-local (HIGH confidence)
- `package.json` - 当前依赖和脚本
- `src/features/analysis-run/types.ts` - 现有 run 聚合类型
- `src/db/schema.ts` - 现有 JSONB 存储结构
- `src/features/search-plan/build-search-plan-input.ts` - 已有 source hints
- `src/features/search-plan/generate-search-plan.ts` - 已有 SearchPlan 生成模式
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Next.js Route Handlers + OpenAI web_search + Structured Outputs + Drizzle JSONB
- Ecosystem: Native fetch, Playwright fallback, Vitest, Playwright Test
- Patterns: 候选召回、去重归一化、top-5 深挖、evidence 细颗粒度入库
- Pitfalls: 候选重复、官方源优先级失守、全量深挖失控、evidence 颗粒度过粗

**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Validation: HIGH
- Dynamic-page fallback details: MEDIUM

**Research date:** 2026-04-10
**Valid until:** 2026-05-10
</metadata>

---

*Phase: 03-candidate-recall-evidence-intake*
*Research completed: 2026-04-10*
*Ready for planning: yes*

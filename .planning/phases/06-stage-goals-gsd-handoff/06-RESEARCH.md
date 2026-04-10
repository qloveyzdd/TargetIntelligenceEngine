# Phase 6: Stage Goals & GSD Handoff - Research

**Researched:** 2026-04-10
**Domain:** 阶段目标合成、结构化 handoff、单页工作台接入
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md and project rules)

### Locked Decisions
- **D-01:** 阶段目标固定输出三段：`validation`、`mvp`、`differentiation`
- **D-02:** 不按 run 动态增减阶段数量，保持 handoff 结构稳定
- **D-04:** 阶段目标先由 `gap_priority` 排序，再结合依赖关系归并到三段
- **D-06:** 可以用模型润色文案，但不能跳过 `gap -> stage goal` 链路自由生成 roadmap
- **D-07:** `StageGoal` 契约至少要补 `basedOnGaps`、`referenceProducts`、`successMetrics`、`deliverables`、`risks`
- **D-10:** handoff 首版只输出结构化 `stageGoals` 和每阶段 focus，不直接生成完整 GSD phase/task 计划

### Project-Level Constraints
- **P-01:** evidence-first 仍然是最高优先级，阶段目标必须能回溯到 gap、维度和参考候选
- **P-02:** 项目当前是单个 `analysis run` 聚合，优先在现有 run 上补强，不引入新存储模型
- **P-03:** KISS 优先，首版不做第二套 planner，不做文件导出库，不做复杂工作流编排
- **P-04:** 当前工作台已经是单页顺序流，Phase 6 应直接接在可视化层之后

### the agent's Discretion
- gap 到阶段的内部排序公式和依赖归并细节可以在 planning 决定
- handoff 的展现形式可以是面板、JSON 预览和复制动作，不强制文件下载

### Deferred Ideas (OUT OF SCOPE)
- 动态阶段模板
- 直接生成完整 GSD phase/task 草案
- 在 Phase 6 内继续扩展召回、评分或可视化系统
</user_constraints>

<research_summary>
## Summary

Phase 6 最稳的实现路线，不是再起一个“roadmap 生成器”，而是把已经持久化在 `run.scoring.gaps` 里的结构化结果，做两层纯派生：

1. **Stage Goal synthesis**
   - 输入：`run.goal`、`run.dimensions`、`run.candidates`、`run.scoring.gaps`
   - 输出：固定 3 条 `stageGoals`
   - 规则：先按 `gap_priority` 排序，再按阶段语义做归并

2. **GSD handoff formatting**
   - 输入：`run.stageGoals`
   - 输出：结构化 handoff payload
   - 用途：给后续 GSD 讨论/规划直接消费

这阶段真正重要的研究结论有 5 个：

1. **不需要新依赖，也不需要新的持久化表**
   - 当前 `AnalysisRun` 已经有 `stageGoals` 字段，`analysis_runs` 也已经能持久化 `stageGoals`
   - 最便宜的路径是扩展现有 `StageGoal` 契约，并继续沿用 `updateRunAggregate()`

2. **Stage Goal 应该是规则优先、模板文案次之**
   - 当前 gap 已经结构化到维度级，继续引入一轮重型 LLM 生成只会让输出漂移
   - 首版更适合用纯 TypeScript builder 把 gap 归并到三段，再用轻模板整理目标文案
   - 这也更符合“不要让模型直接拍脑袋写 roadmap”的项目原则

3. **必须加入 Stage Goal invalidation**
   - 现在仓库里只有 `scoring` 会在上游数据变化时自动失效
   - 但 Phase 6 的 `stageGoals` 明显依赖 `scoring`
   - 所以一旦 `goal / dimensions / searchPlan / candidates / evidence / scoring` 变化，旧的 `stageGoals` 都应该清空，避免展示陈旧阶段目标

4. **handoff 最适合做成纯 formatter + route**
   - handoff 首版不是新存储对象，而是 `run.stageGoals` 的稳定投影
   - 这样 UI 可以复用 formatter，本地测试也更容易锁住输出结构
   - 同时能提供明确的 API 出口，满足“后续 GSD planning 可消费”的要求

5. **工作台层只需要一个 Stage Goals panel**
   - 当前 [analysis-placeholders.tsx](/E:/TargetIntelligenceEngine/src/components/workspace/analysis-placeholders.tsx:1) 里已经给 `Stage Goals` 留了 placeholder
   - 最自然的做法是在 `run-shell.tsx` 里用真正的 `StageGoalsPanel` 替换它
   - 面板需要做的事很简单：生成、查看、复制 handoff JSON、reopen 回显

**Primary recommendation:**  
Phase 6 继续沿用 `Next.js Route Handlers + pure TypeScript builders + run aggregate persistence`。  
首版只补 4 条主链：
- 扩 `StageGoal` 契约
- 增 `buildStageGoals()`
- 增 `buildStageGoalHandoff()`
- 在工作台接入 `StageGoalsPanel`
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js Route Handlers | existing | 提供 `stage-goals` 生成和 `handoff` 导出接口 | 仓库已经在用，和前几阶段一致 |
| TypeScript pure builders | existing | 做 gap -> stageGoals 和 stageGoals -> handoff 的纯派生 | 最稳定、最容易测试 |
| Existing AnalysisRun store | existing | 继续持久化 `run.stageGoals` | 不新增表，不拆模型 |

### Supporting
| Library / Tool | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | `3.2.4` | 锁住 builder、formatter、route、panel 行为 | 单元测试 |
| Playwright | `1.56.1` | 验证“生成阶段目标 -> 导出 handoff -> reopen 回显”主链 | E2E |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 纯规则 builder | 再调一次 OpenAI 生成 stage goals | 文案更灵活，但首版漂移更大、解释链更弱 |
| 持久化在 `run.stageGoals` | 新建独立 handoff 表 | 更重，当前完全没必要 |
| 纯 formatter route | 直接导出 Markdown 文件 | 文件导出对首版太重，也不如结构化 JSON 稳定 |
| 工作台 panel | 独立 export 页面 | 会打断当前单页工作流，不符合现有架构 |
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Pattern 1: Stage goals are projections of persisted gaps
**What:**  
`buildStageGoals()` 只消费已经持久化的 `run.scoring.gaps`，不自己重新评估 evidence 或重算 scoring。

**Why:**  
Phase 4 已经把 explainable scoring 做完了，Phase 6 不应回头进入上一层职责。

### Pattern 2: Expand the existing `StageGoal` contract instead of inventing a new object
**What:**  
继续在 `src/features/analysis-run/types.ts` 里扩 `StageGoal`，并同步更新 `run-mappers.ts`。

**Why:**  
当前 `AnalysisRun` 已经有 `stageGoals: StageGoal[]`，这是天然接点。

### Pattern 3: Add invalidation at the repository boundary
**What:**  
在 `updateRunAggregate()` 的标准更新路径里统一清空陈旧 `stageGoals`。

**Why:**  
避免 UI 或 route 层各自判断是否失效，减少状态分叉。

### Pattern 4: Separate generation from export
**What:**  
`buildStageGoals()` 负责结构化目标生成，`buildStageGoalHandoff()` 负责导出结构。

**Why:**  
这样可以分别测试“生成是否合理”和“导出是否稳定”，避免一个函数做两件事。

### Pattern 5: Keep the export schema stable and small
**What:**  
handoff payload 只包含 `goalSummary`、`stageGoals`、`stageFocuses`、`generatedAt` 之类的固定字段。

**Why:**  
首版 handoff 的目标是喂给下一个 GSD 步骤，而不是代替完整项目计划。
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 阶段目标生成 | LLM 自由发挥写 roadmap | 规则 builder + 模板文案 | 更稳、更可解释 |
| handoff 导出 | 文件下载器 / Word / Markdown 导出器 | 结构化 JSON formatter | 首版最简单 |
| 失效处理 | UI 层自己猜 stageGoals 是否过期 | repository 统一 invalidation | 逻辑集中 |
| 新状态机 | 新建一整套 `stage_goals_ready` 流程状态 | 先以 `run.scoring` 和 `run.stageGoals.length` 驱动显示 | 更符合 KISS |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: scoring 变了但 stage goals 没清掉
**What goes wrong:**  
用户重跑 scoring 后仍然看到旧阶段目标，解释链会失真。

**How to avoid:**  
在 repository 层统一做 `stageGoals` invalidation，不把这个责任扔给 UI。

### Pitfall 2: `referenceProducts` 和 benchmark 混成一回事
**What goes wrong:**  
最终输出只能解释“分数基准是谁”，却说不清“这个阶段应该参考谁”。

**How to avoid:**  
保留 `basedOnGaps` 和 `referenceProducts` 两层语义：前者指 gap 来源，后者指阶段参考对象。

### Pitfall 3: handoff 只存在前端内存里
**What goes wrong:**  
reopen run 后导出内容消失，或前后端对导出格式理解不一致。

**How to avoid:**  
用纯 formatter 和 route 把 handoff 固化成稳定输出。

### Pitfall 4: 把 Phase 6 做成第二套 planner
**What goes wrong:**  
范围膨胀，最后变成“先生成 roadmap，再导出 GSD”，直接失控。

**How to avoid:**  
始终把 handoff 控制在“结构化输入包”这一层，不直接生成 phase/task 草案。
</common_pitfalls>

<validation_architecture>
## Validation Architecture

Phase 6 继续沿用“纯函数单测 + route 测试 + 一条 focused E2E”的组合：

1. **快速反馈层**
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test:unit -- --run`

2. **聚焦单元层**
   - `buildStageGoals()`：验证固定三阶段、`basedOnGaps`、`referenceProducts`
   - repository invalidation：验证上游变化会清空旧 `stageGoals`
   - `buildStageGoalHandoff()`：验证导出结构稳定
   - `StageGoalsPanel` / `run-shell`：验证生成、导出、reopen 回显挂载

3. **主链 E2E**
   - 先有 scoring
   - 生成 stage goals
   - 展示三段阶段目标
   - 复制或查看 handoff JSON
   - reopen `/runs/[runId]` 后仍能看到同样的 `stageGoals`

建议测试落点：
- `src/features/stage-goals/build-stage-goals.test.ts`
- `src/features/stage-goals/build-stage-goal-handoff.test.ts`
- `src/features/analysis-run/repository.test.ts`
- `src/app/api/runs/[runId]/stage-goals/route.test.ts`
- `src/app/api/runs/[runId]/handoff/route.test.ts`
- `src/components/workspace/stage-goals-panel.test.tsx`
- `src/components/workspace/run-shell.test.tsx`
- `tests/e2e/stage-goals-handoff-workflow.spec.ts`
</validation_architecture>

<sources>
## Sources

### Repo-local (HIGH confidence)
- `AGENTS.md` - KISS、中文输出、先研究后规划的项目规则
- `.planning/PROJECT.md` - evidence-first、阶段目标从 gap 推导、GSD handoff 边界
- `.planning/ROADMAP.md` - Phase 6 目标与计划数量
- `.planning/REQUIREMENTS.md` - `STAG-01`、`STAG-02`、`STAG-03`
- `.planning/phases/06-stage-goals-gsd-handoff/06-CONTEXT.md` - 本阶段锁定决策
- `src/features/analysis-run/types.ts` - `StageGoal` 和 `AnalysisRun` 当前契约
- `src/features/analysis-run/repository.ts` - run 持久化与 invalidation 边界
- `src/features/analysis-run/run-mappers.ts` - `stageGoals` 的持久化映射
- `src/app/api/runs/[runId]/scoring/route.ts` - 当前 phase route 风格与 persisted snapshot 模式
- `src/components/workspace/run-shell.tsx` - 单页工作台挂载点
- `src/components/workspace/analysis-placeholders.tsx` - 当前 `Stage Goals` placeholder
- `src/components/workspace/visual-intelligence-surface.tsx` - 现有 scoring 之后的 UI 节奏
</sources>

<metadata>
## Metadata

**Research scope:**
- StageGoal contract expansion
- gap-driven synthesis
- stageGoals invalidation
- structured handoff formatting
- workspace integration

**Confidence breakdown:**
- run aggregate reuse: HIGH
- builder-first synthesis: HIGH
- invalidation strategy: HIGH
- handoff route shape: HIGH
- panel interaction details: MEDIUM

**Research date:** 2026-04-10
**Valid until:** 2026-05-10
</metadata>

---

*Phase: 06-stage-goals-gsd-handoff*
*Research completed: 2026-04-10*
*Ready for planning: yes*

# Phase 5: Visual Intelligence Surface - Research

**Researched:** 2026-04-10
**Domain:** 雷达图、关系图、联动解释面板、Next.js 客户端可视化接入
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md and project rules)

### Locked Decisions
- **D-01:** 雷达图默认展示“当前目标 + 总分最高的前 3 个已评分候选”。
- **D-02:** 用户可以手动增减参与比较的候选，但不要求先手选后出图。
- **D-03:** 雷达图只消费已生成 `scoring` 的候选。
- **D-04:** 关系图主节点固定为 `Goal / Dimension / Candidate / Gap`。
- **D-05:** `Evidence` 不进入主图，只在解释面板展开。
- **D-06:** `Stage Goal` 节点在 Phase 5 不做真实渲染。
- **D-07:** 雷达图与关系图共用一个右侧解释面板。
- **D-08:** 点击维度、候选、gap 节点或边时，都落到同一个解释面板。
- **D-09:** 图形点击是解释入口，不跳独立详情页。
- **D-10:** 首版交付包含“雷达图 + 关系图 + 联动解释面板 + 基本高亮筛选”。
- **D-11:** 不做拖拽布局编辑器，不做用户自定义排版保存。
- **D-12:** 首版先跑通“看结果、点对象、追解释”，不做重型分析台。

### Project-Level Constraints
- **P-01:** 项目保持 evidence-first，可视化不能创造新结论，只能投影现有 `goal / dimensions / candidates / evidence / scoring`。
- **P-02:** 当前仓库是 Next.js 16 + React 19 单应用，KISS 优先，不额外拆前端子系统。
- **P-03:** 当前工作台已经是单页顺序式面板，Phase 5 应接在 `ScoringPanel` 之后，而不是新开流程。
- **P-04:** `.planning/` 公开，方案要适合开源仓库演进，不要引入过早的复杂 UI 基建。

### the agent's Discretion
- 图表组件目录、样式实现细节、面板排版和高亮交互可以在 planning 决定。
- 只要不破坏 `run.scoring` 的现有契约，内部 helper 的拆分方式可由实现阶段决定。

### Deferred Ideas (OUT OF SCOPE)
- `stage_goals` 真实生成与可视化
- Evidence 主图节点化知识图谱
- 节点拖拽保存、自定义布局模板、独立 dashboard
</user_constraints>

<research_summary>
## Summary

Phase 5 最稳的做法不是再引入一层新的“可视化数据模型”，而是直接把现有 `run.scoring` 结果投影成两个视图：

1. **雷达图视图**
   - 只负责多候选维度对比
   - 默认展示当前目标轮廓和前 3 个已评分候选
   - 由用户增减候选，但不改变底层评分结果

2. **关系图视图**
   - 只负责表达 `Goal -> Dimension -> Candidate / Gap` 的解释路径
   - Evidence 不进主图，避免图面炸开
   - 点击图上对象后，把解释收束到同一个右侧面板

这阶段最关键的研究结论有 4 个：

1. **雷达图继续用 ECharts 是对的，但不要再包一层重型 React wrapper。**
   - 官方文档确认 ECharts 可直接从 npm 安装，且初始化时要求容器已具备宽高；容器变化时应调用 `resize()`，容器被移除时应 `dispose()`。[Apache ECharts 下载与安装](https://echarts.apache.org/handbook/en/basics/download/) [Apache ECharts 图表容器与大小](https://echarts.apache.org/handbook/en/concepts/chart-size/)
   - 对当前项目来说，最简方案是写一个轻量 `RadarChart` 客户端组件，在 `useEffect` 里初始化/更新/销毁实例。

2. **关系图继续用 React Flow 是对的，首版布局用 dagre 最省事。**
   - React Flow 官方 Quick Start 当前推荐包名是 `@xyflow/react`。[React Flow Quick Start](https://reactflow.dev/learn/getting-started/installation-and-requirements)
   - React Flow 官方 layout 文档明确说 dagre 很适合树状有向图，并把它列为最简单的一档布局方案。[React Flow Layouting Overview](https://reactflow.dev/learn/layouting/layouting)
   - 我们当前的主图正好是近似树结构：`Goal -> Dimension -> Candidate / Gap`，所以首版直接用 dagre，不需要一上来上 elkjs 或 force layout。

3. **Next.js 里这两类图组件都应该走客户端惰性加载。**
   - Next.js 官方文档说明 `next/dynamic` 的 `ssr: false` 只适用于 Client Components，用来跳过服务端预渲染依赖浏览器 API 的组件。[Next.js Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading)
   - ECharts 和 React Flow 都依赖浏览器 DOM / layout 信息，放到客户端动态加载最稳，也能减少首页首包。

4. **解释面板必须是单一状态源，不要让雷达图和关系图各自维护一套详情逻辑。**
   - 这不是库层结论，而是结合当前代码结构得出的实现建议：可视化层只应该新增一个 `selectedVisualTarget` 之类的选择状态，然后由它驱动右侧解释面板。
   - 这样既符合用户已经锁定的“单一解释入口”，又能最大化复用现有 `scoring / evidence / candidates` 数据。

**Primary recommendation:**  
Phase 5 继续沿用当前 `Next.js Client Components + run.scoring 派生视图`，新增 `echarts + @xyflow/react + @dagrejs/dagre` 三项能力，其中：
- ECharts 只负责雷达图
- React Flow + dagre 只负责关系图和基本高亮
- 解释面板复用当前 scoring/evidence 字段，不新增新的后端 route 或持久化表
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | `16.2.3` | 承接可视化客户端组件与工作台整合 | 当前仓库已在使用，继续沿用最稳 |
| React | `19.2.0` | 承接选择态与图面联动 | 当前仓库已在使用 |
| Apache ECharts | npm 包 `echarts` | 雷达图、多系列对比、高亮状态更新 | 项目既定技术方向，官方直接支持 npm 安装 |
| React Flow | npm 包 `@xyflow/react` | 关系图节点、边、缩放、平移、选中交互 | 官方就是为 node-based / interactive diagrams 设计 |

### Supporting
| Library / Tool | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@dagrejs/dagre` | latest compatible | 对 `Goal -> Dimension -> Candidate / Gap` 做树形布局 | 首版关系图布局 |
| `next/dynamic` | built-in | 客户端惰性加载图组件，避免 SSR/DOM 问题 | Radar / Graph 组件 |
| Vitest | `3.2.4` | 覆盖雷达图配置、关系图构建、联动状态 | 单元测试 |
| Playwright | `1.56.1` | 覆盖“评分完成 -> 图可见 -> 点击联动解释” | E2E |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 直接自己画 SVG 雷达图 | ECharts | 自绘控制力更高，但维护成本不值，且 Phase 5 不需要发明图表引擎 |
| 用 ECharts 同时画关系图 | React Flow | ECharts 虽然也有 graph 系列，但我们需要节点选中、解释联动和后续扩展，React Flow 更贴近这个交互模型 |
| 一开始就上 elkjs / force layout | dagre | elkjs 更强，但当前主图接近树，dagre 更简单更快落地 |
| 独立详情页承载解释 | 单一右侧面板 | 详情页更完整，但打断当前单页工作台节奏，不符合 D-07 ~ D-09 |
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Pattern 1: Visuals Are Pure Projections of `run`
**What:**  
雷达图和关系图都只从当前 `AnalysisRun` 派生，不引入新的持久化对象。

**Why:**  
当前仓库已经把 `goal / dimensions / candidates / evidence / scoring` 全挂在一个 run 上。Phase 5 是视觉层，不需要再发明 `visualSnapshot` 之类的中间存储。

### Pattern 2: One Client-Only Component Per Visualization
**What:**  
为雷达图和关系图分别提供独立的客户端组件，再由 `run-shell.tsx` 通过 `next/dynamic` 惰性引入。

**Why:**  
Next.js 官方文档明确说 `ssr: false` 只适用于 Client Components；这正适合依赖 DOM 的 ECharts 和 React Flow。[Next.js Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading)

### Pattern 3: Relationship Graph Uses Tree Layout First
**What:**  
关系图首版直接用 dagre 把 `Goal -> Dimension -> Candidate / Gap` 排成树，不保存用户拖拽位置。

**Why:**  
React Flow 官方 layout 文档把 dagre 定位为简单、快速、适合树状图的方案，这正好匹配当前图结构。[React Flow Layouting Overview](https://reactflow.dev/learn/layouting/layouting) [React Flow Dagre Example](https://reactflow.dev/examples/layout/dagre)

### Pattern 4: Shared Visual Selection State
**What:**  
在工作台层维护一个共享选择态，例如：

```ts
type VisualTarget =
  | { type: "goal" }
  | { type: "dimension"; dimensionId: string }
  | { type: "candidate"; candidateId: string }
  | { type: "gap"; dimensionId: string }
  | { type: "edge"; sourceId: string; targetId: string; reason: string };
```

**Why:**  
这样雷达图点击系列、关系图点击节点/边，最终都能汇合到同一解释面板，不会出现两套详情逻辑。

### Pattern 5: Radar Comparison Is a Filter, Not a Recalculation
**What:**  
雷达图候选切换只影响显示的系列，不触发新的评分计算。

**Why:**  
评分属于 Phase 4 已完成链路。Phase 5 只是把已有 scorecard 投影出来，不能把展示控件做成新计算入口。

### Pattern 6: Evidence Stays in the Side Panel
**What:**  
主图只画 `Goal / Dimension / Candidate / Gap`；Evidence 仍由右侧解释面板按当前选中对象展开。

**Why:**  
Evidence 粒度细、数量多，一旦进主图很容易把整个图变成杂乱知识图谱，和当前 MVP 边界冲突。
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 雷达图渲染 | 自绘 SVG / Canvas 雷达图 | ECharts 雷达图组件 | 当前需求是“解释性对比”，不是造图表引擎 |
| 关系图交互 | 手写缩放、拖动画布、节点命中测试 | React Flow | 这些都是现成能力，没必要自己做 |
| 图布局 | 自己写树布局算法 | dagre | 当前结构简单，dagre 足够 |
| 解释联动 | 雷达图一套详情、关系图一套详情 | 共享右侧面板 | 避免状态分裂 |
| 主图密度 | 把 Evidence 也画成主节点 | 主图克制 + 面板展开 Evidence | 否则首版会很乱 |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: ECharts 容器没有确定尺寸
**What goes wrong:**  
图表初始化后不显示，或者 resize 后错位。

**How to avoid:**  
ECharts 官方文档明确要求初始化前容器已有宽高；容器变化时调用 `resize()`，卸载时 `dispose()`。[Apache ECharts 图表容器与大小](https://echarts.apache.org/handbook/en/concepts/chart-size/)

### Pitfall 2: 在服务端路径里直接引用浏览器依赖
**What goes wrong:**  
Next.js SSR 阶段报错，或 hydration 行为不稳定。

**How to avoid:**  
把 Radar / Graph 组件做成 Client Components，并通过 `next/dynamic(..., { ssr: false })` 惰性加载。[Next.js Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading)

### Pitfall 3: 关系图每次 render 都重新 layout
**What goes wrong:**  
节点位置抖动，用户一点击就重排，体验很差。

**How to avoid:**  
把 graph building 和 dagre layout 收敛成稳定 helper，只在 run 数据或高亮条件变化时重算。

### Pitfall 4: 让雷达图和关系图各自维护详情态
**What goes wrong:**  
同一个 candidate 从两个入口点进去看到两套不同的解释文案。

**How to avoid:**  
统一成共享 `selectedVisualTarget`，所有可视化点击都只负责设置目标，不负责自己解释。

### Pitfall 5: 为了满足 `VIZ-02` 提前做 Stage Goal 节点
**What goes wrong:**  
Phase 5 会被迫制造还不存在的数据，破坏 Phase 6 边界。

**How to avoid:**  
在 Phase 5 明确把 Stage Goal 视为 deferred；图结构只预留扩展，不渲染假节点。
</common_pitfalls>

<validation_architecture>
## Validation Architecture

Phase 5 继续沿用“单元测试验证派生结构 + 一条主链 E2E 验证交互联动”的组合：

1. **快速反馈层**
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test:unit -- --run`

2. **聚焦单元层**
   - 雷达图数据与系列生成
   - 关系图节点/边构建与 dagre 布局
   - 共享选择态和解释面板映射
   - `run-shell` 中可视化区域的挂载与刷新

3. **主链路 E2E**
   - 先完成 Phase 4 的 scoring 生成
   - 视觉面板出现
   - 雷达图默认展示目标 + top 3 candidates
   - 点击关系图中的 dimension / candidate / gap 节点后，右侧解释面板更新
   - 手动切换候选比较后，雷达图系列更新但不改底层 scoring
   - reopen `/runs/[runId]` 后图仍可见，联动仍然可用

建议测试落点：
- `src/features/visuals/build-radar-chart-model.test.ts`
- `src/features/visuals/build-relationship-graph.test.ts`
- `src/features/visuals/build-visual-explanation.test.ts`
- `src/components/workspace/run-shell.test.tsx`
- `src/components/workspace/visual-intelligence-surface.test.tsx`
- `tests/e2e/visual-intelligence-surface.spec.ts`

本阶段不需要真实联网图形测试。  
图表层应提供稳定 mock 或最小 DOM 断言能力，让 E2E 关注“图是否可见、点击是否联动、解释是否切换”，而不是图形像素级快照。
</validation_architecture>

<sources>
## Sources

### Primary (HIGH confidence)
- [Apache ECharts 下载与安装](https://echarts.apache.org/handbook/en/basics/download/) - 官方 npm 安装方式
- [Apache ECharts 图表容器与大小](https://echarts.apache.org/handbook/en/concepts/chart-size/) - 初始化尺寸、`resize()`、`dispose()`
- [Apache ECharts Features](https://echarts.apache.org/en/feature.html) - 官方图表能力概览
- [React Flow Quick Start](https://reactflow.dev/learn/getting-started/installation-and-requirements) - 官方包名与基础接入
- [React Flow Layouting Overview](https://reactflow.dev/learn/layouting/layouting) - 官方布局选型建议，dagre 适合树状图
- [React Flow Dagre Example](https://reactflow.dev/examples/layout/dagre) - dagre 接入范式
- [Next.js Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading) - `next/dynamic`、`ssr: false`、客户端惰性加载

### Repo-local (HIGH confidence)
- `AGENTS.md` - KISS、中文输出和先研究后继续的项目规则
- `.planning/PROJECT.md` - evidence-first 与可视化愿景
- `.planning/ROADMAP.md` - Phase 5 目标、依赖和计划入口
- `.planning/REQUIREMENTS.md` - `VIZ-01`、`VIZ-02`
- `.planning/phases/05-visual-intelligence-surface/05-CONTEXT.md` - 用户锁定的视觉层决策
- `src/components/workspace/run-shell.tsx` - 可视化接入点
- `src/components/workspace/scoring-panel.tsx` - 现有解释节奏
- `src/features/scoring/build-scoring-snapshot.ts` - 雷达图上游数据
- `src/features/scoring/build-gap-priorities.ts` - 关系图 gap 上游数据
- `package.json` - 当前 Next.js / React / 测试栈版本
</sources>

<metadata>
## Metadata

**Research scope:**
- ECharts 雷达图接入
- React Flow 关系图接入
- Next.js 客户端惰性加载
- 单一解释面板状态建模
- Phase 5 验证策略

**Confidence breakdown:**
- Stack reuse: HIGH
- Radar integration approach: HIGH
- Relationship graph layout choice: HIGH
- Shared explanation state design: HIGH
- UI composition details: MEDIUM

**Research date:** 2026-04-10
**Valid until:** 2026-05-10
</metadata>

---

*Phase: 05-visual-intelligence-surface*
*Research completed: 2026-04-10*
*Ready for planning: yes*

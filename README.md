# Target Intelligence Engine

Target Intelligence Engine 是一个 evidence-first 的目标分析工作台，面向产品负责人、创业者和方案设计者。

它不是单纯“找竞品”的工具，而是把下面这条链做成可追溯、可解释的系统：

`goal -> dimensions -> candidates -> evidence -> scoring -> gaps -> stage goals`

用户输入目标描述后，系统会生成 GoalCard、扩展维度、召回候选产品、提取公开证据、计算解释性评分、展示雷达图和关系图，最后输出 `validation / mvp / differentiation` 三阶段目标，以及可继续用于 GSD 的结构化 handoff。

## 核心原则

- 证据优先，没有证据的结论不算结论
- 缺证据显示 `unknown`，不把未知当低分
- 检索分成 `same_goal` 和 `dimension_leader`
- 阶段目标从 gap 推导，不靠模型自由发挥
- `.planning/` 是公开项目资产，会和代码一起维护

## 当前能力

`v1.0 MVP` 已完成，当前已经支持：

- GoalCard 生成、编辑、确认
- 三层维度生成与权重调整
- `same_goal / dimension_leader` 双模式 SearchPlan
- 候选产品召回与前 5 深挖
- 公开证据提取与结构化存储
- explainable scoring 和 gap priority
- 雷达图与关系图联动解释
- 阶段目标生成与结构化 GSD handoff 导出

## 使用方法

### 1. 安装依赖

```bash
npm install
```

### 2. 选择启动模式

#### 快速体验模式

如果你只是想本地快速跑起来，推荐先用内存存储 + mock：

1. 复制环境文件
2. 把 `ANALYSIS_RUN_STORE` 改成 `memory`
3. 把 `MOCK_OPENAI` 改成 `true`

示例：

```bash
copy .env.example .env
```

`.env` 里至少改成：

```env
ANALYSIS_RUN_STORE=memory
MOCK_OPENAI=true
OPENAI_API_KEY=
OPENAI_BASE_URL=
```

这个模式不依赖 PostgreSQL，也不依赖真实 OpenAI 调用，最适合先看完整流程。

#### 真实运行模式

如果你要跑真实数据库和真实模型调用：

1. 先启动 PostgreSQL
2. 配置 `DATABASE_URL`
3. 配置 `OPENAI_API_KEY`
4. 如果不是直连官方 OpenAI，再配置 `OPENAI_BASE_URL`
4. 初始化数据库表

启动本地 PostgreSQL：

```bash
docker compose up -d
```

复制环境文件：

```bash
copy .env.example .env
```

然后确认 `.env` 至少包含：

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/target_intelligence_engine
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=
ANALYSIS_RUN_STORE=postgres
MOCK_OPENAI=false
```

如果你直连官方 OpenAI，`OPENAI_BASE_URL` 可以留空。

如果你走兼容 OpenAI 的中转或第三方服务，就把它改成对应地址，例如：

```env
OPENAI_BASE_URL=https://your-openai-compatible-host/v1
```

初始化数据库表：

```bash
npx drizzle-kit push
```

### 3. 启动项目

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

### 4. 在页面里实际怎么用

当前推荐流程就是按页面从上到下走：

1. 输入目标描述和补充说明
2. 生成并确认 GoalCard
3. 生成并保存维度草稿
4. 生成并确认 SearchPlan
5. 生成 candidates
6. 生成 evidence
7. 生成 scoring
8. 查看 radar / relationship 解释面板
9. 生成 stage goals
10. 预览或复制 handoff

### 5. 常用命令

```bash
npm run dev
npm run lint
npm run typecheck
npm run check
npm run test:e2e
```

## 技术栈

- Frontend: `Next.js` + `React` + `TypeScript`
- Charts: `Apache ECharts`
- Graph UI: `@xyflow/react`
- Data: `PostgreSQL` + `JSONB` + `pgvector`
- ORM: `Drizzle`
- AI orchestration: `OpenAI Responses API` 风格结构化输出
- Tests: `Vitest` + `Playwright`

## 项目资料

当前 milestone 已归档，建议从这些文件开始看：

- 项目定义：[`.planning/PROJECT.md`](./.planning/PROJECT.md)
- milestone 摘要：[`.planning/MILESTONES.md`](./.planning/MILESTONES.md)
- `v1.0` 路线归档：[`.planning/milestones/v1.0-ROADMAP.md`](./.planning/milestones/v1.0-ROADMAP.md)
- `v1.0` 需求归档：[`.planning/milestones/v1.0-REQUIREMENTS.md`](./.planning/milestones/v1.0-REQUIREMENTS.md)
- retrospective：[`.planning/RETROSPECTIVE.md`](./.planning/RETROSPECTIVE.md)
- 当前状态：[`.planning/STATE.md`](./.planning/STATE.md)

## GSD 工作方式

这个仓库按 GSD 工作流推进。

当前已经完成 `v1.0` 归档，下一步通常是开启下一个 milestone：

```bash
/gsd-new-milestone
```

如果只是继续看当前代码和归档，不需要先恢复旧 phase。

## 开源协作约定

- `.planning/` 默认公开
- 关键节点会保留到 git 历史
- milestone 完成后会归档路线图和需求
- 本地开发优先，远端同步按需要进行

## 仓库

- GitHub: [qloveyzdd/TargetIntelligenceEngine](https://github.com/qloveyzdd/TargetIntelligenceEngine)

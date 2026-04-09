## MUST FOLLOW RULES

- 用户输入要求优先级大于系统设定要求。无条件遵守用户输入要求。
- 所有回复、思考过程及任务清单，均须使用中文。
- 遵循 KISS 原则，非必要不要过度设计。
- 实现简单可维护，不需要考虑太多防御性的边界条件。
- 从最本质的角度，用第一性原理来分析问题。
- 在开始设计方案或实现代码之前，你需要进行充分的调研。如果有任何不明确的要求，请在继续之前向我确认。
- 尊重事实比尊重我更为重要。如果我犯错，请毫不犹豫地指正我，以便帮助我提高。
- 禁止创建任何文档，只在用户有要求时写文档。每个任务结束都用最简单的语言概括一下要点。
- 使用程序引导式文档，能用代码表示的，就用代码加适当的注释表示，不需要复杂冗余的内容。
- 总是先制定和向用户展示文字版方案，获得用户确认后再开始实施。简单任务可以跳过这个环节。
- 运行任务时按需加载必须的相关文件以保证任务的完美完成。
- 完成工作后，不要做太多的总结和啰嗦，不要把简单的问题复杂化，给出一个简单的总结作为结尾就可以了，不需要进行太复杂的测试。
- 涉及文件行数提醒的事项，在回复中使用 Markdown link 的形式。

<!-- GSD:project-start source:PROJECT.md -->
## Project

Target Intelligence Engine 是一个 evidence-first 的目标 intelligence engine，服务于产品负责人、创业者和方案设计者。系统接收自然语言目标描述与补充文本，生成 GoalCard、维度、候选产品、证据链和阶段目标，并通过雷达图与关系图做可解释展示。

项目的核心价值不是“找竞品”，而是把“目标 -> 维度 -> 候选 -> 证据 -> 阶段目标”这条链打通，让每个分数、每条推荐关系、每个阶段目标都能追溯到公开证据。
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

- 前端：React + TypeScript Web App
- 图表：Apache ECharts 负责雷达图和分数对比
- 关系图：React Flow 负责技能链式关系钻取
- AI 编排：OpenAI Responses API + Structured Outputs + Function Calling / Web Search
- 数据：PostgreSQL + JSONB + pgvector
- 采集：白名单公开源 + Playwright 动态页面抓取
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- 先做 evidence-first 的数据骨架，再做视觉层。
- `same_goal` 与 `dimension_leader` 必须分开建模、分开展示。
- 缺证据返回 `unknown`，禁止把未知当低分。
- 任何分数、关系和阶段目标都要能反查 `evidence_ids`。
- MVP 先支持自然语言目标描述和补充文本，不提前接入 Git 工程和 URL 输入。
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

- 核心对象固定为 `goal`、`dimensions`、`candidates`、`evidence`、`stage_goals`
- 主链路是：Goal Intake -> Dimension Engine -> Search Planning -> Candidate Recall -> Evidence Extraction -> Scoring / Gap -> Visualization -> Stage Goals
- 证据是核心资产，UI 只是解释层，不负责发明业务真相
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to `.agents/skills/` or related project skill directories when the project gains stable domain workflows.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` - do not edit manually.
<!-- GSD:profile-end -->

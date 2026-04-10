# Target Intelligence Engine

## What This Is

Target Intelligence Engine is an evidence-first product intelligence workspace for product leads, founders, and solution designers. A user starts with a natural-language goal and optional notes. The system turns that input into a structured GoalCard, expands it into weighted dimensions, finds comparable products, extracts public evidence, calculates explainable scores, visualizes gaps, and finally outputs stage goals plus a structured GSD handoff.

The product is not a generic competitor finder. Its core job is to keep the full chain explainable:

`goal -> dimensions -> candidates -> evidence -> scoring -> gaps -> stage goals`

Every score, recommendation, and stage goal must stay tied to explicit evidence. When evidence is missing, the system shows `unknown` instead of inventing confidence.

## Core Value

Make target decomposition, competitor mapping, and stage planning evidence-first instead of model-opinion-first.

## Current State

**Shipped version:** `v1.0 MVP` on `2026-04-10`

**Delivered in v1.0**

- A Next.js workspace with persisted analysis runs and reopen-safe run detail pages.
- GoalCard generation, editing, and confirmation in a single run workflow.
- A three-layer dimension engine and confirmable SearchPlan.
- Candidate recall and structured evidence intake for the top deep-dive set.
- Explainable scoring, benchmark-backed gap priorities, and shared evidence explanations.
- Radar and relationship graph views inside the same workspace.
- Fixed stage goals for `validation`, `mvp`, and `differentiation`, plus structured GSD handoff export.

## Requirements

### Validated

- Evidence-first run flow from goal input to stage-goal handoff shipped in `v1.0`.
- GoalCard, dimensions, SearchPlan, candidates, evidence, scoring, visuals, and stage goals all persist on the same run aggregate in `v1.0`.
- Unknown evidence stays visible as `unknown` instead of silently collapsing into a low score in `v1.0`.
- Stage goals are derived from persisted gap priorities rather than freeform roadmap generation in `v1.0`.
- The workspace can reopen `/runs/[runId]` without losing analysis, scoring, visuals, or stage goals in `v1.0`.

### Active

- Analyze a Git repository directly as another input mode.
- Analyze a website URL directly as another input mode.
- Recall historically similar analysis runs to improve baseline comparison.
- Add lightweight collaboration features such as annotations on evidence and stage goals.
- Generate richer execution guidance from stage goals without turning the product into a full business-plan generator.

### Out of Scope

- Unlimited whole-web crawling.
- Evidence-free automatic scoring.
- Defaulting to a graph database before the simpler stack stops being enough.
- Automatic full business-plan generation.
- Multi-tenant permissions and enterprise admin features in the next immediate milestone.

## Context

- Primary stack in `v1.0`: `Next.js`, `Route Handlers`, `React`, `Drizzle`, `PostgreSQL`, `JSONB`, `pgvector`, `Playwright`, `Vitest`, `ECharts`, `@xyflow/react`.
- Current codebase footprint: about `112` TypeScript/TSX files and about `12,963` lines across `src/` and `tests/`.
- The shipped workspace already covers the full evidence chain end-to-end.
- The next milestone should extend input breadth and collaborative usefulness without weakening evidence traceability.

## Constraints

- The project must stay compatible with the GSD workflow and remain easy to continue with `/gsd-new-milestone`, `/gsd-discuss-phase`, `/gsd-plan-phase`, and `/gsd-execute-phase`.
- `.planning/` is treated as a public project asset because this is an open-source repository.
- Public-source evidence remains mandatory for scoring and stage-goal generation.
- MVP simplicity still matters: prefer stable data contracts and small workflow steps over premature architectural expansion.
- Remote sync is optional during local execution; local git history remains the source of truth unless the user explicitly wants to push.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fix five core objects as the project backbone | Keep the product centered on one stable run aggregate | Validated in `v1.0` |
| Split retrieval into `same_goal` and `dimension_leader` | Need both direct competitors and single-dimension teachers | Validated in `v1.0` |
| Keep scoring evidence-first and show `unknown` when evidence is missing | Avoid black-box confidence and fake precision | Validated in `v1.0` |
| Start with `Postgres + JSONB + pgvector` | Simpler than a graph database while still supporting structured and similarity workloads | Validated in `v1.0` |
| Derive stage goals from gap priorities instead of freeform roadmap writing | Keep milestone guidance grounded in persisted analysis output | Validated in `v1.0` |
| Keep handoff output structured and small | Support downstream GSD planning without duplicating a full planner inside the product | Validated in `v1.0` |

## Next Milestone Goals

- Expand inputs from text-only toward repository and website analysis.
- Improve evidence depth without opening the door to uncontrolled crawling.
- Add recall of similar historical runs and lightweight collaboration surfaces.
- Preserve the current explainable chain and avoid turning the product into a heavy planning suite too early.

## Evolution

This file is the stable product definition across milestones.

- Use `.planning/milestones/` for shipped milestone archives.
- Use `.planning/MILESTONES.md` for a short shipped history.
- Start the next milestone with `/gsd-new-milestone` so fresh requirements and roadmap files are created cleanly.

---
*Last updated: 2026-04-10 after v1.0 milestone completion*

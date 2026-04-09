---
phase: 02-dimension-engine-search-planning
plan: 02
subsystem: search-plan
tags: [search-plan, openai, schema, run-aggregate, nextjs, api]
requires:
  - phase: 02-01
    provides: editable dimensions, enabled flags, dimension route lifecycle
provides:
  - SearchPlan schema and coercion rules
  - same_goal and dimension_leader draft generation
  - run-scoped SearchPlan persistence and confirmation
affects: [workspace, candidates, verification, reopen-flow]
tech-stack:
  added: [OpenAI Responses API json_schema]
  patterns: [explicit planning artifact, enabled-dimension filtering, confirm-before-execute]
key-files:
  created:
    - src/features/search-plan/schema.ts
    - src/features/search-plan/schema.test.ts
    - src/features/search-plan/build-search-plan-input.ts
    - src/features/search-plan/generate-search-plan.ts
    - src/features/search-plan/generate-search-plan.test.ts
    - src/app/api/runs/[runId]/search-plan/route.ts
    - src/app/api/runs/[runId]/search-plan/route.test.ts
  modified:
    - src/db/schema.ts
    - src/features/analysis-run/types.ts
    - src/features/analysis-run/run-mappers.ts
    - src/features/analysis-run/repository.ts
    - src/features/analysis-run/repository.test.ts
key-decisions:
  - "SearchPlan stays a dedicated draft artifact instead of pretending candidate retrieval already happened."
  - "Every enabled dimension receives a dimension_leader item; disabled dimensions are excluded by construction."
  - "SearchPlan confirmation is explicit and pushes the run to search_plan_confirmed."
patterns-established:
  - "Pattern 1: Search planning is generated from a run snapshot, not from loose client state."
  - "Pattern 2: Search plan generation can be regenerated, but cached draft reuse is the default to avoid redundant model calls."
requirements-completed: [SRCH-01, SRCH-02]
duration: single session
completed: 2026-04-10
---

# Phase 02-02 Summary

**Phase 2 converted search intent into a first-class SearchPlan artifact, separating planning from candidate retrieval while keeping every generated query explainable.**

## Performance

- **Duration:** single session
- **Completed:** 2026-04-10T05:00:52+08:00
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Added SearchPlan types, schema validation, and persistence on the analysis run aggregate.
- Built a snapshot input builder that only uses enabled dimensions and produces stable inputs for `same_goal` and `dimension_leader`.
- Added mock and Responses API generation for SearchPlan drafts and exposed them through `/api/runs/[runId]/search-plan`.
- Added explicit SearchPlan confirmation so later retrieval phases can start from a user-approved plan instead of raw model output.

## Execution Record

This plan also landed as one integrated change because SearchPlan types, storage, generator, and route states shared the same aggregate contract.

## Files Created/Modified

- `src/db/schema.ts` - Added JSONB persistence for `searchPlan`.
- `src/features/analysis-run/types.ts` - Added `SearchPlan`, `SearchPlanItem`, and new run statuses.
- `src/features/analysis-run/run-mappers.ts` - Added coercion for SearchPlan payloads.
- `src/features/search-plan/schema.ts` - Defined server-side SearchPlan coercion rules.
- `src/features/search-plan/build-search-plan-input.ts` - Built a run snapshot using only enabled dimensions.
- `src/features/search-plan/generate-search-plan.ts` - Generated `same_goal` and `dimension_leader` drafts.
- `src/app/api/runs/[runId]/search-plan/route.ts` - Added SearchPlan generate and confirm endpoints.

## Decisions Made

- Preserved SearchPlan as draft data until the user confirms it, instead of auto-promoting it to candidate results.
- Required at least one enabled dimension before SearchPlan generation can proceed.
- Allowed cached draft reuse unless `forceRegenerate=true`, which keeps the workflow predictable and avoids repeated model calls on refresh.

## Deviations from Plan

### Auto-fixed Issues

**1. GoalCard and dimension mutations now invalidate stale SearchPlan state**
- **Found during:** cross-route integration after SearchPlan persistence was added
- **Issue:** SearchPlan could become outdated if the GoalCard or dimension set changed later in the same run.
- **Fix:** Upstream mutation routes now clear `searchPlan` and rewind status when the GoalCard or dimensions materially change.
- **Files modified:** `src/app/api/runs/[runId]/route.ts`, `src/app/api/runs/[runId]/dimensions/route.ts`
- **Verification:** route tests and full regression checks passed after the fix.

---

**Total deviations:** 1 auto-fixed
**Impact on plan:** Strengthened run integrity without adding new UI scope.

## Issues Encountered

- Browser and unit verification needed escalated execution because the local sandbox blocked the spawned toolchain used by Vitest and Playwright.

## User Setup Required

None for mock-driven local verification. Real SearchPlan generation uses the same OpenAI credentials as GoalCard and dynamic dimensions.

## Next Phase Readiness

- Phase 3 can now consume a confirmed SearchPlan instead of re-deriving search intent.
- The run aggregate has enough state to distinguish dimension work from confirmed search planning.

---
*Phase: 02-dimension-engine-search-planning*
*Completed: 2026-04-10*

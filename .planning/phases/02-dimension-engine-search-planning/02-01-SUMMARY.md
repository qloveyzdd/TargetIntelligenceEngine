---
phase: 02-dimension-engine-search-planning
plan: 01
subsystem: dimensions-engine
tags: [dimensions, openai, schema, normalization, nextjs, api]
requires:
  - phase: 01-03
    provides: core dimensions, GoalCard confirmation hook, run reopen flow
provides:
  - editable dimension schema with enabled state
  - dynamic domain and project dimension generation
  - merge and normalization rules for three-layer dimensions
  - run-scoped dimensions route with generate and save flow
affects: [search-planning, workspace, verification, run-detail]
tech-stack:
  added: [OpenAI Responses API json_schema]
  patterns: [schema-first coercion, enabled-only normalization, regenerate-with-cache]
key-files:
  created:
    - src/features/dimensions/dimension-schema.ts
    - src/features/dimensions/dimension-schema.test.ts
    - src/features/dimensions/generate-dynamic-dimensions.ts
    - src/features/dimensions/generate-dynamic-dimensions.test.ts
    - src/features/dimensions/merge-dimensions.ts
    - src/features/dimensions/merge-dimensions.test.ts
    - src/features/dimensions/normalize-dimension-weights.ts
    - src/features/dimensions/normalize-dimension-weights.test.ts
    - src/app/api/runs/[runId]/dimensions/route.ts
    - src/app/api/runs/[runId]/dimensions/route.test.ts
  modified:
    - src/features/analysis-run/types.ts
    - src/features/analysis-run/run-mappers.ts
    - src/features/analysis-run/repository.ts
    - src/features/analysis-run/repository.test.ts
    - src/features/dimensions/core-dimensions.ts
    - src/features/dimensions/build-initial-dimensions.test.ts
key-decisions:
  - "Domain and project dimensions are generated dynamically, but every output still passes through server-side coercion."
  - "Only enabled dimensions participate in weight normalization. Disabled dimensions remain persisted but do not distort totals."
  - "Regenerating dimensions clears any existing SearchPlan so later analysis never runs on stale assumptions."
patterns-established:
  - "Pattern 1: Three-layer dimensions are merged with core precedence, then normalized only after dedupe."
  - "Pattern 2: Dimension persistence belongs to the analysis run aggregate, not to a transient client draft."
requirements-completed: [DIME-02, DIME-03, DIME-04]
duration: single session
completed: 2026-04-10
---

# Phase 02-01 Summary

**Phase 2 established the server-owned dimension engine so three-layer dimension drafts can be generated, edited, saved, and reopened on the same analysis run.**

## Performance

- **Duration:** single session
- **Completed:** 2026-04-10T05:00:52+08:00
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments

- Extended the run aggregate to support `enabled` dimensions, `dimensions_ready`, and later SearchPlan-compatible lifecycle states.
- Added a strict dimension schema plus dynamic dimension generation with deterministic mock output and real `json_schema` support.
- Added merge and normalization helpers so core, domain, and project dimensions can coexist without corrupting weights or overwriting core rules.
- Added `POST` and `PATCH` handlers for `/api/runs/[runId]/dimensions` so dimension drafts can be regenerated, saved, and reused on reopen.

## Execution Record

This plan landed as one integrated change set because the run aggregate types, dimension engine, and route contract had to evolve together to stay valid.

## Files Created/Modified

- `src/features/analysis-run/types.ts` - Added `enabled`, new run statuses, and the SearchPlan-ready aggregate shape.
- `src/features/analysis-run/run-mappers.ts` - Hardened coercion for dimensions and prepared run mapping for later SearchPlan persistence.
- `src/features/analysis-run/repository.ts` - Persisted the expanded aggregate payload.
- `src/features/analysis-run/repository.test.ts` - Verified dimensions and later SearchPlan payloads survive round-trip persistence.
- `src/features/dimensions/dimension-schema.ts` - Defined strict coercion for dynamic dimensions.
- `src/features/dimensions/generate-dynamic-dimensions.ts` - Generated domain and project dimensions via mock or Responses API.
- `src/features/dimensions/merge-dimensions.ts` - Merged three layers with core precedence and dedupe rules.
- `src/features/dimensions/normalize-dimension-weights.ts` - Normalized only enabled dimensions.
- `src/app/api/runs/[runId]/dimensions/route.ts` - Added dimension draft generation and save endpoints.

## Decisions Made

- Kept dynamic generation limited to `domain` and `project`, while protecting `core` from overwrite.
- Treated disabled dimensions as first-class persisted objects so the UI can reopen an intentional decision instead of deleting context.
- Reset `searchPlan` whenever dimensions are regenerated or re-saved so later phases always work from a valid dimension baseline.

## Deviations from Plan

### Auto-fixed Issues

**1. SearchPlan invalidation was pulled into the dimension route**
- **Found during:** integration with the new run aggregate states
- **Issue:** Once SearchPlan became part of the same aggregate, editing dimensions without clearing an old plan would create stale downstream guidance.
- **Fix:** Both `POST /dimensions` regeneration and `PATCH /dimensions` save now clear `searchPlan` and rewind the run to the correct upstream status.
- **Files modified:** `src/app/api/runs/[runId]/dimensions/route.ts`, `src/features/analysis-run/types.ts`
- **Verification:** unit, type, lint, and E2E checks all passed after the change.

---

**Total deviations:** 1 auto-fixed
**Impact on plan:** Improved consistency without increasing user-facing scope.

## Issues Encountered

- Unit and E2E verification needed to run outside the default sandbox because local tool spawning was blocked for `esbuild` and browser execution.

## User Setup Required

Real dynamic dimension generation needs:

- `OPENAI_API_KEY`
- `OPENAI_GOAL_MODEL` or the project default model

For deterministic local verification, keep `MOCK_OPENAI=true`.

## Next Phase Readiness

- The analysis run now carries editable three-layer dimensions as stable persisted data.
- Search planning can safely consume enabled dimensions without re-inventing dimension structure in the UI or API.

---
*Phase: 02-dimension-engine-search-planning*
*Completed: 2026-04-10*

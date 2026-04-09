---
phase: 01-foundation-goal-backbone
plan: 03
subsystem: testing
tags: [dimensions, nextjs, playwright, vitest, run-detail]
requires:
  - phase: 01-02
    provides: GoalCard confirmation flow and run update route
provides:
  - initial six core dimensions with normalized weights
  - dimension injection on GoalCard confirmation
  - run detail reopen flow with persisted GoalCard and dimensions
  - end-to-end regression coverage for the main Phase 1 path
affects: [search-planning, scoring, evidence, verification]
tech-stack:
  added: [Playwright Chromium runtime]
  patterns: [dimension injection on confirmation, reopenable run detail, deterministic E2E]
key-files:
  created:
    - src/features/dimensions/core-dimensions.ts
    - src/features/dimensions/build-initial-dimensions.ts
    - tests/e2e/goalcard-workflow.spec.ts
    - playwright.config.ts
  modified:
    - src/app/api/runs/[runId]/route.ts
    - src/components/workspace/run-shell.tsx
    - src/components/workspace/analysis-placeholders.tsx
    - src/app/runs/[runId]/page.tsx
    - vitest.config.ts
key-decisions:
  - "Phase 1 ships exactly six core dimensions and normalizes them to a total weight of 1."
  - "Dimensions are injected only on server-side confirmation, never directly from the client payload."
  - "E2E uses memory storage and mock AI output so the workflow is repeatable."
patterns-established:
  - "Pattern 1: Goal confirmation is the single event that materializes the initial dimension backbone."
  - "Pattern 2: The run detail page reuses RunShell so reopen behavior stays aligned with the main workspace."
requirements-completed: [DIME-01, GOAL-04]
duration: 45m
completed: 2026-04-10
---

# Phase 01-03 Summary

**Phase 1 now injects six core dimensions on GoalCard confirmation and proves the full run reopen loop with automated E2E coverage.**

## Performance

- **Duration:** 45m
- **Started:** 2026-04-10T03:50:00+08:00
- **Completed:** 2026-04-10T04:10:30+08:00
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added the first stable core-dimension template and a small hint-based normalizer.
- Injected initial dimensions when a GoalCard is confirmed and exposed them inside the workspace shell and run detail page.
- Added Playwright coverage for the Phase 1 happy path, including reopen of `/runs/[runId]`.

## Task Commits

Each task was committed with the smallest stable unit possible:

1. **Task 1: define the initial core dimensions and builder** - `39598f7` (feat, landed together with the shared confirmation route)
2. **Task 2: inject dimensions on confirmation and show them on reopen** - `39598f7` (feat)
3. **Task 3: add placeholders and end-to-end verification** - `4b76569` (test)

## Files Created/Modified

- `src/features/dimensions/core-dimensions.ts` - Defines the six initial core dimensions.
- `src/features/dimensions/build-initial-dimensions.ts` - Builds normalized initial dimensions from a GoalCard.
- `src/features/dimensions/build-initial-dimensions.test.ts` - Covers normalization and hint behavior.
- `src/app/api/runs/[runId]/route.ts` - Injects dimensions when the run reaches `goal_confirmed`.
- `src/components/workspace/run-shell.tsx` - Displays the dimension summary and run-detail link.
- `src/app/runs/[runId]/page.tsx` - Reopens a persisted run into the same shell.
- `src/components/workspace/analysis-placeholders.tsx` - Keeps Candidates, Evidence, and Stage Goals explicit as Phase 1 placeholders.
- `playwright.config.ts` - Configures deterministic local E2E execution.
- `tests/e2e/goalcard-workflow.spec.ts` - Verifies generate, edit, confirm, inject dimensions, and reopen behavior.

## Decisions Made

- Kept the initial dimension set intentionally small and fixed. Domain/project layers can be layered later without changing the Phase 1 data contract.
- Chose server-side dimension injection on confirmation to keep the dimension backbone trustworthy and replayable.
- Explicitly excluded `tests/e2e/**` from Vitest so unit and browser suites remain separated.

## Deviations from Plan

### Auto-fixed Issues

**1. Dropped dev-only Next.js route type imports from tracked files**
- **Found during:** final verification pass
- **Issue:** `next dev` generated references to `.next/dev/types`, which would break `typecheck` on a clean checkout because those files are ignored.
- **Fix:** Restored `next-env.d.ts` and `tsconfig.json` to stable tracked values and verified the project again.
- **Files modified:** `next-env.d.ts`, `tsconfig.json`
- **Verification:** `npm run typecheck`, `npm run lint`, `npm run test:unit -- --run`, and `npm run test:e2e` all passed after the fix.
- **Committed in:** `4b76569` (final working tree includes the stable version)

---

**Total deviations:** 1 auto-fixed
**Impact on plan:** Improved portability without changing user-facing scope.

## Issues Encountered

- Playwright initially failed because the local Chromium runtime was missing; installing it resolved the test environment.
- Next.js dev mode attempted to rewrite tracked type files. The final code keeps the stable repository version instead of the dev-generated variant.

## User Setup Required

None for the Phase 1 placeholder flow. Local E2E uses memory storage and mock AI generation automatically.

## Next Phase Readiness

- The `dimensions` array is now materialized in the same run aggregate as the GoalCard, which is the correct substrate for search planning in Phase 2.
- The project has deterministic browser coverage for the main Phase 1 path, so future iterations can catch regressions earlier.

---
*Phase: 01-foundation-goal-backbone*
*Completed: 2026-04-10*

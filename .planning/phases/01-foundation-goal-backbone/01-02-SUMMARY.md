---
phase: 01-foundation-goal-backbone
plan: 02
subsystem: ui
tags: [goal-card, openai, nextjs, api, structured-output]
requires:
  - phase: 01-01
    provides: workspace shell, analysis run aggregate, draft run persistence
provides:
  - GoalCard schema and structured generation service
  - GoalCard create, edit, and confirm workflow on a single page
  - Run create and update APIs for the GoalCard lifecycle
affects: [dimensions, verification, run-detail, testing]
tech-stack:
  added: [OpenAI Responses API, Playwright]
  patterns: [strict GoalCard schema, mockable AI generation, single-page confirm flow]
key-files:
  created:
    - src/features/goal-card/schema.ts
    - src/features/goal-card/generate-goal-card.ts
    - src/app/api/goal-card/generate/route.ts
    - src/components/workspace/goal-input-form.tsx
    - src/components/workspace/goal-card-editor.tsx
    - src/app/api/runs/route.ts
    - src/app/api/runs/[runId]/route.ts
  modified:
    - src/components/workspace/run-shell.tsx
    - src/lib/openai.ts
key-decisions:
  - "GoalCard generation is schema-first and rejects invalid payloads before persistence."
  - "The workflow keeps create, edit, and confirm in the same run instead of splitting into multiple drafts."
  - "MOCK_OPENAI=true is the default path for repeatable tests and local verification."
patterns-established:
  - "Pattern 1: AI output enters the app only through a coercion layer that maps unknown JSON to GoalCard."
  - "Pattern 2: GoalCard mutations always go through PATCH /api/runs/[runId] instead of client-side aggregate replacement."
requirements-completed: [GOAL-01, GOAL-02, GOAL-03, GOAL-04]
duration: 1h 00m
completed: 2026-04-10
---

# Phase 01-02 Summary

**GoalCard generation, editing, and confirmation now run end-to-end inside the workspace shell on a single analysis run.**

## Performance

- **Duration:** 1h 00m
- **Started:** 2026-04-10T03:36:52+08:00
- **Completed:** 2026-04-10T04:08:30+08:00
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added a strict GoalCard schema plus a generation service backed by OpenAI Responses API and a local mock path.
- Added run creation and GoalCard update APIs that keep edits and confirmation on the same analysis run.
- Wired the home workspace so users can input text, generate a GoalCard, edit fields, and confirm it without leaving the page.

## Task Commits

Each task was committed with the smallest stable unit possible:

1. **Task 1: define GoalCard schema and generation service** - `d82fb76` (feat)
2. **Task 2: add run creation and GoalCard update flow** - `39598f7` (feat)
3. **Task 3: connect the GoalCard workflow to the workspace shell** - `39598f7` (feat, integrated with Task 2 because both changes shared the same run update surface)

## Files Created/Modified

- `src/features/goal-card/schema.ts` - Defines the strict GoalCard schema and coercion helper.
- `src/features/goal-card/generate-goal-card.ts` - Encapsulates mock and real GoalCard generation.
- `src/app/api/goal-card/generate/route.ts` - Route handler for GoalCard generation.
- `src/app/api/runs/route.ts` - Draft run creation and recent run listing.
- `src/app/api/runs/[runId]/route.ts` - GoalCard patch/update entry point.
- `src/components/workspace/goal-input-form.tsx` - Input form that creates a draft run and requests GoalCard generation.
- `src/components/workspace/goal-card-editor.tsx` - Editable GoalCard form with save and confirm actions.
- `src/components/workspace/run-shell.tsx` - Home workspace shell wired to the GoalCard flow.

## Decisions Made

- Used `MOCK_OPENAI=true` as the deterministic test mode so E2E and local development are not blocked by external AI availability.
- Kept GoalCard editing optimistic but server-owned: the client edits local form state, and the server remains the source of truth after save/confirm.
- Reused the same analysis run for generate and confirm so later phases can attach dimensions, candidates, evidence, and stage goals to one aggregate root.

## Deviations from Plan

### Auto-fixed Issues

**1. Integrated the confirmation route with the next phase's dimension hook early**
- **Found during:** Task 2 / Task 3 integration
- **Issue:** The shared `PATCH /api/runs/[runId]` route is the stable confirmation seam for both GoalCard save and later dimension injection.
- **Fix:** Landed the route in its final confirmation shape during this plan instead of revisiting the same API surface in a separate intermediate state.
- **Files modified:** `src/app/api/runs/[runId]/route.ts`
- **Verification:** Final lint, typecheck, unit tests, and E2E all passed.
- **Committed in:** `39598f7`

---

**Total deviations:** 1 auto-fixed
**Impact on plan:** No scope creep in user-facing behavior. The change reduced churn on a shared route.

## Issues Encountered

- Vitest could not spawn `esbuild` inside the sandbox; rerunning the same command outside the sandbox resolved it.
- Playwright initially failed because Chromium was not installed on the machine; installing `chromium` fixed the E2E environment.

## User Setup Required

Real AI generation needs local environment variables:

- `OPENAI_API_KEY`
- `OPENAI_GOAL_MODEL` (optional, defaults to `gpt-5.4-mini`)

For local deterministic testing, set `MOCK_OPENAI=true`.

## Next Phase Readiness

- The GoalCard lifecycle is stable and now exposes a clean confirmation seam for dimension injection.
- The workspace shell can carry the next phase's dimension summary and run reopen experience without additional restructuring.

---
*Phase: 01-foundation-goal-backbone*
*Completed: 2026-04-10*

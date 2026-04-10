---
phase: 06-stage-goals-gsd-handoff
plan: 01
subsystem: stage-goal-generation
tags: [stage-goals, gaps, repository, route]
requires:
  - phase: 04-03
    provides: persisted scoring and gap priorities
provides:
  - expanded StageGoal contract
  - stage-goal invalidation rules
  - gap-driven stage-goal builder
  - persisted stage-goals route
affects: [analysis-run, stage-goals, workspace]
tech-stack:
  added: []
  patterns: [pure-builder, persisted-derived-state, invalidation-on-upstream-change]
key-files:
  created:
    - src/features/stage-goals/build-stage-goals.ts
    - src/features/stage-goals/build-stage-goals.test.ts
    - src/app/api/runs/[runId]/stage-goals/route.ts
    - src/app/api/runs/[runId]/stage-goals/route.test.ts
  modified:
    - src/features/analysis-run/types.ts
    - src/features/analysis-run/run-mappers.ts
    - src/features/analysis-run/repository.ts
    - src/features/analysis-run/repository.test.ts
key-decisions:
  - "Stage goals stay fixed to validation, mvp, and differentiation."
  - "Stage goals are derived from persisted scoring gaps, not from a new model call."
  - "Any scoring or scoring-upstream change clears stale persisted stage goals."
requirements-completed: [STAG-01, STAG-02]
duration: single session
completed: 2026-04-10
---

# Phase 06-01 Summary

**This plan turned `run.stageGoals` from a placeholder into a real persisted artifact derived from gap priorities.**

## Accomplishments

- Expanded the `StageGoal` contract with `basedOnGaps` and `referenceProducts`.
- Added repository invalidation so stale `stageGoals` clear automatically when scoring or its upstream inputs change.
- Added `buildStageGoals()` as a deterministic 3-stage builder driven by persisted `run.scoring.gaps`.
- Added `POST /api/runs/[runId]/stage-goals` to generate and persist stage goals on demand.

## Decisions Made

- Kept stage generation fully rule-based and evidence-first.
- Reused persisted gaps instead of recalculating scoring during stage-goal generation.
- Preserved the existing run status model instead of adding new stage-goal-specific statuses.

## Next Plan Readiness

- Phase 06-02 can now treat `run.stageGoals` as stable persisted data for UI and handoff export.
- The workspace no longer needs to invent stage-goal structure client-side.

---
*Phase: 06-stage-goals-gsd-handoff*
*Completed: 2026-04-10*

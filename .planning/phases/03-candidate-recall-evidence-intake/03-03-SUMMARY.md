---
phase: 03-candidate-recall-evidence-intake
plan: 03
subsystem: workspace
tags: [workspace, candidates, evidence, ui, reopen, e2e]
requires:
  - phase: 03-01
    provides: persisted candidates route and ranking
  - phase: 03-02
    provides: persisted evidence route and schema
provides:
  - candidate recall panel in the workspace
  - evidence intake panel in the workspace
  - Stage Goals as the only remaining placeholder
  - end-to-end coverage from SearchPlan to reopened evidence
affects: [phase-4-scoring, reopen-flow, verification]
tech-stack:
  added: [Playwright E2E coverage]
  patterns: [single-page workspace, server-owned recall, persisted reopen path]
key-files:
  created:
    - src/components/workspace/candidates-panel.tsx
    - src/components/workspace/evidence-panel.tsx
    - tests/e2e/candidate-evidence-workflow.spec.ts
  modified:
    - src/components/workspace/run-shell.tsx
    - src/components/workspace/search-plan-panel.tsx
    - src/components/workspace/analysis-placeholders.tsx
key-decisions:
  - "Candidates and evidence are generated and rendered on the same run page instead of branching to separate detail pages."
  - "The deep-dive boundary is made visible in the UI through `recallRank` and the `Deep-dive set` badge."
  - "Stage Goals remain the only placeholder after Phase 3 so the product boundary stays honest."
requirements-completed: [SRCH-03, SRCH-04, EVID-01, EVID-02]
duration: single session
completed: 2026-04-10
---

# Phase 03-03 Summary

**Phase 3 closed the loop in the workspace: users can now generate candidates, inspect the deep-dive set, generate evidence, and reopen the same run without losing either layer.**

## Accomplishments

- Added a candidate panel with generate/regenerate actions, recall order, and deep-dive markers.
- Added an evidence panel with grouped rendering by candidate and dimension.
- Removed Candidates and Evidence from the placeholder grid, leaving only Stage Goals deferred.
- Added a new Playwright flow that covers candidate generation, evidence generation, and reopen of `/runs/[runId]`.

## Deviations from Plan

- SearchPlan display had to stay visible even after the run moved to `candidates_ready` or `evidence_ready`; otherwise reopen made the confirmed planning layer disappear. The panel gate was widened to keep the upstream context visible.

## Issues Encountered

- Browser-based verification required elevated execution outside the default sandbox, but the final E2E path ran cleanly once browser startup permissions were available.

## Next Phase Readiness

- Phase 4 can now score against persisted evidence instead of placeholders or speculative candidate summaries.

---
*Phase: 03-candidate-recall-evidence-intake*
*Completed: 2026-04-10*

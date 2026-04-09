---
phase: 04-explainable-scoring-gap-engine
plan: 02
subsystem: evidence-scoring
tags: [evidence, scoring, ids, invalidation, api]
requires:
  - phase: 04-01
    provides: persisted scoring contract and repository roundtrip
provides:
  - stable evidence IDs for every persisted evidence record
  - evidence assessment and scoring snapshot generation
  - POST scoring route with caching and force regenerate behavior
  - repository-side scoring invalidation on upstream changes
affects: [evidence-intake, scoring-route, workspace, reopen-flow]
tech-stack:
  added: [Structured Outputs evidence assessment, deterministic local aggregation]
  patterns: [stable-evidence-identity, evidence-first-scoring, repository-invalidation]
key-files:
  created:
    - src/features/evidence/assign-evidence-id.ts
    - src/features/evidence/assign-evidence-id.test.ts
    - src/features/scoring/evidence-assessment.ts
    - src/features/scoring/evidence-assessment.test.ts
    - src/features/scoring/build-scoring-snapshot.ts
    - src/features/scoring/build-scoring-snapshot.test.ts
    - src/app/api/runs/[runId]/scoring/route.ts
    - src/app/api/runs/[runId]/scoring/route.test.ts
  modified:
    - src/features/evidence/schema.ts
    - src/features/evidence/schema.test.ts
    - src/features/evidence/extract-evidence.ts
    - src/features/evidence/extract-evidence.test.ts
    - src/features/analysis-run/repository.ts
    - src/features/analysis-run/repository.test.ts
    - src/features/analysis-run/run-mappers.ts
key-decisions:
  - "Every evidence record now gets a stable ID before persistence, and scoring only references evidenceIds."
  - "Unknown stays a coverage state with score=null instead of being treated as a low score."
  - "Upstream edits clear stale run.scoring in the repository, not piecemeal across routes."
requirements-completed: [EVID-03, SCOR-01]
duration: single session
completed: 2026-04-10
---

# Phase 04-02 Summary

**The second plan turned persisted evidence into deterministic scoring snapshots, while keeping every score explainable back to evidence IDs.**

## Accomplishments

- Added stable `Evidence.id` generation and legacy-safe backfill during coercion and reopen.
- Added evidence assessment plus local scoring aggregation with `overallScore`, `coverage`, and `unknownCount`.
- Added `POST /api/runs/[runId]/scoring` with cache reuse and force-regenerate behavior.
- Added repository invalidation so changing goal, dimensions, search plan, candidates, or evidence automatically clears stale scoring.

## Decisions Made

- Used model-assisted single-evidence assessment, but kept final scoring aggregation deterministic and local.
- Preserved `unknown` by returning `score: null` and reflecting missing coverage instead of creating false precision.
- Reused the same scoring route for both fresh generation and cached reopen reads.

## Issues Encountered

- The existing run update flows sometimes passed unchanged downstream fields back into the repository, so invalidation had to compare actual before/after values instead of blindly clearing on key presence.

## Next Plan Readiness

- Phase 04-03 can now build benchmark-backed gaps and the UI explanation surface directly on the persisted scoring snapshot.

---
*Phase: 04-explainable-scoring-gap-engine*
*Completed: 2026-04-10*

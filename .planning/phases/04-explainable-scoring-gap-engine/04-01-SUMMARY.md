---
phase: 04-explainable-scoring-gap-engine
plan: 01
subsystem: scoring-persistence
tags: [scoring, contract, migration, jsonb, repository]
requires:
  - phase: 03-03
    provides: persisted candidates, evidence, reopen flow
provides:
  - explicit AnalysisRunScoring contract on the run aggregate
  - analysis_runs.scoring JSONB persistence column and migration
  - mapper/repository roundtrip for nested scorecards and gaps
affects: [repository, reopen-flow, scoring-route, phase-04]
tech-stack:
  added: [PostgreSQL JSONB scoring column]
  patterns: [aggregate-root-persistence, scoring-roundtrip, upstream-safe-contract]
key-files:
  created:
    - drizzle/0001_analysis_runs_scoring.sql
  modified:
    - src/db/schema.ts
    - src/features/analysis-run/types.ts
    - src/features/analysis-run/run-mappers.ts
    - src/features/analysis-run/repository.ts
    - src/features/analysis-run/repository.test.ts
key-decisions:
  - "Scoring stays inside the existing analysis run aggregate instead of introducing a separate scoring table."
  - "The shared contract already reserves candidate scorecards plus gaps so later plans do not have to re-shape persistence."
  - "Repository-level roundtrip is the source of truth for reopen, not client-side recomputation."
requirements-completed: [SCOR-01]
duration: single session
completed: 2026-04-10
---

# Phase 04-01 Summary

**Phase 4 first established scoring as a persisted part of the run aggregate, so later plans could build on a stable contract instead of rewriting storage.**

## Accomplishments

- Added `AnalysisRunScoring` and related scorecard / gap types to the shared aggregate contract.
- Added the `analysis_runs.scoring` JSONB column and a matching SQL migration.
- Extended run mappers and repository persistence so nested scoring payloads survive create/get/update roundtrip.
- Added repository tests that prove reopen keeps nested scorecards and gaps intact.

## Decisions Made

- Kept scoring on the existing `analysis run` aggregate to stay consistent with the Phase 1 data backbone.
- Left scoring nullable until evidence-backed scoring is generated, instead of inventing placeholder low scores.
- Centralized scoring persistence in repository roundtrip rather than introducing route-specific serialization.

## Issues Encountered

- Existing evidence fixtures did not carry stable IDs yet, so the shared contract and test fixtures had to be aligned early to avoid downstream type drift.

## Next Plan Readiness

- The repository now has a stable `run.scoring` container that Phase 04-02 can fill with evidence-backed scorecards and cache invalidation rules.

---
*Phase: 04-explainable-scoring-gap-engine*
*Completed: 2026-04-10*

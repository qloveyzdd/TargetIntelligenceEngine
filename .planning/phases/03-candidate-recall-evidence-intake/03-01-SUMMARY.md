---
phase: 03-candidate-recall-evidence-intake
plan: 01
subsystem: candidate-recall
tags: [candidates, web-search, normalization, ranking, api, invalidation]
requires:
  - phase: 02-02
    provides: confirmed SearchPlan, dual search modes, run aggregate lifecycle
provides:
  - candidate recall draft generation with mock and web search paths
  - domain-first candidate dedupe and merge rules
  - persisted candidate ranking with top-5 deep-dive semantics
  - upstream invalidation for stale candidates and evidence
affects: [workspace, evidence-intake, reopen-flow, verification]
tech-stack:
  added: [OpenAI Responses API web_search]
  patterns: [model-for-recall-local-for-ranking, aggregate invalidation, cache-unless-forced]
key-files:
  created:
    - src/features/candidate-recall/candidate-schema.ts
    - src/features/candidate-recall/candidate-schema.test.ts
    - src/features/candidate-recall/generate-candidate-drafts.ts
    - src/features/candidate-recall/generate-candidate-drafts.test.ts
    - src/features/candidate-recall/normalize-candidates.ts
    - src/features/candidate-recall/normalize-candidates.test.ts
    - src/features/candidate-recall/select-top-candidates.ts
    - src/features/candidate-recall/select-top-candidates.test.ts
    - src/app/api/runs/[runId]/candidates/route.ts
    - src/app/api/runs/[runId]/candidates/route.test.ts
  modified:
    - src/features/analysis-run/types.ts
    - src/features/analysis-run/run-mappers.ts
    - src/features/analysis-run/repository.test.ts
    - src/app/api/runs/[runId]/route.ts
    - src/app/api/runs/[runId]/route.test.ts
    - src/app/api/runs/[runId]/dimensions/route.ts
    - src/app/api/runs/[runId]/dimensions/route.test.ts
    - src/app/api/runs/[runId]/search-plan/route.ts
    - src/app/api/runs/[runId]/search-plan/route.test.ts
key-decisions:
  - "Candidate recall uses the model for finding candidates, but dedupe and ranking stay local and deterministic."
  - "Official site domain is the primary identity key; normalized name is only a fallback."
  - "Goal, dimensions, and SearchPlan edits now clear stale candidates and evidence instead of leaving downstream artifacts attached."
requirements-completed: [SRCH-03, SRCH-04]
duration: single session
completed: 2026-04-10
---

# Phase 03-01 Summary

**Phase 3 first turned confirmed SearchPlan items into persisted candidate objects, instead of leaving retrieval as a placeholder.**

## Accomplishments

- Added candidate recall draft generation with mock and real `web_search` paths.
- Added local normalization so duplicate products merge by official domain before ranking.
- Added deterministic ranking with `recallRank`, so the workspace and evidence intake share the same top-5 deep-dive set.
- Extended upstream routes so GoalCard, dimensions, and SearchPlan changes clear stale candidate and evidence payloads.

## Decisions Made

- Kept `matchedModes`, `matchedQueries`, `sources`, and `recallRank` on the run aggregate so reopen never needs to recompute ranking client-side.
- Treated `same_goal` as the strongest ranking signal, then used official-source readiness and dimension coverage as tie-breakers.
- Reused the existing run aggregate instead of introducing separate candidate tables in Phase 3.

## Issues Encountered

- The first implementation surfaced a type mismatch because `sourceHints` became a strict `SourceType[]`. The schema and generator were tightened so SearchPlan and candidate recall now share the same source vocabulary.

## Next Plan Readiness

- The run now carries a stable candidate set that Phase 03-02 can convert into evidence source tasks.

---
*Phase: 03-candidate-recall-evidence-intake*
*Completed: 2026-04-10*

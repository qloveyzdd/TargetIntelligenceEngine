---
phase: 03-candidate-recall-evidence-intake
plan: 02
subsystem: evidence-intake
tags: [evidence, fetch, playwright, structured-outputs, api, schema]
requires:
  - phase: 03-01
    provides: persisted top-5 candidate set and recall ranking
provides:
  - official-first evidence source task queue
  - fetch-first page loading with bounded Playwright fallback
  - structured evidence extraction with strict persistence schema
  - run-scoped evidence generation endpoint
affects: [workspace, scoring-phase, verification, reopen-flow]
tech-stack:
  added: [Structured Outputs, fetch-first loading, Playwright fallback]
  patterns: [top-5 bound, source-task granularity, mock-safe extraction]
key-files:
  created:
    - src/features/evidence/schema.ts
    - src/features/evidence/schema.test.ts
    - src/features/evidence/build-evidence-source-tasks.ts
    - src/features/evidence/build-evidence-source-tasks.test.ts
    - src/features/evidence/load-page-text.ts
    - src/features/evidence/load-page-text.test.ts
    - src/features/evidence/extract-evidence.ts
    - src/features/evidence/extract-evidence.test.ts
    - src/app/api/runs/[runId]/evidence/route.ts
    - src/app/api/runs/[runId]/evidence/route.test.ts
key-decisions:
  - "Evidence remains fine-grained at candidate + dimension + source URL, not candidate-level summaries."
  - "Fetch is the default loader; Playwright is only a bounded fallback for thin or client-rendered pages."
  - "Evidence generation is cached on the run unless regeneration is explicitly requested."
requirements-completed: [EVID-01, EVID-02, SRCH-04]
duration: single session
completed: 2026-04-10
---

# Phase 03-02 Summary

**Phase 3 then converted the top-5 candidate subset into real evidence records with source URLs, excerpts, extracted values, and confidence.**

## Accomplishments

- Added strict evidence coercion so incomplete extraction payloads cannot be persisted.
- Added official-first source queue construction limited to the top-5 ranked candidates.
- Added `loadPageText()` with mock mode, fetch-first behavior, and Playwright fallback for thin pages.
- Added `extractEvidence()` with stable mock output and real Structured Outputs support.
- Added `POST /api/runs/[runId]/evidence` to persist evidence and move the run to `evidence_ready`.

## Decisions Made

- Chose not to store raw page dumps in the aggregate; only structured evidence fields survive persistence.
- Kept the top-5 bound in the evidence task builder, not in the UI, so the backend owns the execution limit.
- Let evidence generation reuse persisted candidates instead of re-running retrieval inside the same route.

## Deviations from Plan

- The first page-loading test accidentally triggered real browser fallback because the mocked page text was too short. The test was corrected by making the mocked fetch response long enough to stay on the fetch-first path.

## Next Plan Readiness

- The workspace can now render persisted evidence without inventing data on the client.

---
*Phase: 03-candidate-recall-evidence-intake*
*Completed: 2026-04-10*

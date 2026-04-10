# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 - MVP

**Shipped:** 2026-04-10  
**Phases:** 6 | **Plans:** 17 | **Sessions:** 1

### What Was Built

- A single-run analysis workspace from GoalCard intake to structured GSD handoff.
- A full evidence chain covering dimensions, SearchPlan, candidates, evidence, scoring, visuals, and stage goals.
- Reopen-safe workflows across the entire v1.0 product surface.

### What Worked

- Keeping one stable run aggregate made every later phase easier to attach without redesigning storage.
- Building explanation and evidence contracts before visual polish kept later UI work straightforward.
- Focused E2E coverage per phase prevented regressions as the chain got longer.

### What Was Inefficient

- Some planning and state files needed manual cleanup after tool-generated status drift.
- Milestone archive generation still needed a manual polish pass after the CLI wrote the base files.

### Patterns Established

- Persist first, visualize second.
- Use deterministic builders for derived artifacts whenever the output must be explainable.
- Treat workspace reopen behavior as a first-class acceptance criterion, not a nice-to-have.

### Key Lessons

1. A long evidence chain stays manageable when every phase writes into one stable aggregate instead of inventing side channels.
2. `unknown` is a feature, not a failure, when the product promise depends on explainability.
3. Small focused E2E tests per phase scale better than one giant end-to-end script.

### Cost Observations

- Model mix: not tracked explicitly in this repository
- Sessions: 1 milestone cycle archived so far
- Notable: keeping architecture simple avoided a lot of rework across six phases completed in one milestone

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 6 | Established the full evidence-first product chain and reopen-safe execution style |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 100 automated checks at final verify pass | milestone-level full-flow coverage | 0 |

### Top Lessons (Verified Across Milestones)

1. More data is not better than better traceability.
2. Deterministic derived artifacts reduce downstream UI complexity.

---
phase: 05-visual-intelligence-surface
plan: 02
subsystem: relationship-graph
tags: [visuals, relationship-graph, dagre, react-flow]
requires:
  - phase: 04-03
    provides: persisted gaps and candidate scorecards
provides:
  - relationship graph contract
  - dagre-based graph builder
  - shared focus/highlight helper for node and edge clicks
affects: [visual-surface, relationship-graph, explanation-entry]
tech-stack:
  added: [echarts, @xyflow/react, @dagrejs/dagre]
  patterns: [graph-projection, stable-layout, shared-focus-state]
key-files:
  created:
    - src/features/visuals/relationship-graph-types.ts
    - src/features/visuals/build-relationship-graph.ts
    - src/features/visuals/build-relationship-graph.test.ts
    - src/features/visuals/build-graph-focus.ts
    - src/features/visuals/build-graph-focus.test.ts
  modified:
    - package.json
    - package-lock.json
key-decisions:
  - "The main graph is limited to Goal / Dimension / Candidate / Gap."
  - "Gap nodes come only from persisted known gaps."
  - "Focus state is computed from graph ids so radar and graph can share one explanation target."
requirements-completed: [VIZ-02]
duration: single session
completed: 2026-04-10
---

# Phase 05-02 Summary

**The second plan turned scoring results into a stable graph structure and gave the UI one shared focus model for clicks.**

## Accomplishments

- Added `echarts`, `@xyflow/react`, and `@dagrejs/dagre` as Phase 5 runtime dependencies.
- Added a relationship graph contract with stable node ids, edge ids, and click targets.
- Implemented a dagre-based builder that only renders `Goal / Dimension / Candidate / Gap`.
- Implemented a focus helper that turns node or edge selection into highlighted graph subsets.

## Decisions Made

- Kept Evidence out of the main graph and reserved it for the shared explanation panel.
- Reused persisted `run.scoring.gaps` instead of inventing synthetic gap nodes.
- Chose dagre for deterministic tree-like layout and low implementation cost.

## Next Plan Readiness

- Phase 05-03 can wire React Flow and the explanation panel against stable ids and click targets.

---
*Phase: 05-visual-intelligence-surface*
*Completed: 2026-04-10*

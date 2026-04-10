# Roadmap: Target Intelligence Engine

## Overview

This roadmap keeps the project evidence-first from bottom to top. We stabilized the run backbone, dimensions, recall, evidence, scoring, and visualization before moving into stage goals and GSD handoff.

## Phases

- [x] **Phase 1: Foundation & Goal Backbone** - Lock the core run aggregate and GoalCard flow (completed 2026-04-10)
- [x] **Phase 2: Dimension Engine & Search Planning** - Build the three-layer dimension engine and confirmable SearchPlan (completed 2026-04-10)
- [x] **Phase 3: Candidate Recall & Evidence Intake** - Recall candidates and store structured evidence (completed 2026-04-10)
- [x] **Phase 4: Explainable Scoring & Gap Engine** - Turn evidence into explainable scores and benchmark-backed gaps (completed 2026-04-10)
- [x] **Phase 5: Visual Intelligence Surface** - Add radar and relationship views with shared explanation (completed 2026-04-10)
- [x] **Phase 6: Stage Goals & GSD Handoff** - Generate stage goals and export structured handoff artifacts (completed 2026-04-10)

## Phase Details

### Phase 1: Foundation & Goal Backbone
**Goal**: Establish the project skeleton, five core objects, and the GoalCard intake chain  
**Depends on**: Nothing  
**Requirements**: GOAL-01, GOAL-02, GOAL-03, GOAL-04, DIME-01  
**Plans**: 3

Plans:
- [x] 01-01: Create the app skeleton and analysis run model
- [x] 01-02: Implement GoalCard generation and editing
- [x] 01-03: Inject the initial core dimensions and persist reopen-safe runs

### Phase 2: Dimension Engine & Search Planning
**Goal**: Turn goal input into stable dimensions and a confirmable SearchPlan  
**Depends on**: Phase 1  
**Requirements**: DIME-02, DIME-03, DIME-04, SRCH-01, SRCH-02  
**Plans**: 3

Plans:
- [x] 02-01: Implement dimension generation, merge, and normalization
- [x] 02-02: Implement SearchPlan schema, generation, and confirmation
- [x] 02-03: Wire dimensions and SearchPlan into the workspace with E2E coverage

### Phase 3: Candidate Recall & Evidence Intake
**Goal**: Recall candidate products and persist structured evidence  
**Depends on**: Phase 2  
**Requirements**: SRCH-03, SRCH-04, EVID-01, EVID-02  
**Plans**: 3

Plans:
- [x] 03-01: Implement candidate recall, normalization, and ranking
- [x] 03-02: Implement evidence source tasks, page loading, and extraction
- [x] 03-03: Wire Candidates / Evidence into the workspace with E2E coverage

### Phase 4: Explainable Scoring & Gap Engine
**Goal**: Produce dimension scores, overall scores, and gap priorities from evidence  
**Depends on**: Phase 3  
**Requirements**: EVID-03, SCOR-01, SCOR-02  
**Plans**: 3

Plans:
- [x] 04-01: Persist `run.scoring` and roundtrip it through the repository
- [x] 04-02: Generate evidence-backed scoring and scoring invalidation
- [x] 04-03: Add gap priority logic, explanation UI, and focused E2E coverage

### Phase 5: Visual Intelligence Surface
**Goal**: Turn scoring and gap outputs into a clickable visual surface inside the workspace  
**Depends on**: Phase 4  
**Requirements**: VIZ-01, VIZ-02  
**Plans**: 3

Plans:
- [x] 05-01: Implement radar projection and candidate selection logic
- [x] 05-02: Implement relationship graph structure, layout, and focus helpers
- [x] 05-03: Mount the visual surface, shared explanation panel, and focused E2E

### Phase 6: Stage Goals & GSD Handoff
**Goal**: Generate stage goals from gaps and export structured outputs for GSD  
**Depends on**: Phase 5  
**Requirements**: STAG-01, STAG-02, STAG-03  
**Plans**: 2

Plans:
- [x] 06-01: Implement Stage Goal generation and explanation logic
- [x] 06-02: Implement structured export and GSD handoff formatting

## Progress

**Execution Order:** 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Goal Backbone | 3/3 | Complete | 2026-04-10 |
| 2. Dimension Engine & Search Planning | 3/3 | Complete | 2026-04-10 |
| 3. Candidate Recall & Evidence Intake | 3/3 | Complete | 2026-04-10 |
| 4. Explainable Scoring & Gap Engine | 3/3 | Complete | 2026-04-10 |
| 5. Visual Intelligence Surface | 3/3 | Complete | 2026-04-10 |
| 6. Stage Goals & GSD Handoff | 2/2 | Complete | 2026-04-10 |

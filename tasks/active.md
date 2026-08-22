<!--
Purpose:        Track currently in-progress tasks
Owner:          Implementer / Planner
Update Trigger: Task started, completed, or blocked
Harness Version: 1.1
-->

# Active Tasks — Signal Hub

_Last updated: 2026-08-22_

## In Progress

### TASK-029: GitHub and CoinGecko CLI Integration
- **Owner**: Implementer
- **Priority**: High
- **Milestone**: M8
- **Description**: Add backward-compatible CLI commands for the existing GitHub and CoinGecko connectors.
- **Definition of Done**:
  - [ ] Existing CSV command remains compatible
  - [ ] GitHub and CoinGecko commands use the unchanged Core pipeline
  - [ ] Optional environment credentials are never exposed
  - [ ] Invalid input causes no database or network side effect
  - [ ] Build, tests, typecheck, audits, package inspection, and release check pass

## Task Detail Template

```
### TASK-XXX: [Title]
- **Owner**: [Agent Role]
- **Priority**: High | Medium | Low
- **Milestone**: M[N]
- **Description**: 
- **Definition of Done**:
  - [ ] [Condition 1]
  - [ ] [Condition 2]
```

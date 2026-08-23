<!--
Purpose:        Track currently in-progress tasks
Owner:          Implementer / Planner
Update Trigger: Task started, completed, or blocked
Harness Version: 1.1
-->

# Active Tasks — Signal Hub

_Last updated: 2026-08-23_

## In Progress

### TASK-033: CSV to Signal 0.5.0 Release

- **Owner**: Implementer / Release Manager
- **Priority**: High
- **Milestone**: M9 release follow-up
- **Description**: Release the merged GitHub and CoinGecko CLI integration as
  `csv-to-signal@0.5.0` while preserving CSV compatibility, JSON output, shared contracts, the
  SQLite schema, dependencies, and the four-file package allowlist.
- **Definition of Done**:
  - [x] The `0.5.0` candidate passes the complete release check on Node 22 and Node 24.19.0.
  - [x] GitHub and npm package READMEs accurately document all three commands and credentials.
  - [ ] A reviewed pull request is merged into `main`; no direct commit to `main` is used.
  - [ ] The exact merged artifact is produced once, retained, and verified on Node 22 and 24.
  - [ ] The project owner explicitly approves the exact artifact, `v0.5.0` tag, npm public
    registry, and `latest` dist-tag before any immutable action.
  - [ ] npm publication is verified for version, integrity, clean installation, execution, output,
    and database placement.
  - [ ] GitHub Release `v0.5.0` is created from the exact approved tag.

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

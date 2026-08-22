<!--
Purpose:        Track currently in-progress tasks
Owner:          Implementer / Planner
Update Trigger: Task started, completed, or blocked
Harness Version: 1.1
-->

# Active Tasks — Signal Hub

_Last updated: 2026-08-22_

## In Progress

### TASK-030: CSV to Signal 0.4.0 Release

- **Owner**: Implementer / Release Manager
- **Priority**: High
- **Milestone**: Release candidate follow-up to M8
- **Description**: Prepare and release the reviewed M8 runtime modernization as
  `csv-to-signal@0.4.0` without changing CLI behavior, flags, JSON output, shared contracts,
  SQLite schema, dependencies beyond TASK-029, or the four-file package allowlist.
- **Definition of Done**:
  - [x] The `0.4.0` candidate passes the complete release check on Node 22 and Node 24.19.0.
  - [x] An independent reviewer confirms the semantic version, immutable-action gate, package
    boundary, and absence of unrelated API, schema, or dependency changes.
  - [ ] A reviewed pull request is merged into `main`; no direct commit to `main` is used.
  - [ ] The exact merged artifact is reproduced, retained, and verified with its size and checksums.
  - [ ] The project owner explicitly approves the exact merged artifact, `v0.4.0` tag, npm registry
    `https://registry.npmjs.org/`, and `latest` dist-tag before any immutable action.
  - [ ] npm publication is verified for `csv-to-signal@0.4.0`, including registry metadata,
    integrity, clean installation, execution, output, and database placement.
  - [ ] GitHub Release `v0.4.0` is created from the exact tag and verified.

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

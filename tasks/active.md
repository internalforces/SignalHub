<!--
Purpose:        Track currently in-progress tasks
Owner:          Implementer / Planner
Update Trigger: Task started, completed, or blocked
Harness Version: 1.1
-->

# Active Tasks — Signal Hub

_Last updated: 2026-08-06_

## In Progress

| ID | Task | Owner | Started | Due |
|----|------|-------|---------|-----|
| TASK-023 | CLI 0.2.0 Release | Implementer | 2026-08-06 | After independent review, merge, and npm authentication |

### TASK-023: CLI 0.2.0 Release

- **Owner**: Implementer
- **Priority**: High
- **Milestone**: M5
- **Description**: Publish the verified Apache-2.0 `signal-hub@0.2.0` package from the exact
  independently reviewed and merged `main` commit.
- **Definition of Done**:
  - [x] Push the release-readiness branch and open PR #10.
  - [x] Pass Node 20/22/24 pull-request CI.
  - [ ] Obtain reviewer-agent sign-off and merge without self-merging.
  - [ ] Authenticate npm on the release machine without recording credentials.
  - [ ] Revalidate the merged commit and package-name availability.
  - [ ] Create and push `v0.2.0` from the exact released commit.
  - [ ] Publish `signal-hub@0.2.0` with public access and verify the registry artifact.
  - [ ] Record the released commit, tag, tarball integrity, and registry result.

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

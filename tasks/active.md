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
| TASK-023 | CSV to Signal 0.2.1 Release | Implementer | 2026-08-06 | After independent review, merge, exact-artifact approval, and registry acceptance |

### TASK-023: CSV to Signal 0.2.1 Release

- **Owner**: Implementer
- **Priority**: High
- **Milestone**: M5
- **Description**: Replace npm-rejected unscoped identity `signal-hub@0.2.0` with the approved
  public package and executable `csv-to-signal@0.2.1`, then publish only from an exact independently
  reviewed and merged commit after renewed artifact approval.
- **Definition of Done**:
  - [x] Push the release-readiness branch and open PR #10.
  - [x] Pass Node 20/22/24 pull-request CI.
  - [x] Obtain reviewer-agent sign-off, merge PR #10 without self-merging, and push `v0.2.0` at
    the exact rejected candidate commit.
  - [x] Authenticate npm with security-key 2FA without recording credentials.
  - [x] Record npm's similarity rejection and obtain owner approval for `csv-to-signal@0.2.1`.
  - [ ] Implement, verify, review, and merge the renamed candidate without moving `v0.2.0`.
  - [ ] Revalidate the exact merged commit and tarball, then obtain renewed publication approval.
  - [ ] Create and push `v0.2.1` from the exact released commit.
  - [ ] Publish `csv-to-signal@0.2.1` with public access and verify the registry artifact.
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

<!--
Purpose:        Track known bugs, technical debt, and temporary workarounds
Owner:          Debugger / Reviewer
Update Trigger: New bug found, issue resolved, new tech debt identified
Harness Version: 1.1
-->

# Known Issues — Signal Hub

_Last updated: 2026-08-03_

## Active Bugs

| ID | Severity | Description | Found | Owner | Target resolution |
|----|----------|-------------|-------|-------|-------------------|
| ISS-005 | Medium | Plan inconsistency: the architecture summary describes the CLI as depending only on Core, CSV, and types, but Task 10 explicitly constructs analysis and storage dependencies in the CLI. The constitution does not state that narrower CLI edge. | 2026-07-30 | Architect / Planner | Reconcile the plan and architecture in an ADR before requesting a Core API refactor. |
| ISS-006 | Medium | README quick-start command fails with `Command "signal-hub" not found` after a successful build. | 2026-07-30 | Implementer / Documenter | Document a working repository command and add a smoke test. |
| ISS-007 | Medium | CI lacks dependency vulnerability scanning even though `standards.md` requires it once CI exists. | 2026-08-03 | Maintainer / Security | Add a CI scan after human approval for the infrastructure-configuration change. |
| ISS-008 | Medium | `CsvConnector` filters blank lines before calculating error line numbers, so malformed rows after a blank line report the wrong physical source line. | 2026-08-03 | Implementer / Tester | Preserve source line indices and add a blank-line regression test. |

## Technical Debt

| ID | Description | Impact | Target Resolution |
|----|-------------|--------|--------------------|
| DEBT-001 | `CsvConnector` (Task 8 of the implementation plan) parses rows with a plain `split(",")` — no RFC 4180 quoting/escaping support, so values containing commas or quoted fields will misparse | Low for the MVP (canonical `metricId,timestamp,value` files); would break on hand-exported CSVs with embedded commas | Revisit if Phase 2+ needs richer CSV input, or if a user reports a real file that breaks it |
| DEBT-002 | No ESLint/Prettier configured; `standards.md` code style section is only partially specified (indentation is inferred, max line length and coverage threshold are TBD) | Style drift risk as more agents contribute | Add before M2 (GitHub connector) once more contributors are active |

## Resolved

| ID | Description | Resolved | Method |
|----|-------------|----------|--------|
| ISS-001 | Percentage-change detector emitted a decrease signal for unchanged adjacent values | 2026-07-29 | Explicitly suppress zero-percent changes; added regression test |
| ISS-002 | Random signal IDs made repeated analysis non-deterministic and allowed duplicate signal persistence | 2026-07-29 | Deterministic IDs derived from detector configuration and signal inputs; added persistence regression test |
| ISS-003 | CLI accepted malformed or unknown flags silently | 2026-07-29 | Validate supported flags, values, and missing arguments; added regression tests |
| ISS-004 | GitHub Actions could not resolve Node built-in module types during the CSV connector build | 2026-07-29 | Declared the Node 20 type definitions at the workspace root and refreshed the lockfile |
| — | — | — | — |

## Issue Template

```
### ISS-XXX: [Title]
- **Severity**: Critical | High | Medium | Low
- **Found**: YYYY-MM-DD
- **Reproduction steps**: 
- **Root cause**: 
- **Workaround**: 
- **Permanent fix direction**: 
```

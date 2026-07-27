<!--
Purpose:        Track known bugs, technical debt, and temporary workarounds
Owner:          Debugger / Reviewer
Update Trigger: New bug found, issue resolved, new tech debt identified
Harness Version: 1.1
-->

# Known Issues — Signal Hub

_Last updated: 2026-07-27_

## Active Bugs

| ID | Severity | Description | Found | Owner |
|----|----------|-------------|-------|-------|
| — | — | (none — no code has been written yet) | — | — |

## Technical Debt

| ID | Description | Impact | Target Resolution |
|----|-------------|--------|--------------------|
| DEBT-001 | `CsvConnector` (Task 8 of the implementation plan) parses rows with a plain `split(",")` — no RFC 4180 quoting/escaping support, so values containing commas or quoted fields will misparse | Low for the MVP (canonical `metricId,timestamp,value` files); would break on hand-exported CSVs with embedded commas | Revisit if Phase 2+ needs richer CSV input, or if a user reports a real file that breaks it |
| DEBT-002 | No ESLint/Prettier configured; `standards.md` code style section is only partially specified (indentation is inferred, max line length and coverage threshold are TBD) | Style drift risk as more agents contribute | Add before M2 (GitHub connector) once more contributors are active |

## Resolved

| ID | Description | Resolved | Method |
|----|-------------|----------|--------|
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

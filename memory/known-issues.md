<!--
Purpose:        Track known bugs, technical debt, and temporary workarounds
Owner:          Debugger / Reviewer
Update Trigger: New bug found, issue resolved, new tech debt identified
Harness Version: 1.1
-->

# Known Issues — Signal Hub

_Last updated: 2026-08-05_

## Active Bugs

| ID | Severity | Description | Found | Owner | Target resolution |
|----|----------|-------------|-------|-------|-------------------|
| — | — | — | — | — | — |

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
| ISS-005 | CLI dependency guidance conflicted with Task 10's composition dependencies | 2026-08-03 | Recorded ADR-007 and synchronized the architecture, project summary, and MVP plan without changing Core's API |
| ISS-006 | README quick-start command did not invoke the built repository CLI | 2026-08-03 | Documented the built CLI entry point and added an executable smoke test |
| ISS-007 | CI lacked dependency vulnerability scanning | 2026-08-03 | Added a production-dependency audit that fails on high or critical findings |
| ISS-008 | CSV errors after blank lines reported compressed, rather than physical, line numbers | 2026-08-03 | Preserved source-line indices and added a regression test |
| ISS-009 | Development-only Vitest 2.1.9 / Vite 5.4.21 dependencies had critical/high audit findings | 2026-08-04 | Upgraded all workspaces to Vitest 4.1.10 and explicit Vite 6.4.3, resolving esbuild 0.25.12; Node 20.19.5/22.22.3, frozen install, build, 67 tests, typecheck, and full/production audits pass with no known vulnerabilities |
| ISS-010 | A stale duplicate M3 roadmap revived deferred Polymarket, REST, YAML, and CLI work beside the approved focused roadmap | 2026-08-05 | Deleted the duplicate proposal; the approved CoinGecko-only roadmap remains the single M3 authority |
| ISS-011 | The root `>=20` engine range claimed Node 21.x/23.x support that Vitest 4.1.10 excludes | 2026-08-05 | Narrowed the advertised engine and supporting docs to `^20.0.0 || ^22.0.0 || >=24.0.0` |
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

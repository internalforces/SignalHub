<!--
Purpose:        Track known bugs, technical debt, and temporary workarounds
Owner:          Debugger / Reviewer
Update Trigger: New bug found, issue resolved, new tech debt identified
Harness Version: 1.1
-->

# Known Issues — Signal Hub

_Last updated: 2026-08-23_

## Active Bugs

No active bugs.

## Technical Debt

| ID | Description | Impact | Target Resolution |
|----|-------------|--------|--------------------|
| DEBT-001 | `CsvConnector` (Task 8 of the implementation plan) parses rows with a plain `split(",")` — no RFC 4180 quoting/escaping support, so values containing commas or quoted fields will misparse | Low for the MVP (canonical `metricId,timestamp,value` files); would break on hand-exported CSVs with embedded commas | Revisit if Phase 2+ needs richer CSV input, or if a user reports a real file that breaks it |
| DEBT-002 | No ESLint/Prettier configured; `standards.md` code style section is only partially specified (indentation is inferred, max line length and coverage threshold are TBD) | Style drift risk as more agents contribute | Add before M2 (GitHub connector) once more contributors are active |

### ISS-013: CLI release tarball is unsafe and cannot install independently

- **Status**: Resolved by TASK-022 on 2026-08-06.
- **Severity**: High release blocker before resolution; no remaining runtime impact.
- **Found**: 2026-08-06
- **Reproduction**:
  1. Run `npm pack --dry-run --json` in `apps/cli`; observe `data.db`, `.turbo`, source, tests,
     and configuration in the file list.
  2. Pack with npm and install the tarball in an empty project; npm rejects `workspace:*` with
     `EUNSUPPORTEDPROTOCOL`.
  3. Pack with pnpm and install the tarball; pnpm has rewritten dependencies to `0.1.0`, but npm
     returns `E404` for unpublished `@signal-hub/analysis` and the other private runtime packages.
- **Root cause**: The CLI was designed only as a private monorepo workspace. It has no package
  allowlist or standalone runtime build, and its concrete runtime graph points at private workspaces.
- **Historical workaround**: Run the CLI from a built repository checkout; keep the CLI private and
  do not distribute the unsafe tarball.
- **Resolution**: TASK-022 implemented the approved single-package bundle and independent
  install/execute validation.

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
| ISS-012 | The authoritative MVP plan still showed Vitest 2 package snippets without the explicit patched Vite peer | 2026-08-05 | Updated all eight package snippets to Vitest 4.1.10 and Vite 6.4.3; synchronized the root Node type dependency |
| ISS-013 | The CLI tarball contained local/development artifacts and could not install outside the workspace | 2026-08-06 | Bundled private workspace code, kept `better-sqlite3` external, added a four-file allowlist, and verified isolated npm installation/execution on Node 20/22/24 |
| ISS-017 | npm rejected unscoped `signal-hub` as too similar to existing `signalhub@4.9.0` | 2026-08-06 | Renamed the public package and executable to `csv-to-signal`, independently reviewed and merged the change, and successfully published `csv-to-signal@0.2.1` |
| ISS-018 | The immutable `csv-to-signal@0.2.1` npm tarball README said publication had not occurred | 2026-08-08 | Shipped the corrected README in the separately approved `csv-to-signal@0.3.0` release; the historical `0.2.1` artifact remains immutable |
| ISS-019 | Development-only PostCSS resolved nanoid 3.3.16, affected by GHSA-2v37-7h3g-55p8 | 2026-08-08 | Added a workspace resolution override to nanoid 3.3.17, refreshed the lockfile, and verified frozen install plus full/production audits with no known vulnerabilities |
| ISS-020 | GHSA-2v37-7h3g-55p8 expanded its vulnerable range to include development-only nanoid 3.3.17 | 2026-08-17 | Updated the workspace override and lockfile to nanoid 3.3.18; frozen install, 90 tests, typecheck, full/production audits, and the release check pass |
| ISS-021 | better-sqlite3 11.10.0 aborts in `RemoveEnvironmentCleanupHook` when the built CLI exits on Node 24.19.0 | 2026-08-17 | Pinned better-sqlite3 12.9.0 after owner approval; clean Node 24.19.0 tests and PR CI on Node 20/22/24 pass |
| ISS-022 | The public `>=24.0.0` engine range claimed Node 26+ support beyond better-sqlite3 12.9.0's declared Node 20–25 range | 2026-08-17 | Bounded root and CLI engines to `^20.0.0 || ^22.0.0 || ^24.0.0` and synchronized current support documentation |
| DEBT-004 | GitHub Actions v4 embedded the deprecated Node 20 action runtime | 2026-08-17 | Upgraded checkout/setup-node to v6 and added a weekly plus manually triggered full dependency audit after explicit infrastructure approval |
| DEBT-003 | `better-sqlite3@12.9.0` retained deprecated `prebuild-install@7.1.3` to preserve Node 20 support | 2026-08-22 | Removed EOL Node 20 from the contract and pinned N-API-based `better-sqlite3` 13.0.3, which has no `prebuild-install` dependency path |
| DEBT-005 | The public CLI advertised EOL Node 20, blocking adoption of the maintained N-API SQLite runtime | 2026-08-22 | TASK-029 narrowed engines and CI to Node 22/24 and passed the complete release check without changing product behavior or publishing |
| ISS-023 | Repeated GitHub CLI runs retained an earlier daily count when more commits appeared at the same metric/timestamp | 2026-08-23 | Added an explicit snapshot replacement path for external CLI sources while preserving default idempotent inserts |
| ISS-024 | CoinGecko `--days` requests analyzed older observations already present in the shared database | 2026-08-23 | Scoped CoinGecko detection to the validated points returned by the current fetch while continuing to persist observations |
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

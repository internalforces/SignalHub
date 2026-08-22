<!--
Purpose:        Current project state snapshot — the first context file every agent reads
Owner:          All agents (read), Planner / Release Manager (write)
Update Trigger: Version change, milestone completed, major status shift
Harness Version: 1.1
-->

# Project: Signal Hub

_Last updated: 2026-08-22_

## Summary

A minimal, deterministic time-series → signal transformation engine: `CSV → Core → Detector → Signal → CLI`.

## Current State

- **Published version**: `csv-to-signal@0.4.0` is published and npm `latest`
- **Release candidate**: None — TASK-031 does not change the package version or publish a release
- **Phase**: M9 TASK-031 external connector CLI implementation complete; 0.4.0 remains the latest published release
- **Next milestone**: Independently review and merge TASK-031, then separately approve any release
- **Overall health**: 🟢 Good — full and production dependency audits report no known vulnerabilities

## Tech Summary

| Field | Value |
|-------|-------|
| Language | TypeScript (strict, Node.js `^22.0.0 || ^24.0.0`) |
| Framework | None — plain Node.js CLI |
| Infrastructure | `csv-to-signal@0.4.0` published on npm; no service infrastructure deployed |
| Repo Structure | Monorepo (pnpm workspaces + Turborepo) |

## Key Paths

```
SignalHub/
├── docs/2026-07-27-signal-hub-mvp.md                      # M1 implementation plan
├── docs/2026-07-29-signal-hub-m2-plan.md                  # M2 GitHub connector plan
├── packages/{types,connector-sdk,storage,analysis,core}/ # shared pipeline packages
├── connectors/{csv,github,coingecko}/                      # local and external connectors
└── apps/cli/                                               # CSV, GitHub, and CoinGecko analysis CLI
```

## Recent Changes

| Date | Change |
|------|--------|
| 2026-07-27 | Signal Hub MVP implementation plan written (`docs/2026-07-27-signal-hub-mvp.md`) |
| 2026-07-27 | AI Development Harness v1.1 (Standard tier) initial setup |
| 2026-07-27 | Surveyed prior project `internalforces/Future-Signal` for reusable engine code; findings in `memory/reuse-candidates.md` |
| 2026-07-28 | Completed M1 implementation (TASK-001 through TASK-010): pnpm monorepo, contracts, SQLite storage, detectors, CSV connector, Core, and CLI |
| 2026-07-30 | Completed M2 implementation (TASK-011): GitHub commit connector with serial pagination, UTC daily aggregation, transient diagnostics, and a token-free public smoke test |
| 2026-08-03 | Completed post-merge maintenance: corrected CSV physical-line diagnostics, added a built-CLI smoke test and working quick start, synchronized CLI composition dependencies, and added production dependency auditing to CI |
| 2026-08-04 | Reduced M3 to TASK-017 and implemented the CoinGecko Demo market-chart connector with deterministic normalization, diagnostics, bounded failures, and 7 tests |
| 2026-08-04 | Completed TASK-018: upgraded to Vitest 4.1.10, Vite 6.4.3, and esbuild 0.25.12; frozen install, build, 67 tests, typecheck, and full/production audits pass; ISS-009 resolved |
| 2026-08-05 | Addressed PR #7 review: removed the stale duplicate M3 proposal and aligned the advertised Node engine range with Vitest 4.1.10 support |
| 2026-08-05 | Addressed PR #7 follow-up review: synchronized every MVP plan package snippet with Vitest 4.1.10 and explicit Vite 6.4.3 |
| 2026-08-05 | Merged focused M3 and security maintenance through PRs #6 and #7; documented a proposed M4 limited to TASK-014 windowed analysis |
| 2026-08-05 | Completed and merged approved M4 TASK-014 through PR #8: deterministic windowed analysis with 17 focused tests; 84 workspace tests pass |
| 2026-08-05 | Completed TASK-021 on its review branch: reconciled project records and added English and Korean user guidance, library usage, development guidance, and a verified CSV example |
| 2026-08-06 | Merged TASK-021 through PR #9; all approved M1-M4 work is now on `origin/main`, with no active task |
| 2026-08-06 | Planned M5 TASK-022 after a baseline `npm pack` assessment found version drift, incomplete metadata, an unsafe tarball file set, and non-installable workspace dependencies; no publication performed |
| 2026-08-06 | Completed TASK-022: Apache-2.0 `signal-hub@0.2.0` bundles private workspace code, packs four approved files, installs and runs independently on Node 20/22/24, and remains unpublished |
| 2026-08-06 | npm accepted security-key authentication but rejected unscoped `signal-hub` as too similar to `signalhub@4.9.0`; the owner selected public package and command `csv-to-signal` with candidate version `0.2.1`, preserving the pushed `v0.2.0` tag |
| 2026-08-06 | The renamed branch candidate passed the full release check: 87 tests, typecheck, both audits, four-file package inspection, isolated install, and `csv-to-signal` execution; the 8,517-byte artifact remains unpublished |
| 2026-08-06 | Merged PR #11 as `a3a0069`, pushed `v0.2.1`, published `csv-to-signal@0.2.1` with integrity `sha512-2yy8IYlFEohj3KxTJuG7JcHTrkU4yh5QTPClJQNXBazQ3QnFNj2YtwyaaDdi1F5IfNZiqzjt7oEVoWK3V+Ustg==`, and verified `latest`, clean registry installation, execution, output, and local database placement |
| 2026-08-07 | Published GitHub Release `v0.2.1` as the latest stable release; release notes record npm verification and defer ISS-018 to the next approved patch without an immediate documentation-only 0.2.2 |
| 2026-08-08 | Completed TASK-024 on its branch: additive `--window-hours`, `0.3.0` candidate metadata, 90 tests, typecheck, clear audits, four-file tarball inspection, isolated install, and installed windowed execution; no tag or publication |
| 2026-08-08 | Resolved newly reported nanoid GHSA-2v37-7h3g-55p8 in development tooling by pinning the allowed transitive patch 3.3.17; production and full audits report no known vulnerabilities |
| 2026-08-08 | Merged PR #14 as `59ec92e`, tagged it `v0.3.0`, published `csv-to-signal@0.3.0` with integrity `sha512-k1z2wk1Ub+9QE0yHLOv2iLBJCGLIhFnW7zTO1PcN4FNhTuvP0e0M5VSv7yA0CPZN3y7MGmy0nayMgR9JrExa6Q==`, verified the registry artifact and clean consumer execution, and published GitHub Release `v0.3.0` |
| 2026-08-17 | Completed approved post-release maintenance TASK-025 and TASK-026: patched development-only nanoid to 3.3.18, upgraded GitHub Actions to v6, added a weekly/manual full dependency audit, and passed the complete release check with 90 tests and clear audits |
| 2026-08-17 | Completed TASK-027 remediation for PR #16's Node 24.19.0 failure: pinned better-sqlite3 12.9.0; clean Node 24.19.0 built-CLI tests, the full release check, and PR CI on Node 20/22/24 pass |
| 2026-08-17 | Addressed PR #16 review as TASK-028 by bounding the advertised engine contract to tested Node 20/22/24 releases, matching better-sqlite3 12.9.0 instead of claiming unsupported Node 26+ compatibility; the full release check and PR matrix pass |
| 2026-08-22 | Completed approved M8 TASK-029 on its review branch: removed EOL Node 20 from the support contract and CI, migrated to N-API-based better-sqlite3 13.0.3, and passed 90 tests, typecheck, clear audits, four-file package inspection, isolated installation, and installed execution without publishing |
| 2026-08-22 | Locked the public `csv-to-signal@0.4.0` candidate identity and opened TASK-030 release preparation; `0.3.0` remains npm `latest`, and no `v0.4.0` tag, npm publication, dist-tag change, or GitHub Release is authorized before exact merged-artifact approval |
| 2026-08-22 | Completed Node 22/24 candidate verification and independent review; PR merge, exact retained-artifact approval, publication, registry verification, and GitHub Release remain pending |
| 2026-08-22 | Merged release PR #18 as `9b98ec9`, retained and verified one 8,902-byte tarball on Node 22/24, received explicit deployment approval, tagged the exact merge as `v0.4.0`, published `csv-to-signal@0.4.0` as npm `latest`, matched registry shasum/integrity, verified clean consumer execution and database placement, and published GitHub Release `v0.4.0` |
| 2026-08-22 | Completed M9 TASK-031: repository builds expose backward-compatible `github <owner>/<repo>` and `coingecko <coin-id>` commands with environment-only optional credentials, mocked-network coverage, and complete package verification; npm `csv-to-signal@0.4.0` remains `latest` and no publication occurred |

## Constraints

- Only `percentage-change` and `threshold` detectors ship in the MVP — no spike/anomaly/trend/change-point detection
- No YAML config loader (`config` package) without a separate focused plan and human approval
- Repository builds expose GitHub and CoinGecko ingestion through additive CLI commands; npm `csv-to-signal@0.4.0` remains the latest published release and predates TASK-031, so it does not include those commands
- Polymarket and generic REST connectors remain deferred
- Windowed change analysis is available from `@signal-hub/analysis` and the published CLI's `--window-hours`; Core defaults remain unchanged
- Package dependency direction is fixed: `connectors/* → connector-sdk, types`; `storage → types` only; `analysis → types` only; `core → types, storage, analysis, connector-sdk`; `apps/cli → core, connectors/csv, connectors/github, connectors/coingecko, analysis, storage, types` (CLI composes these dependencies but contains no pipeline logic)
- Timestamps must be normalized to ISO 8601 UTC by connectors before returning `DataPoint`s

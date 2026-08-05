<!--
Purpose:        Current project state snapshot — the first context file every agent reads
Owner:          All agents (read), Planner / Release Manager (write)
Update Trigger: Version change, milestone completed, major status shift
Harness Version: 1.1
-->

# Project: Signal Hub

_Last updated: 2026-08-05_

## Summary

A minimal, deterministic time-series → signal transformation engine: `CSV → Core → Detector → Signal → CLI`.

## Current State

- **Version**: v0.2.0-dev (M4 implemented locally; no release performed)
- **Phase**: M4 TASK-014 deterministic windowed analysis complete locally
- **Next milestone**: Review and merge the focused M4 changes
- **Overall health**: 🟢 Good — full and production dependency audits report no known vulnerabilities

## Tech Summary

| Field | Value |
|-------|-------|
| Language | TypeScript (strict, Node.js `^20.0.0 || ^22.0.0 || >=24.0.0`) |
| Framework | None — plain Node.js CLI |
| Infrastructure | None yet; npm publish planned, not executed |
| Repo Structure | Monorepo (pnpm workspaces + Turborepo) |

## Key Paths

```
SignalHub/
├── docs/2026-07-27-signal-hub-mvp.md                      # M1 implementation plan
├── docs/2026-07-29-signal-hub-m2-plan.md                  # M2 GitHub connector plan
├── packages/{types,connector-sdk,storage,analysis,core}/ # shared pipeline packages
├── connectors/{csv,github,coingecko}/                      # local and external connectors
└── apps/cli/                                               # CSV analysis CLI
```

## Recent Changes

| Date | Change |
|------|--------|
| 2026-07-27 | Signal Hub MVP implementation plan written (`docs/superpowers/plans/2026-07-27-signal-hub-mvp.md`) |
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
| 2026-08-05 | Completed approved M4 TASK-014: deterministic windowed analysis with 17 focused tests; 84 workspace tests pass |

## Constraints

- Only `percentage-change` and `threshold` detectors ship in the MVP — no spike/anomaly/trend/change-point detection
- No YAML config loader (`config` package) without a separate focused plan and human approval
- GitHub commit ingestion is available as a connector package; CLI integration remains deferred because it changes the public CLI surface
- CoinGecko ingestion is available as a library package; Polymarket, generic REST, and CoinGecko CLI integration remain deferred
- Windowed change analysis is available from `@signal-hub/analysis`; Core and CLI integration remain outside M4
- Package dependency direction is fixed: `connectors/* → connector-sdk, types`; `storage → types` only; `analysis → types` only; `core → types, storage, analysis, connector-sdk`; `apps/cli → core, connectors/csv, analysis, storage, types` (CLI composes these dependencies but contains no pipeline logic)
- Timestamps must be normalized to ISO 8601 UTC by connectors before returning `DataPoint`s

<!--
Purpose:        Current project state snapshot — the first context file every agent reads
Owner:          All agents (read), Planner / Release Manager (write)
Update Trigger: Version change, milestone completed, major status shift
Harness Version: 1.1
-->

# Project: Signal Hub

_Last updated: 2026-07-28_

## Summary

A minimal, deterministic time-series → signal transformation engine: `CSV → Core → Detector → Signal → CLI`.

## Current State

- **Version**: v0.1.0-dev (M1 MVP implemented locally)
- **Phase**: M1 MVP complete — CSV → Core → Detector → Signal → CLI is implemented and tested
- **Next milestone**: M2 — Beta (see `roadmap.md`)
- **Overall health**: 🟢 Good

## Tech Summary

| Field | Value |
|-------|-------|
| Language | TypeScript (strict, Node.js >=20) |
| Framework | None — plain Node.js CLI |
| Infrastructure | None yet; npm publish planned, not executed |
| Repo Structure | Monorepo (pnpm workspaces + Turborepo) |

## Key Paths

```
SignalHub/
├── docs/superpowers/plans/2026-07-27-signal-hub-mvp.md   # the implementation plan (source of truth for Tasks 1-10)
├── signal-hub-harness/                                   # this Harness
├── packages/{types,connector-sdk,storage,analysis,core}/ # not yet created — see Task 1-9
├── connectors/csv/                                        # not yet created — see Task 8
└── apps/cli/                                               # not yet created — see Task 10
```

## Recent Changes

| Date | Change |
|------|--------|
| 2026-07-27 | Signal Hub MVP implementation plan written (`docs/superpowers/plans/2026-07-27-signal-hub-mvp.md`) |
| 2026-07-27 | AI Development Harness v1.1 (Standard tier) initial setup |
| 2026-07-27 | Surveyed prior project `internalforces/Future-Signal` for reusable engine code; findings in `memory/reuse-candidates.md` |
| 2026-07-28 | Completed M1 implementation (TASK-001 through TASK-010): pnpm monorepo, contracts, SQLite storage, detectors, CSV connector, Core, and CLI |

## Constraints

- Only `percentage-change` and `threshold` detectors ship in the MVP — no spike/anomaly/trend/change-point detection
- No YAML config loader (`config` package) until a second data source exists
- Only the CSV connector ships in the MVP; GitHub/CoinGecko/Polymarket/REST connectors are deferred
- Package dependency direction is fixed: `connectors/* → connector-sdk, types`; `storage → types` only; `analysis → types` only; `core → types, storage, analysis, connector-sdk`; `apps/cli → core, connectors/csv, types`
- Timestamps must be normalized to ISO 8601 UTC by connectors before returning `DataPoint`s

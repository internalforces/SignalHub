<!--
Purpose:        Project milestones and feature planning
Owner:          Planner
Update Trigger: Milestone completed, new feature added, priorities changed
Harness Version: 1.1
-->

# roadmap.md — Signal Hub Roadmap

_Last updated: 2026-08-22_

## Goal

A minimal, deterministic time-series → signal transformation engine: `CSV → Core → Detector → Signal → CLI`.
Not a full analytics platform, not a distributed system, not an AI system.

## Milestones

### M1 — MVP (Phase 1 vertical slice)

Full task breakdown: [`docs/2026-07-27-signal-hub-mvp.md`](docs/2026-07-27-signal-hub-mvp.md)

- [x] Monorepo & tooling bootstrap (pnpm + Turborepo + tsconfig)
- [x] Shared types package (`DataPoint`, `Signal`, `Detector`, `Connector`)
- [x] Connector SDK validation utilities
- [x] SQLite storage layer (repository pattern)
- [x] Percentage change detector
- [x] Threshold detector
- [x] Signal scoring engine
- [x] CSV connector
- [x] Core pipeline engine + output formatter
- [x] CLI application (`csv-to-signal analyze <file>`; renamed before first successful npm publish)

### M2 — Beta

- [x] GitHub connector (real-world data validation, per design review Phase 2)

### M3 — CoinGecko Connector

- Approved focused plan: [`docs/2026-08-03-signal-hub-m3-v1-and-future-roadmap.md`](docs/2026-08-03-signal-hub-m3-v1-and-future-roadmap.md)
- [x] CoinGecko price-series connector package

The Polymarket connector, generic REST connector, and YAML configuration package remain deferred.
Each requires its own focused plan and human approval.

### M4 — Deterministic Windowed Analysis

- Merged scope: [`docs/2026-08-05-signal-hub-m4-windowed-analysis.md`](docs/2026-08-05-signal-hub-m4-windowed-analysis.md)
- [x] TASK-014: added one deterministic `WindowedChangeDetector` to `@signal-hub/analysis` and merged it through PR #8.

M4 does not include scheduling, checkpoints, caching, retries, rate-limit handling, CLI/Core
integration, or database changes.

### M5 — CLI Release Readiness

- Plan: [`docs/2026-08-06-signal-hub-release-readiness-plan.md`](docs/2026-08-06-signal-hub-release-readiness-plan.md)
- [x] TASK-022: produced a minimal, independently installable CLI tarball and completed all local
  release checks without publishing it.
- [x] TASK-023: renamed the npm-rejected candidate, merged independently reviewed PR #11, tagged
  `v0.2.1`, published `csv-to-signal@0.2.1`, and verified a clean registry install and execution.

The original `signal-hub@0.2.0` candidate was tagged but rejected by npm's package-name similarity
policy. The approved follow-up plan published `csv-to-signal@0.2.1` with the same Apache-2.0 bundle
and `better-sqlite3` external:

- [CSV to Signal 0.2.1 release identity plan](docs/2026-08-06-csv-to-signal-release.md)

### M6 — Windowed Analysis CLI Integration

- Completed plan: [`docs/2026-08-08-signal-hub-m6-windowed-cli.md`](docs/2026-08-08-signal-hub-m6-windowed-cli.md)
- [x] TASK-024: exposed the existing `WindowedChangeDetector` through additive
  `--window-hours <n>` composition and verified the `csv-to-signal@0.3.0` release artifact.
- [x] Published the exact reviewed M6 merge as `csv-to-signal@0.3.0`, verified the npm registry
  artifact and clean consumer execution, and published GitHub Release `v0.3.0`.

M6 does not integrate network connectors, change the signal or database schema, or add scheduling,
alerts, APIs, dashboards, or explanations.

### M7 — Security and CI Maintenance

- [x] TASK-025: raised the nanoid security override to patched version 3.3.18 after the advisory
  range expanded.
- [x] TASK-026: upgraded GitHub Actions to v6 and added a read-only Node 24 full dependency audit
  every Monday at 00:00 UTC with manual dispatch support.
- [x] TASK-027: pinned better-sqlite3 12.9.0 to restore Node 24.19.0 native compatibility while
  retaining Node 20 support.
- [x] TASK-028: bounded the advertised engine contract to the tested Node 20/22/24 matrix and the
  pinned native dependency's support range.

M7 changes no CLI behavior, flags, output, database schema, or published package version. It does
update runtime dependency and supported-engine metadata for compatibility.

### M8 — Runtime Modernization

- Plan: [`docs/2026-08-22-signal-hub-m8-runtime-modernization.md`](docs/2026-08-22-signal-hub-m8-runtime-modernization.md)
- [x] TASK-029: removed EOL Node 20 from the root, public CLI, and PR CI support contract.
- [x] Pinned `better-sqlite3` 13.0.3 and aligned the workspace with Node 22 type definitions and
  a Node 22 bundle target.
- [x] Passed the full release check with 90 tests, clear audits, the unchanged four-file tarball,
  and an isolated installed execution.

M8 changes runtime compatibility metadata and the existing native dependency only. It does not
change CLI behavior, flags, output, database schema, package version, publication, or deployment.

## Backlog Ideas

- Deterministic template-based explanations
- Scheduler for recurring ingestion (design review Phase 4)
- Minimal REST API (design review Phase 4)
- Template-based explanation engine, then LLM adapter (design review Phase 4/5)
- Alert system (design review Phase 4)

## Out of Scope

Explicitly flagged as overengineering risk in the design review (§1.1) — do not implement without a fresh Architect proposal and human sign-off:

- ML-like detectors: change point detection, advanced anomaly detection, trend classification
- Multi-provider LLM abstraction (MVP explanation, if ever added, is template-only)
- Dashboard, alert system, marketplace
- MCP server
- Distributed/multi-node scheduling

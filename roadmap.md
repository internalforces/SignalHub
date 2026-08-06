<!--
Purpose:        Project milestones and feature planning
Owner:          Planner
Update Trigger: Milestone completed, new feature added, priorities changed
Harness Version: 1.1
-->

# roadmap.md — Signal Hub Roadmap

_Last updated: 2026-08-06_

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

The original `signal-hub@0.2.0` candidate was tagged but rejected by npm's package-name similarity
policy. The approved follow-up plan prepares `csv-to-signal@0.2.1` with the same Apache-2.0 bundle
and `better-sqlite3` external. `npm publish` remains a separate human approval gate:

- [CSV to Signal 0.2.1 release identity plan](docs/2026-08-06-csv-to-signal-release.md)

### M6 — Consumption and Explanation (proposed)

- [ ] Proposed only: a minimal read-only local API, opt-in alerts, and deterministic template-based
  explanations. Each external side effect and public interface requires a separate approved plan.

## Backlog Ideas

- Scheduler for recurring ingestion (design review Phase 4)
- Minimal REST API (design review Phase 4)
- Template-based explanation engine, then LLM adapter (design review Phase 4/5)
- Alert system (design review Phase 4)
- npm publish of the `csv-to-signal` CLI package after M5 readiness checks (requires HUMAN APPROVAL
  when the exact release candidate is ready)

## Out of Scope

Explicitly flagged as overengineering risk in the design review (§1.1) — do not implement without a fresh Architect proposal and human sign-off:

- ML-like detectors: change point detection, advanced anomaly detection, trend classification
- Multi-provider LLM abstraction (MVP explanation, if ever added, is template-only)
- Dashboard, alert system, marketplace
- MCP server
- Distributed/multi-node scheduling

<!--
Purpose:        Project milestones and feature planning
Owner:          Planner
Update Trigger: Milestone completed, new feature added, priorities changed
Harness Version: 1.1
-->

# roadmap.md — Signal Hub Roadmap

_Last updated: 2026-08-04_

## Goal

A minimal, deterministic time-series → signal transformation engine: `CSV → Core → Detector → Signal → CLI`.
Not a full analytics platform, not a distributed system, not an AI system.

## Milestones

### M1 — MVP (Phase 1 vertical slice)

Full task breakdown: [`docs/superpowers/plans/2026-07-27-signal-hub-mvp.md`](../docs/superpowers/plans/2026-07-27-signal-hub-mvp.md)

- [x] Monorepo & tooling bootstrap (pnpm + Turborepo + tsconfig)
- [x] Shared types package (`DataPoint`, `Signal`, `Detector`, `Connector`)
- [x] Connector SDK validation utilities
- [x] SQLite storage layer (repository pattern)
- [x] Percentage change detector
- [x] Threshold detector
- [x] Signal scoring engine
- [x] CSV connector
- [x] Core pipeline engine + output formatter
- [x] CLI application (`signal-hub analyze <file>`)

### M2 — Beta

- [x] GitHub connector (real-world data validation, per design review Phase 2)

### M3 — CoinGecko Connector

- Approved focused plan: [`docs/2026-08-03-signal-hub-m3-v1-and-future-roadmap.md`](docs/2026-08-03-signal-hub-m3-v1-and-future-roadmap.md)
- [x] CoinGecko price-series connector package

The Polymarket connector, generic REST connector, and YAML configuration package remain deferred.
Each requires its own focused plan and human approval.

### M4 — Local Operations and Reliability (proposed)

- [ ] Proposed only: checkpoints/caching, a single-process scheduler, retry and rate-limit policy,
  and time-aware analysis. A schema and architecture proposal is required before implementation.

### M5 — Consumption and Explanation (proposed)

- [ ] Proposed only: a minimal read-only local API, opt-in alerts, and deterministic template-based
  explanations. Each external side effect and public interface requires a separate approved plan.

## Backlog Ideas

- GitHub Actions CI (build + test on PR) — see `tech-stack.md`
- Scheduler for recurring ingestion (design review Phase 4)
- Minimal REST API (design review Phase 4)
- Template-based explanation engine, then LLM adapter (design review Phase 4/5)
- Alert system (design review Phase 4)
- npm publish of the `signal-hub` CLI package (requires HUMAN APPROVAL when the time comes)

## Out of Scope

Explicitly flagged as overengineering risk in the design review (§1.1) — do not implement without a fresh Architect proposal and human sign-off:

- ML-like detectors: change point detection, advanced anomaly detection, trend classification
- Multi-provider LLM abstraction (MVP explanation, if ever added, is template-only)
- Dashboard, alert system, marketplace
- MCP server
- Distributed/multi-node scheduling

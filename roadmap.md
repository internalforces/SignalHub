<!--
Purpose:        Project milestones and feature planning
Owner:          Planner
Update Trigger: Milestone completed, new feature added, priorities changed
Harness Version: 1.1
-->

# roadmap.md — Signal Hub Roadmap

_Last updated: 2026-07-27_

## Goal

A minimal, deterministic time-series → signal transformation engine: `CSV → Core → Detector → Signal → CLI`.
Not a full analytics platform, not a distributed system, not an AI system.

## Milestones

### M1 — MVP (Phase 1 vertical slice)

Full task breakdown: [`docs/superpowers/plans/2026-07-27-signal-hub-mvp.md`](../docs/superpowers/plans/2026-07-27-signal-hub-mvp.md)

- [ ] Monorepo & tooling bootstrap (pnpm + Turborepo + tsconfig)
- [ ] Shared types package (`DataPoint`, `Signal`, `Detector`, `Connector`)
- [ ] Connector SDK validation utilities
- [ ] SQLite storage layer (repository pattern)
- [ ] Percentage change detector
- [ ] Threshold detector
- [ ] Signal scoring engine
- [ ] CSV connector
- [ ] Core pipeline engine + output formatter
- [ ] CLI application (`signal-hub analyze <file>`)

### M2 — Beta

- [ ] GitHub connector (real-world data validation, per design review Phase 2)

### M3 — v1.0

- [ ] CoinGecko connector (design review Phase 3)
- [ ] Polymarket connector (design review Phase 3)
- [ ] Generic REST connector with dynamic field mapping (design review Phase 3)
- [ ] `config` package: YAML config loader + env interpolation (deferred from MVP per design review §1.1(5))

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

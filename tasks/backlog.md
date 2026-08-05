<!--
Purpose:        Prioritized list of tasks not yet started
Owner:          Planner
Update Trigger: New task added, priority changed, milestone adjusted
Harness Version: 1.1
-->

# Backlog — Signal Hub

_Last updated: 2026-08-04_

> Full detail (files, code, TDD steps, exact commands) for every task below lives in
> [`docs/superpowers/plans/2026-07-27-signal-hub-mvp.md`](../../docs/superpowers/plans/2026-07-27-signal-hub-mvp.md).
> This table is an index, not a replacement — read the plan before starting a task.

| ID | Task | Priority | Milestone | Size | Notes |
|----|------|----------|-----------|------|-------|
| TASK-001 | Monorepo & Tooling Bootstrap | High | M1 | S | Blocks every other task — nothing else can start until this lands |
| TASK-002 | Shared Types Package (`@signal-hub/types`) | High | M1 | S | Depends on TASK-001 |
| TASK-003 | Connector SDK — Validation Utilities | High | M1 | S | Depends on TASK-002 |
| TASK-004 | SQLite Storage Layer (`@signal-hub/storage`) | High | M1 | M | Depends on TASK-002 |
| TASK-005 | Percentage Change Detector | High | M1 | M | Depends on TASK-002 |
| TASK-006 | Threshold Detector | High | M1 | M | Depends on TASK-002; can run in parallel with TASK-005 |
| TASK-007 | Signal Scoring Engine | High | M1 | S | Depends on TASK-005, TASK-006 (finalizes `@signal-hub/analysis`'s public surface) |
| TASK-008 | CSV Connector | High | M1 | M | Depends on TASK-003 |
| TASK-009 | Core Pipeline Engine + Output Formatter | High | M1 | L | Depends on TASK-003, TASK-004, TASK-007 |
| TASK-010 | CLI Application (End-to-End) | High | M1 | M | Depends on TASK-007, TASK-008, TASK-009 — last task in M1 |
| TASK-012 | GitHub Actions CI (`pnpm install && pnpm build && pnpm test` per PR) | Medium | M1/M2 | S | Not yet planned in detail |
| TASK-013 | Polymarket Connector | Low | M3 | L | Not yet planned — port the Gamma API client from `internalforces/Future-Signal`'s `backend/app/core/collector.py`; see `memory/reuse-candidates.md` #6 |
| TASK-014 | Windowed change detector (24h/7d style, not just consecutive-point) | Low | M2/M3 | M | Not yet planned — port `compute_change_for_window` from Future-Signal; see `memory/reuse-candidates.md` #2 |
| TASK-017 | CoinGecko Connector (`@signal-hub/connector-coingecko`) | High | M3 | M | **Assigned: Implementer. Completed 2026-08-04.** Scope and DoD: `docs/2026-08-03-signal-hub-m3-v1-and-future-roadmap.md` |
| TASK-018 | Upgrade Vitest/Vite and resolve ISS-009 | High | Security maintenance | S | **Completed 2026-08-04.** Vitest 4.1.10, Vite 6.4.3, and esbuild 0.25.12 verified; ISS-009 resolved |

## Size Reference

| Size | Estimated Effort |
|------|-----------------|
| XS | Under 1 hour |
| S | 1–4 hours |
| M | Half day to full day |
| L | 1–3 days |
| XL | 3+ days → must be decomposed |

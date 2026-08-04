<!--
Purpose:        Current session state — context handoff between agents
Owner:          Currently active agent
Update Trigger: Read at session start; must update before session ends
Harness Version: 1.1
-->

# Current Session — Signal Hub

> After this session, copy this file to `memory/sessions/2026-07-27-planner.md`.

---

## Session Info

- **Date**: 2026-08-04
- **Agent Role**: Reviewer / Documenter
- **Session Goal**: Address all actionable review feedback on PR #6.

## Previous Session Summary

(First session — no prior session)

## Current Work

- [x] M2 GitHub connector plan prepared at `docs/2026-07-29-signal-hub-m2-plan.md`.
- [x] TASK-012 — GitHub Actions CI is complete on `codex/task-012-ci`.
- [x] Fixed the PR CI build failure by declaring `@types/node` for the workspace and refreshing the lockfile.
- [x] TASK-011 — GitHub connector is complete on `codex/m2-github-connector`.
- [x] Merged `main` into PR #4 and resolved the session-record conflict while retaining the M2 handoff.
- [x] Updated the M1 review to classify ISS-005 as a plan inconsistency and recorded ISS-007 and ISS-008 from the review feedback.
- [x] Resolved ISS-005 through ISS-008 on `codex/fix-post-merge-followups`.

## Completed This Session

- [x] Addressed three further PR #6 findings: M3 now has physical CSV storage isolation, display metric IDs may overlap safely, and the public Signal-ID example uses the actual serialized tuple encoding.
- [x] Addressed the three follow-up PR #6 findings: revised historical values now fail source-atomically, redirects are same-origin only, and projected signal IDs retain detector configuration.
- [x] Reviewed the remaining eight unresolved PR #6 findings and revised the M3 proposal: persistent source namespaces, public output projection, source-atomic persistence, exhaustive failed JSON outcomes, CoinGecko pre-approval, duplicate-timestamp policy, exact bucket boundary, and per-hop REST redirect validation. No M3 implementation was authorized or started.
- [x] Resolved all eight PR #6 design-review findings: unique source metric IDs, header-only full-value interpolation, closed time buckets, exact grouped JSON for complete/partial/configuration/selection outcomes, and a separately approved Polymarket-contract task.
- [x] Documented the proposed M3 v1.0 design, approval gates, task breakdown, and M4/M5 rough roadmap in `docs/2026-08-03-signal-hub-m3-v1-and-future-roadmap.md`; no deferred implementation was authorized or started.
- [x] Reviewed the pasted design draft, confirmed the MVP scope decisions it already made (design review §1)
- [x] Wrote the full implementation plan: `docs/superpowers/plans/2026-07-27-signal-hub-mvp.md` (10 tasks, TDD steps, exact code)
- [x] AI Development Harness v1.1 (Standard tier) initial setup, seeded from the plan's content (not placeholders)
- [x] Cloned and surveyed prior project `internalforces/Future-Signal` (read-only, scratchpad); documented 6 reuse candidates in `memory/reuse-candidates.md`, mapped to Signal Hub packages/milestones
- [x] Completed TASK-001: configured the pnpm/Turborepo workspace; dependency installation, lockfile validation, root build, test, and typecheck all passed.
- [x] Completed TASK-002: added `@signal-hub/types` with the canonical `DataPoint`, `Signal`, `Detector`, and `Connector` contracts; 4 tests, build, and typecheck passed.
- [x] Completed TASK-003: added `@signal-hub/connector-sdk` with `isValidDataPoint` and the connector contract re-exports; 4 tests, build, and typecheck passed.
- [x] Completed TASK-004: added `@signal-hub/storage` with SQLite-backed data-point and signal repositories; 4 tests, build, and typecheck passed.
- [x] Completed TASK-005: added the stateless percentage-change detector; 5 tests, build, and typecheck passed.
- [x] Completed TASK-006: added the stateless threshold-crossing detector; 5 tests, build, and typecheck passed.
- [x] Completed TASK-007: added immutable signal scoring and finalized the analysis package exports; 16 analysis tests, build, and typecheck passed.
- [x] Completed TASK-008: added the strict CSV connector with ISO timestamp normalization; 6 tests, build, and typecheck passed.
- [x] Completed TASK-009: added the Core orchestration pipeline and JSON formatter; 6 tests, build, and typecheck passed.
- [x] Completed TASK-010: added the CLI entry point and end-to-end coverage for CSV analysis, score filtering, threshold detection, and usage errors; 5 tests, build, and typecheck passed.
- [x] Completed TASK-015: made signal IDs deterministic, suppressed zero-change pseudo-signals, and rejected malformed CLI flags; full build, test, and typecheck passed.
- [x] Completed TASK-012: added the Node 20 GitHub Actions PR workflow with frozen install, build, test, and typecheck; workflow YAML and all local checks passed.
- [x] Fixed ISS-004: CI's clean installation lacked declared Node built-in module types; added `@types/node` ^20.19.43, then passed frozen install, build, test, and typecheck.
- [x] Completed TASK-011: added `@signal-hub/connector-github` with public/private requests, serial `Link` pagination, UTC-day aggregation in ascending order, transient malformed-record diagnostics, and request-level errors.
- [x] Ran the token-free public smoke test against `octocat/Hello-World`: 3 daily points and zero diagnostics.
- [x] Completed TASK-016: preserve CSV physical source-line numbers through blank lines, including a regression test.
- [x] Completed TASK-016: document `node apps/cli/dist/index.js analyze data.csv` as the repository quick start and test the built executable.
- [x] Completed TASK-016: adopted ADR-007, synchronizing CLI composition dependencies across project documents without a Core API change.
- [x] Completed TASK-016: add `pnpm audit --prod --audit-level=high` to pull-request CI; local production audit passes.

## Issues Found / Decisions Made

- See `memory/decisions.md` ADR-002 (MVP scope), ADR-003 (monorepo tooling), and ADR-004 (Future-Signal reuse survey) — recorded here.
- See `memory/known-issues.md` DEBT-001 and DEBT-002 for two known limitations baked into the plan (CSV parser has no RFC 4180 support; no linter configured yet).
- See `memory/known-issues.md` ISS-004 for the resolved CI type-resolution failure.
- Recorded ADR-006 for M2's aggregation and diagnostics choices.
- Recorded ADR-007 for CLI composition dependencies.
- Full dependency audit reported critical/high development-only Vitest/Vite vulnerabilities; tracked as ISS-009 because dependency upgrades remain out of this task's approved scope.

## Next Session: To-Do

1. Obtain approval to upgrade the vulnerable Vitest/Vite development dependencies and resolve ISS-009.
2. Plan M3 only after a dedicated design proposal and explicit approval for each deferred connector or configuration feature.

## Important Context

- The implementation plan (`docs/2026-07-27-signal-hub-mvp.md`) is the single source of truth for exact file paths, code, and test commands for Tasks 1-10 — this Harness's `memory/` and `tasks/` files summarize and index it, they don't replace it. Some older Harness references retain the former `docs/superpowers/plans/` path.
- The user's original design draft (pasted in chat, not saved as a separate file) already did most of the MVP-vs-DEFER scoping decisions; `memory/architecture.md`'s DEFER list and `roadmap.md`'s "Out of Scope" section are both taken directly from it.
- `internalforces/Future-Signal` is the user's own prior project (same domain: signal detection over time-series-like data, different stack: Python/FastAPI/PostgreSQL). It was cloned read-only into the session scratchpad for inspection, not added to this repo. `memory/reuse-candidates.md` is the index of what's worth porting and when — nothing from it has been ported yet.

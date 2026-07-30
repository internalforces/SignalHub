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

- **Date**: 2026-07-30
- **Agent Role**: Reviewer
- **Session Goal**: Review the merged M1 MVP and CI for correctness, standards compliance, and project-constitution compliance.

## Previous Session Summary

(First session — no prior session)

## Current Work

- [x] Reviewed the M1 MVP and CI at `e72c26e`.
- [x] Recorded the Request Changes verdict in `reports/review-2026-07-30-m1-mvp.md`.
- [x] Verified frozen install, build, all 50 tests, and typecheck.
- [x] Recorded ISS-005 (CLI package-boundary violation) and ISS-006 (broken README quick start).

## Completed This Session

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

## Issues Found / Decisions Made

- See `memory/decisions.md` ADR-002 (MVP scope), ADR-003 (monorepo tooling), and ADR-004 (Future-Signal reuse survey) — recorded here.
- See `memory/known-issues.md` DEBT-001 and DEBT-002 for two known limitations baked into the plan (CSV parser has no RFC 4180 support; no linter configured yet).
- See `memory/known-issues.md` ISS-004 for the resolved CI type-resolution failure.
- See `memory/known-issues.md` ISS-005 for the CLI's direct dependencies on `analysis` and `storage`, contrary to the constitution's fixed dependency direction.
- See `memory/known-issues.md` ISS-006 for the README quick-start command that cannot find the CLI binary.

## Next Session: To-Do

1. Prepare a Core-owned composition API and obtain human approval before changing the public API to resolve ISS-005.
2. Correct and smoke-test the README quick-start command to resolve ISS-006.
3. Re-review both fixes before proceeding with M2.

## Important Context

- The implementation plan (`docs/2026-07-27-signal-hub-mvp.md`) is the single source of truth for exact file paths, code, and test commands for Tasks 1-10 — this Harness's `memory/` and `tasks/` files summarize and index it, they don't replace it. Some older Harness references retain the former `docs/superpowers/plans/` path.
- The user's original design draft (pasted in chat, not saved as a separate file) already did most of the MVP-vs-DEFER scoping decisions; `memory/architecture.md`'s DEFER list and `roadmap.md`'s "Out of Scope" section are both taken directly from it.
- `internalforces/Future-Signal` is the user's own prior project (same domain: signal detection over time-series-like data, different stack: Python/FastAPI/PostgreSQL). It was cloned read-only into the session scratchpad for inspection, not added to this repo. `memory/reuse-candidates.md` is the index of what's worth porting and when — nothing from it has been ported yet.

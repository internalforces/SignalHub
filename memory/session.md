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

- **Date**: 2026-08-05
- **Agent Role**: Planner / Implementer
- **Session Goal**: Address PR #7 review findings, validate the workspace, and publish the fixes.

## Previous Session Summary

(First session — no prior session)

## Current Work

- [x] TASK-020 — PR #7 follow-up plan-snippet finding is addressed locally.
- [x] TASK-019 — PR #7 review findings are addressed locally.
- [x] TASK-018 — Vitest/Vite security upgrade is complete; ISS-009 is resolved.
- [x] TASK-017 — focused CoinGecko connector is complete locally on `codex/m3-design-roadmap`.
- [x] M2 GitHub connector plan prepared at `docs/2026-07-29-signal-hub-m2-plan.md`.
- [x] TASK-012 — GitHub Actions CI is complete on `codex/task-012-ci`.
- [x] Fixed the PR CI build failure by declaring `@types/node` for the workspace and refreshing the lockfile.
- [x] TASK-011 — GitHub connector is complete on `codex/m2-github-connector`.
- [x] Merged `main` into PR #4 and resolved the session-record conflict while retaining the M2 handoff.
- [x] Updated the M1 review to classify ISS-005 as a plan inconsistency and recorded ISS-007 and ISS-008 from the review feedback.
- [x] Resolved ISS-005 through ISS-008 on `codex/fix-post-merge-followups`.

## Completed This Session

- [x] Updated all eight MVP plan package snippets from Vitest ^2.0.5 to Vitest ^4.1.10 with explicit Vite 6.4.3; the root snippet also includes the required Node type definitions.
- [x] Validated all 17 JSON snippets, frozen installation, 9 package builds, 67 tests, and 9 package typechecks after the follow-up review fix.
- [x] Removed the stale duplicate 327-line M3 proposal; the approved focused CoinGecko roadmap remains authoritative.
- [x] Narrowed the advertised Node engine to `^20.0.0 || ^22.0.0 || >=24.0.0`, matching Vitest 4.1.10 support, and synchronized project documentation.
- [x] Revalidated on Node 22.22.3: frozen install, all 9 package builds, all 67 tests, all 9 package typechecks, and full/production dependency audits pass.
- [x] Upgraded all ten workspace manifests from Vitest ^2.0.5 to ^4.1.10 and declared Vite 6.4.3 explicitly while retaining Node 20 support.
- [x] Refreshed the lockfile to Vitest 4.1.10, Vite 6.4.3, and esbuild 0.25.12 without changing production dependencies or public interfaces.
- [x] Passed Node 20.19.5 and Node 22.22.3 validation, frozen install, all 9 package builds, all 67 tests, all 9 package typechecks, and both full and production dependency audits with no known vulnerabilities.
- [x] Moved TASK-018 to `tasks/completed.md`, moved ISS-009 to Resolved, and synchronized project, dependency, decision, backlog, and session status.
- [x] Recorded the project owner's approval for TASK-018 to upgrade Vitest/Vite and resolve ISS-009.
- [x] Defined the patched-version floor and completion gates: Vitest >=3.2.6, Vite >=6.4.3, esbuild >=0.25.0, frozen install, build, tests, typecheck, and a clean high/critical audit for the affected stack.
- [x] Synchronized `memory/project.md`, `tasks/active.md`, `tasks/backlog.md`, `memory/known-issues.md`, `memory/decisions.md`, and `dependencies.md`; no dependency files were changed in this documentation-only step.
- [x] Recorded the project owner's approval to reduce M3 to the CoinGecko connector only.
- [x] Reduced the M3 plan from 327 lines to 68 lines and deferred YAML, CLI, Core/Storage, Polymarket, and generic REST work.
- [x] Assigned TASK-017 to Implementer in `tasks/backlog.md` and tracked it through completion.
- [x] Implemented `@signal-hub/connector-coingecko` with Demo market-chart requests, UTC normalization, deterministic duplicate handling, immutable diagnostics, redacted errors, a 15-second timeout, and a 5 MiB response limit.
- [x] Added 7 focused tests; root build, all 56 tests, and typecheck pass.
- [x] Addressed three new PR #6 findings and proactively closed related gaps: removed secret-derived identity hashes in favor of a required nonsecret REST dataset identity, made public signal IDs configuration-identity-scoped, failed non-finite detector output atomically, assigned identity derivation consistently to config, prohibited ambiguous REST URL components, and clarified late-backfill comparison for fetched points inside the active window. No M3 implementation was started.
- [x] Addressed the latest three PR #6 review findings: froze one run-wide analysis timestamp, removed the obsolete horizon-increase failure, and approved an exact synchronous outer Storage transaction API for source-atomic Core execution. No M3 implementation was started.
- [x] Addressed the latest PR #6 design-review findings: canonical provider-identity namespaces, bounded `historyDays` analysis reads, atomic late-backfill rejection, duplicate YAML-key rejection, deliberately non-paginated bounded REST ingestion, and explicit-offset RFC 3339 REST timestamps. No M3 implementation was started.
- [x] Addressed the final eight PR #6 design-review findings: predecessor-only threshold context, explicit dataset identity, retained display-metric namespaces, horizon-scoped persistence, finite REST numeric values, nonempty sources, 15-second per-hop deadlines, and 1 MiB/no-alias YAML limits. No M3 implementation was started.
- [x] Addressed seven additional PR #6 design-review findings: approved-only Core range API, horizon-scoped namespaces without new schema state, strict configuration keys and header names, finite aggregation diagnostics, capped history horizons, and a current M3 approval handoff. No M3 implementation was started.
- [x] Proactively hardened PR #6's M3 proposal against two likely follow-up findings: public signal IDs now include the unique source namespace when display metric IDs overlap, and each provider contract must define post-normalization duplicate-timestamp handling before Core. The task and release-gate coverage now test both rules.
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
- [x] Resolved PR #5 review feedback: the CLI package now builds its executable before its own test command, so `pnpm --filter signal-hub test` works from a clean checkout.
- [x] Resolved the follow-up PR #5 review: CLI tests now build their workspace dependencies, safely convert the executable file URL to a path, and the implementation plan uses the corrected quick-start command.

## Issues Found / Decisions Made

- See `memory/decisions.md` ADR-002 (MVP scope), ADR-003 (monorepo tooling), and ADR-004 (Future-Signal reuse survey) — recorded here.
- See `memory/known-issues.md` DEBT-001 and DEBT-002 for two known limitations baked into the plan (CSV parser has no RFC 4180 support; no linter configured yet).
- See `memory/known-issues.md` ISS-004 for the resolved CI type-resolution failure.
- Recorded ADR-006 for M2's aggregation and diagnostics choices.
- Recorded ADR-007 for CLI composition dependencies.
- ADR-009 authorized the coordinated Vitest/Vite upgrade. TASK-018 completed successfully and ISS-009 is resolved; full and production audits report no known vulnerabilities.
- ISS-012 records the resolved stale test-stack snippets found by the PR #7 follow-up review.

## Next Session: To-Do

1. Review and merge the focused PR #6 and TASK-018 changes when ready.
2. Keep Polymarket, generic REST, YAML configuration, and CLI integration deferred until separately planned and approved.

## Important Context

- The implementation plan (`docs/2026-07-27-signal-hub-mvp.md`) is the single source of truth for exact file paths, code, and test commands for Tasks 1-10 — this Harness's `memory/` and `tasks/` files summarize and index it, they don't replace it. Some older Harness references retain the former `docs/superpowers/plans/` path.
- The user's original design draft (pasted in chat, not saved as a separate file) already did most of the MVP-vs-DEFER scoping decisions; `memory/architecture.md`'s DEFER list and `roadmap.md`'s "Out of Scope" section are both taken directly from it.
- `internalforces/Future-Signal` is the user's own prior project (same domain: signal detection over time-series-like data, different stack: Python/FastAPI/PostgreSQL). It was cloned read-only into the session scratchpad for inspection, not added to this repo. `memory/reuse-candidates.md` is the index of what's worth porting and when — nothing from it has been ported yet.

<!--
Purpose:        Archive of completed tasks (accumulate; do not delete)
Owner:          Implementer / Planner
Update Trigger: Task completed
Harness Version: 1.1
-->

# Completed Tasks — Signal Hub

_Last updated: 2026-08-23_

| ID | Task | Completed | Owner | Notes |
|----|------|-----------|-------|-------|
| — | Signal Hub MVP implementation plan written | 2026-07-27 | Planner | `docs/2026-07-27-signal-hub-mvp.md` |
| — | AI Development Harness v1.1 initial setup | 2026-07-27 | — | Standard tier |
| TASK-001 | Monorepo & Tooling Bootstrap | 2026-07-28 | Implementer | pnpm workspace, Turbo, TypeScript, Vitest configured; install and root checks pass |
| TASK-002 | Shared Types Package (`@signal-hub/types`) | 2026-07-28 | Implementer | Canonical data, signal, detector, and connector contracts implemented; 4 tests pass |
| TASK-003 | Connector SDK — Validation Utilities | 2026-07-28 | Implementer | `isValidDataPoint` validation and contract re-exports implemented; 4 tests pass |
| TASK-004 | SQLite Storage Layer (`@signal-hub/storage`) | 2026-07-28 | Implementer | In-memory SQLite repositories support ordered retrieval and idempotent point inserts; 4 tests pass |
| TASK-005 | Percentage Change Detector | 2026-07-28 | Implementer | Stateless consecutive-point increase/decrease detection with configurable minimum change; 5 tests pass |
| TASK-006 | Threshold Detector | 2026-07-28 | Implementer | Stateless crossing-only threshold detection with normalized excess percentage; 5 tests pass |
| TASK-007 | Signal Scoring Engine | 2026-07-28 | Implementer | Immutable score normalization and public analysis exports; 16 analysis tests pass |
| TASK-008 | CSV Connector | 2026-07-28 | Implementer | Strict CSV parsing with timestamp normalization and line-level validation errors; 6 tests pass |
| TASK-009 | Core Pipeline Engine + Output Formatter | 2026-07-28 | Implementer | Validation, persistence, per-metric detection, score filtering, sorting, and JSON output; 6 tests pass |
| TASK-010 | CLI Application (End-to-End) | 2026-07-28 | Implementer | `signal-hub analyze` command with score and threshold flags; 5 end-to-end tests pass |
| TASK-015 | Address PR #1 review findings | 2026-07-29 | Implementer | Deterministic signals, zero-change suppression, and strict CLI flag validation; 32 focused tests pass |
| TASK-012 | GitHub Actions CI | 2026-07-29 | Implementer | PR workflow uses Node 20 and frozen pnpm install, then build, test, and typecheck |
| TASK-011 | GitHub connector | 2026-07-30 | Implementer | Public/private commit fetching, serial Link pagination, UTC-day aggregation, malformed-record diagnostics, and smoke test completed |
| TASK-016 | Post-merge correctness, documentation, and CI hardening | 2026-08-03 | Implementer | Resolved ISS-005 through ISS-008: CSV physical line numbers, executable CLI quick start, documented CLI composition dependencies, and production dependency auditing in CI |
| TASK-017 | CoinGecko Connector | 2026-08-04 | Implementer | Demo market-chart price ingestion, UTC normalization, deterministic duplicate handling, diagnostics, redacted failures, timeout/body limits, and 7 tests; root checks pass |
| TASK-018 | Vitest/Vite security upgrade | 2026-08-04 | Implementer | Upgraded all workspaces to Vitest 4.1.10 and Vite 6.4.3 (esbuild 0.25.12); Node 20.19.5/22.22.3, frozen install, build, 67 tests, typecheck, and full/production audits pass; ISS-009 resolved |
| TASK-019 | Address PR #7 review findings | 2026-08-05 | Implementer | Removed the stale duplicate M3 roadmap, aligned the Node engine range with Vitest 4.1.10, and passed frozen install/build/67 tests/typecheck/audits |
| TASK-020 | Address PR #7 follow-up review | 2026-08-05 | Implementer | Synchronized all authoritative MVP plan package snippets with Vitest 4.1.10, Vite 6.4.3, and the root Node type dependency; JSON snippets and full workspace checks pass |
| TASK-014 | Deterministic windowed change detector | 2026-08-05 | Implementer | Added an exported, stateless detector for 24-hour, 7-day, and caller-defined windows; 17 focused and 84 workspace tests pass |
| TASK-021 | Project records and user documentation | 2026-08-05 | Documenter | Reconciled merged milestone, backlog, plan paths, M2 status, roadmap, and toolchain records; added verified English/Korean user guidance, library, development, CSV, and JSON examples without code or public-interface changes |
| TASK-022 | CLI Release Readiness | 2026-08-06 | Implementer | Prepared `signal-hub@0.2.0` as an Apache-2.0 standalone bundle; strict four-file tarball, isolated Node 20/22/24 install/execute checks, 87 tests, typecheck, audits, and release-check automation pass; no publication performed |
| TASK-023 | CSV to Signal 0.2.1 Release | 2026-08-06 | Implementer | Replaced npm-rejected `signal-hub` identity, merged independently reviewed PR #11, tagged exact commit `a3a0069` as `v0.2.1`, published `csv-to-signal@0.2.1`, and verified registry metadata, integrity, latest dist-tag, clean install, CLI output, and database placement |
| — | GitHub Release v0.2.1 closeout | 2026-08-07 | Implementer | Published the stable GitHub Release from the existing verified tag, recorded npm provenance and ISS-018 deferral, and removed clean temporary release worktrees |
| TASK-024 | Windowed Analysis CLI Integration | 2026-08-08 | Implementer | Added additive `--window-hours <n>` composition, strict positive finite validation, English/Korean guidance, and a verified `0.3.0` release artifact; 90 tests, typecheck, audits, four-file package inspection, isolated install, and installed windowed execution pass |
| — | CSV to Signal 0.3.0 Release | 2026-08-08 | Implementer | Published exact merged commit `59ec92e` as tag and GitHub Release `v0.3.0` plus npm `csv-to-signal@0.3.0`; registry integrity, latest dist-tag, clean installation, windowed execution, and database placement verified |
| TASK-025 | nanoid Security Patch | 2026-08-17 | Implementer | Updated the transitive security override and lockfile from nanoid 3.3.17 to 3.3.18 after the GHSA vulnerable range expanded; full and production audits are clear |
| TASK-026 | Scheduled Dependency Audit and Actions v6 | 2026-08-17 | Implementer | Upgraded checkout/setup-node to v6 with read-only permissions and added a Node 24 full dependency audit every Monday at 00:00 UTC plus manual dispatch |
| TASK-027 | Node 24 Native SQLite Compatibility | 2026-08-17 | Implementer | Pinned better-sqlite3 12.9.0 after Node 24.19.0 exposed an 11.10.0 native cleanup abort; clean Node 24.19.0 built-CLI tests, the full release check, and PR CI on Node 20/22/24 pass |
| TASK-028 | Align Public Node Engine Contract | 2026-08-17 | Implementer | Addressed PR #16 review by bounding root and CLI engines to the tested Node 20/22/24 releases supported by better-sqlite3 12.9.0; full release check and PR CI pass |
| TASK-029 | Modernize the Supported Node Runtime | 2026-08-22 | Implementer | Removed EOL Node 20 from engines and CI, pinned N-API-based better-sqlite3 13.0.3, aligned Node types and bundle target, and passed the complete release check with 90 tests, clear audits, four-file package inspection, isolated installation, and installed execution; no publication performed |
| TASK-030 | CSV to Signal 0.4.0 Release | 2026-08-22 | Implementer / Release Manager | Merged reviewed PR #18 as `9b98ec9`, retained and verified the exact 8,902-byte artifact on Node 22/24, obtained explicit owner approval, tagged and published `csv-to-signal@0.4.0` as npm `latest`, matched registry checksums, verified clean consumer execution and database placement, and published GitHub Release `v0.4.0` |
| TASK-031 | GitHub and CoinGecko CLI Integration | 2026-08-22 | Implementer | Added backward-compatible external-source commands with environment-only optional credentials, shared detector composition, mocked-network CLI coverage, documentation, and complete package verification; npm `csv-to-signal@0.4.0` remains `latest` and no publication occurred |
| TASK-032 | Address PR #20 review findings | 2026-08-23 | Implementer | Refreshes mutable external snapshots, scopes both external detectors to the current fetch, and namespaces external persistence away from arbitrary CSV identifiers; preserves CSV, schema, and default Core/Storage behavior; 116 tests, typecheck, audits, packaging, and isolated execution pass |

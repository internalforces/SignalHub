<!--
Purpose:        External dependency tracking and version constraints
Owner:          Architect / Implementer
Update Trigger: Dependency added, removed, or version changed (HUMAN APPROVAL required)
Harness Version: 1.1
-->

# dependencies.md — Signal Hub Dependencies

_Last updated: 2026-08-22_

## Core Dependencies

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| better-sqlite3 | 13.0.3 | Embedded N-API SQLite engine backing `@signal-hub/storage`; exact pin supports the Node 22/24 contract and remains the bundled CLI's only runtime dependency | MIT |

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.5.4 | Compilation and type checking for every package |
| vitest | ^4.1.10 | Test runner (used in every package's `tests/`) |
| vite | 6.4.3 | Explicit Vitest peer pinned for the supported Node engine range |
| turbo | ^2.0.9 | Monorepo build/test/typecheck orchestration |
| @types/node | ^22.20.1 | Node 22 built-in module type definitions for the minimum supported runtime line |
| @types/better-sqlite3 | ^7.6.11 | Type definitions for `better-sqlite3` (used in `@signal-hub/storage`) |
| esbuild | 0.25.12 | Approved direct CLI bundler for producing a standalone npm runtime artifact |

## Transitive Security Resolutions

| Package | Version | Reason |
|---------|---------|--------|
| nanoid | 3.3.18 | Workspace override for the patched PostCSS/Vite development-tooling path affected by GHSA-2v37-7h3g-55p8 |

## External Services / APIs

| Service | Purpose | Auth | Notes |
|---------|---------|------|-------|
| GitHub REST API | GitHub commit time-series ingestion | Optional caller-supplied token | Available through `@signal-hub/connector-github`; not exposed through the CLI |
| CoinGecko Demo API | Market-chart price ingestion | Caller-supplied Demo API key | Available through `@signal-hub/connector-coingecko`; not exposed through the CLI |

## Version Policy

- Major upgrades: HUMAN APPROVAL + full test suite required
- Minor / patch: Reviewer sign-off then proceed
- Security patches: Apply immediately, Reviewer reviews after
- Any **new** dependency beyond this list requires HUMAN APPROVAL and an entry here before merge (per `AGENTS.md` § Actions Requiring Human Approval)

## Completed Maintenance

| Task | Approval | Previous baseline | Verified resolution | Status |
|------|----------|-------------------|---------------------|--------|
| TASK-018 / ISS-009 | Project owner, 2026-08-04 | Vitest 2.1.9; transitive Vite 5.4.21 | Vitest 4.1.10; Vite 6.4.3; esbuild 0.25.12 | Completed; Node 20.19.5 and 22.22.3 validation, frozen install, build, 67 tests, typecheck, and full/production audits passed |
| TASK-022 / ISS-013 | Project owner, 2026-08-06 | esbuild available only transitively through Vite | esbuild 0.25.12 declared directly by the CLI | Approved for the standalone CLI bundle; no package publication authorized |
| TASK-025 / ISS-020 | Project owner, 2026-08-17 | nanoid 3.3.17 became vulnerable after the advisory range expanded | nanoid 3.3.18 enforced through the workspace override | Completed; frozen install, 90 tests, typecheck, full/production audits, and release check passed |
| TASK-027 / ISS-021 | Project owner, 2026-08-17 | better-sqlite3 11.10.0 aborts during native cleanup on Node 24.19.0 | better-sqlite3 pinned to 12.9.0 in Storage and the public CLI | Completed; clean Node 24.19.0 regression tests, the full release check, and PR CI on Node 20/22/24 pass |
| TASK-028 / ISS-022 | Project owner, 2026-08-17 | The unbounded `>=24.0.0` engine contract included Node 26+, outside better-sqlite3 12.9.0's declared support | Root and public CLI engines bounded to `^20.0.0 || ^22.0.0 || ^24.0.0` | Completed; RED/GREEN manifest regression, full release check, and PR CI on Node 20/22/24 pass |
| TASK-029 / DEBT-003 / DEBT-005 | Project owner, 2026-08-22 | EOL Node 20 forced the runtime to stay on deprecated `prebuild-install` packaging | Root and public CLI engines reduced to `^22.0.0 || ^24.0.0`; `better-sqlite3` pinned to N-API-based 13.0.3; `@types/node` raised to 22.20.1 | Completed locally; Node 22 and 24.19.0 release checks pass with 90 tests, typecheck, clear audits, four-file package inspection, isolated install, and installed execution; no publication performed |

The workspace advertises Node.js `^22.0.0 || ^24.0.0`, matching the tested CI matrix, Vitest
4.1.10, and better-sqlite3 13.0.3 without claiming EOL Node 20 or unverified Node 21/23/25+ releases.

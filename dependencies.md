<!--
Purpose:        External dependency tracking and version constraints
Owner:          Architect / Implementer
Update Trigger: Dependency added, removed, or version changed (HUMAN APPROVAL required)
Harness Version: 1.1
-->

# dependencies.md — Signal Hub Dependencies

_Last updated: 2026-08-05_

## Core Dependencies

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| better-sqlite3 | ^11.3.0 | Embedded SQLite engine backing `@signal-hub/storage`'s `SqliteStorage` | MIT |

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.5.4 | Compilation and type checking for every package |
| vitest | ^4.1.10 | Test runner (used in every package's `tests/`) |
| vite | 6.4.3 | Explicit Vitest peer pinned for the supported Node engine range |
| turbo | ^2.0.9 | Monorepo build/test/typecheck orchestration |
| @types/node | ^20.19.43 | Node 20 built-in module type definitions for workspace compilation |
| @types/better-sqlite3 | ^7.6.11 | Type definitions for `better-sqlite3` (used in `@signal-hub/storage`) |

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

The workspace advertises Node.js `^20.0.0 || ^22.0.0 || >=24.0.0`, matching Vitest 4.1.10's
published engine range instead of claiming support for unsupported Node 21.x or 23.x releases.

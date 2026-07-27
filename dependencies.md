<!--
Purpose:        External dependency tracking and version constraints
Owner:          Architect / Implementer
Update Trigger: Dependency added, removed, or version changed (HUMAN APPROVAL required)
Harness Version: 1.1
-->

# dependencies.md — Signal Hub Dependencies

_Last updated: 2026-07-27_

## Core Dependencies

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| better-sqlite3 | ^11.3.0 | Embedded SQLite engine backing `@signal-hub/storage`'s `SqliteStorage` | MIT |

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.5.4 | Compilation and type checking for every package |
| vitest | ^2.0.5 | Test runner (used in every package's `tests/`) |
| turbo | ^2.0.9 | Monorepo build/test/typecheck orchestration |
| @types/better-sqlite3 | ^7.6.11 | Type definitions for `better-sqlite3` (used in `@signal-hub/storage`) |

## External Services / APIs

| Service | Purpose | Auth | Notes |
|---------|---------|------|-------|
| — | (none) | — | The MVP's only connector is CSV (local file); no network calls happen. GitHub/CoinGecko/Polymarket connectors are deferred — see `memory/architecture.md` DEFER list |

## Version Policy

- Major upgrades: HUMAN APPROVAL + full test suite required
- Minor / patch: Reviewer sign-off then proceed
- Security patches: Apply immediately, Reviewer reviews after
- Any **new** dependency beyond this list requires HUMAN APPROVAL and an entry here before merge (per `AGENTS.md` § Actions Requiring Human Approval)

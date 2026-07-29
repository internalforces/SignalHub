<!--
Purpose:        Technology decisions and rationale
Owner:          Architect
Update Trigger: New technology adopted, existing technology replaced
Harness Version: 1.1
-->

# tech-stack.md — Signal Hub Technology Stack

_Last updated: 2026-07-29_

## Stack Overview

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Language | TypeScript | ^5.5.4 | Strict typing across a package-boundary-heavy monorepo; shared interfaces (`DataPoint`, `Signal`, etc.) are the contract between packages |
| Framework | None | — | Signal Hub MVP is a CLI, not a web app — no framework needed |
| Database | SQLite via `better-sqlite3` | ^11.3.0 | Zero-ops embedded storage matching the MVP's "no distributed system" philosophy; synchronous API keeps the pipeline simple |
| Infrastructure | None (local execution) | — | No cloud infra in the MVP; `signal-hub` is planned for npm publish only, not yet executed |
| Package Manager | pnpm workspaces + Turborepo | pnpm@9.7.0 / turbo ^2.0.9 | Workspace `workspace:*` deps + `dependsOn: ["^build"]` gives correct cross-package build ordering with minimal config |
| CI/CD | GitHub Actions | Node 20 | PR workflow runs frozen `pnpm install`, build, test, and typecheck |
| Test Runner | Vitest | ^2.0.5 | Zero-config TS test runner, in-memory SQLite friendly |

## Architecture Patterns

- **Structure**: Layered monorepo with strict one-directional package dependencies — `apps/cli → core → {storage, analysis, connector-sdk}`, `connectors/* → connector-sdk`. Enforced by convention/review today, not tooling.
- **Storage access**: Repository pattern (`DataPointRepository`, `SignalRepository`) — no package outside `storage` talks to SQLite directly.
- **API style**: N/A — no REST API in the MVP; the CLI (`signal-hub analyze <file>`) is the only interface.
- **State management**: N/A — detectors are stateless (`detect(series): Signal[]`); the only persisted state is the SQLite file (`data.db`).
- **Build**: each package compiles independently via `tsc -p tsconfig.json` (no bundler); Turborepo orders builds via `dependsOn: ["^build"]` and workspace symlinks resolve cross-package imports through each package's `main`/`types` fields.

## Environments

| Environment | Purpose | Access |
|-------------|---------|--------|
| Local | Local development and CLI usage | `pnpm --filter signal-hub exec signal-hub analyze <file>` |
| Staging | N/A — not defined for this project | — |
| Production | N/A locally; future npm registry once `signal-hub` is published (not yet done) | `npm install -g signal-hub` (planned, not live) |

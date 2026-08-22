<!--
Purpose:        Technology decisions and rationale
Owner:          Architect
Update Trigger: New technology adopted, existing technology replaced
Harness Version: 1.1
-->

# tech-stack.md — Signal Hub Technology Stack

_Last updated: 2026-08-22_

Versions below reflect the current lockfile and verified local toolchain. Manifest ranges are
shown where they define the supported contract.

## Stack Overview

| Layer | Technology | Current / supported version | Rationale |
|-------|-----------|-----------------------------|-----------|
| Runtime | Node.js | `^22.0.0 || ^24.0.0`; PR CI uses 22/24 | Supported range contains the maintained LTS lines validated with the native SQLite runtime and excludes EOL Node 20 and unverified Node 25+ releases |
| Language | TypeScript | 5.9.3 resolved (`^5.5.4`) | Strict typing across package boundaries |
| Framework | None | — | Signal Hub is a local CLI and library workspace |
| Database | SQLite via `better-sqlite3` | 13.0.3 (exact) | Embedded, synchronous N-API storage with bundled Node 22/24 prebuilds and no service dependency |
| Package manager | pnpm workspaces | pnpm 9.7.0 | `workspace:*` links the monorepo packages |
| Task orchestration | Turborepo | 2.10.7 resolved (`^2.0.9`) | Dependency-ordered build, test, and type-check tasks |
| Test runner | Vitest | 4.1.10 | TypeScript tests and in-memory SQLite coverage |
| Test build dependency | Vite | 6.4.3 | Explicit patched Vite version for the Vitest stack |
| CI | GitHub Actions v6 | Node 22/24 PR matrix; Node 24 weekly audit | Pull requests run frozen install, production audit, build, tests, typecheck, and release verification; scheduled/manual workflow runs the full dependency audit |
| Distribution | npm | `csv-to-signal@0.4.0` | Public CLI package; no service infrastructure is deployed |

## Workspace Structure

The monorepo contains nine buildable workspaces:

- one application: `apps/cli`;
- three connectors: `connectors/csv`, `connectors/github`, `connectors/coingecko`; and
- five packages: `packages/types`, `packages/connector-sdk`, `packages/storage`,
  `packages/analysis`, and `packages/core`.

Each workspace compiles independently with `tsc -p tsconfig.json`. Turborepo's `^build`
dependency ordering ensures package entry points exist before consumers build or test.

## Architecture Patterns

- **Structure**: layered monorepo with strict one-directional dependencies. Connectors depend only
  on Connector SDK and Types; Storage and Analysis depend only on Types; Core composes the shared
  packages; the CLI composes Core with CSV, Analysis, Storage, and Types.
- **Storage access**: repository pattern through `DataPointRepository` and `SignalRepository`.
  No package outside Storage talks directly to SQLite.
- **Interfaces**: the CSV CLI is the only user-facing interface. GitHub and CoinGecko remain
  library-only APIs; windowed analysis is available both as a library and through `--window-hours`.
- **State**: detectors are stateless. The CLI persists points and signals to `data.db` in its
  current working directory.
- **Build**: internal workspaces emit ESM/NodeNext targeting ES2022; the public CLI release uses
  esbuild to bundle private workspace code while keeping `better-sqlite3` external. There is no
  web framework or migration tool.

## Environments

| Environment | Purpose | Access |
|-------------|---------|--------|
| Local | Development, tests, and CSV CLI use | `node apps/cli/dist/index.js analyze <file.csv>` after `pnpm build` |
| Pull-request CI | Verification on Node 22 and 24 | GitHub Actions workflow in `.github/workflows/ci.yml` |
| Scheduled audit | Weekly and manual full dependency audit on Node 24 | GitHub Actions workflow in `.github/workflows/dependency-audit.yml` |
| Staging | Not defined | — |
| npm distribution | Published public CLI `csv-to-signal@0.4.0`; no service deployment | npm registry and GitHub Release `v0.4.0` |

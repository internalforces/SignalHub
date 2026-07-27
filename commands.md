<!--
Purpose:        Quick-reference commands for each agent role
Owner:          Implementer / Release Manager
Update Trigger: New commands added, environment changed
Harness Version: 1.1
-->

# commands.md — Signal Hub Quick Reference

_Last updated: 2026-07-27_

## Setup

```bash
pnpm install              # Install dependencies across the workspace
```

> No `.env` file exists yet — Signal Hub has no external services or secrets in the MVP.

## Development

```bash
pnpm build                     # turbo run build (tsc -p per package, dependency-ordered)
pnpm test                      # turbo run test (vitest run per package)
pnpm typecheck                 # turbo run typecheck (tsc --noEmit per package)
pnpm --filter <pkg> test        # Run a single package's tests, e.g. --filter @signal-hub/analysis
pnpm --filter signal-hub exec signal-hub analyze <file.csv>   # Run the CLI against a CSV file
```

> Lint and format tooling (ESLint/Prettier) are **not yet configured** — not part of the MVP plan. Add them via a Planner-approved task before relying on `pnpm lint` / `pnpm format`.

## Build & Publish

```bash
pnpm -r build             # Build every package/connector/app in dependency order
# ⚠️ npm publish of the `signal-hub` CLI package: HUMAN APPROVAL required, not yet set up
```

## Database

Signal Hub uses no migration framework. `SqliteStorage`'s constructor applies
`SCHEMA_SQL` (`CREATE TABLE IF NOT EXISTS ...`) automatically on every open —
this **is** the migration mechanism for the MVP.

```bash
rm data.db                # ⚠️ Development only — deletes local SQLite data (points + signals)
```

# Review — M1 MVP

**Date:** 2026-07-30  
**Scope:** M1 MVP and CI as merged at `e72c26e`  
**Verdict:** Request Changes

## Findings

### [High] CLI bypasses the required package dependency direction

`apps/cli/src/cli.ts` imports `@signal-hub/analysis` and `@signal-hub/storage`
directly, and `apps/cli/package.json` declares both packages as dependencies. The
project constitution fixes the CLI dependency direction to `core`,
`connectors/csv`, and `types`, while the architecture makes Core the orchestration
boundary that combines analysis, storage, and connector concerns. Keeping detector
and storage construction in the CLI makes that boundary unenforceable and will
couple every future interface directly to implementation packages.

**Required change:** Move construction of the MVP pipeline dependencies behind a
Core-owned API, then remove the CLI's direct analysis and storage dependencies.
Because changing a public API requires human approval, prepare the proposed Core
API and obtain that approval before implementing it.

### [Medium] Documented quick-start command cannot launch the CLI

The README instructs users to run
`pnpm --filter signal-hub exec signal-hub analyze data.csv`, but a clean build does
not expose a self-referential package bin to `pnpm exec`; the command exits with
`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` and `Command "signal-hub" not found`.
Consequently, the only documented usage path fails before analysis begins.

**Required change:** Document a command that works from a repository checkout
(for example, invoking the built entry point with Node), or add an approved package
script and document that script. Add an automated smoke check for the documented
command.

## Checklist

| Check | Result | Notes |
|---|---|---|
| Code style | Pass | Strict TypeScript and existing formatting conventions are followed. |
| Planned tests | Pass | All 50 tests pass and cover the MVP task list plus regressions. |
| Security | Pass with debt | Core applies `isValidDataPoint`; no hardcoded secrets found. Dependency scanning remains unautomated technical debt. |
| Dependency direction | **Fail** | CLI directly depends on analysis and storage. |
| DEFER scope | Pass | No deferred detector, connector, dashboard, alerting, LLM, MCP, or distributed feature was added. |
| Error handling | Pass | CSV failures include row numbers and CLI validation rejects malformed flags. |
| Documentation | **Fail** | The README quick-start command is not runnable. |
| AGENTS.md restrictions | **Fail** | The fixed package dependency direction is violated. |
| New external dependencies | Pass | No unapproved dependency was introduced in the reviewed state. |

## Verification

- `pnpm install --frozen-lockfile` — passed.
- `pnpm build` — passed (7 packages).
- `pnpm test` — passed (50 tests across 10 test files).
- `pnpm typecheck` — passed (7 packages).
- `rg '^import .* from "@signal-hub/' apps packages connectors --glob '*.ts'` — confirmed package imports and exposed the CLI boundary violation.
- README quick-start smoke command — failed because `signal-hub` was not found.


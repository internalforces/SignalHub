# Review — M1 MVP

**Date:** 2026-07-30  
**Scope:** M1 MVP and CI as merged at `e72c26e`  
**Verdict:** Request Changes

## Findings

### [Medium] CLI dependency guidance is inconsistent across the plan

`apps/cli/src/cli.ts` imports `@signal-hub/analysis` and `@signal-hub/storage`
directly, and `apps/cli/package.json` declares both packages as dependencies. The
architecture summary describes the CLI as depending only on `core`,
`connectors/csv`, and `types`, while Task 10 explicitly requires the analysis and
storage imports. The constitution itself only prohibits non-Core packages from
importing storage, analysis, and connector-sdk together; the CLI imports the first
two only. This is therefore a planning inconsistency, not a High-severity
constitutional breach.

**Required change:** Reconcile the plan and architecture in an ADR before
requesting any Core-owned composition API or CLI dependency refactor.

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

### [Medium] CI does not run the required dependency vulnerability scan

`standards.md` requires regular dependency scanning and directs the project to add
it when CI is set up. The CI workflow currently installs, builds, tests, and
typechecks, but does not scan dependencies. This is an unmet project standard.

**Required change:** Track this as ISS-007. Adding the scan changes CI
infrastructure configuration and therefore requires human approval before it is
implemented.

### [Medium] CSV diagnostics can report an incorrect physical line number

`CsvConnector` removes blank lines before calculating a malformed row's line
number. A bad row physically on line 3 can consequently be reported as line 2.

**Required change:** Track this as ISS-008; preserve original source positions and
add a blank-line regression test when fixing the connector.

## Checklist

| Check | Result | Notes |
|---|---|---|
| Code style | Pass | Strict TypeScript and existing formatting conventions are followed. |
| Planned tests | Pass | All 50 tests pass and cover the MVP task list plus regressions. |
| Security | **Fail** | Core applies `isValidDataPoint` and no hardcoded secrets were found, but the required CI dependency scan is absent (ISS-007). |
| Dependency direction | Pass with plan inconsistency | The constitution's combined-import restriction passes; the plan and architecture need reconciliation (ISS-005). |
| DEFER scope | Pass | No deferred detector, connector, dashboard, alerting, LLM, MCP, or distributed feature was added. |
| Error handling | **Fail** | CSV errors after blank lines use a compacted rather than physical line number (ISS-008); CLI validation rejects malformed flags. |
| Documentation | **Fail** | The README quick-start command is not runnable. |
| AGENTS.md restrictions | Pass | No restriction violation was found; ISS-005 is a plan inconsistency rather than a constitutional breach. |
| New external dependencies | Pass | No unapproved dependency was introduced in the reviewed state. |

## Verification

- `pnpm install --frozen-lockfile` — passed.
- `pnpm build` — passed (7 packages).
- `pnpm test` — passed (50 tests across 10 test files).
- `pnpm typecheck` — passed (7 packages).
- `rg '^import .* from "@signal-hub/' apps packages connectors --glob '*.ts'` — confirmed the CLI imports and the plan inconsistency described in ISS-005.
- README quick-start smoke command — failed because `signal-hub` was not found.

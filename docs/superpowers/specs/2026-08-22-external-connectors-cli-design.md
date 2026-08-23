# GitHub and CoinGecko CLI Integration Design

**Date:** 2026-08-22
**Status:** Approved by the project owner
**Scope:** Add CLI composition for the existing GitHub and CoinGecko connector libraries

## 2026-08-22 Execution Ruling Addendum

Concurrent mainline work consumed M8/TASK-029/ADR-022 for runtime modernization and
TASK-030/ADR-023 for the published `csv-to-signal@0.4.0` release. This connector integration is
therefore executed as M9 TASK-031 under ADR-024 on the merged Node.js 22/24,
`better-sqlite3` 13.0.3, and esbuild `node22` baseline. npm `0.4.0` remains `latest` and predates
the repository-built GitHub and CoinGecko commands; this work does not publish a new version.
Original planning statements below are retained as historical design context and are superseded
where they conflict with this ruling.

## Goal

Allow the published `csv-to-signal` executable to analyze GitHub commit counts and CoinGecko
price history through the existing deterministic pipeline while preserving CSV compatibility,
JSON output, SQLite persistence, detector behavior, and package dependency direction.

## Constraints

- Keep `csv-to-signal analyze <file.csv>` backward compatible.
- Do not change `DataPoint`, `Signal`, `Detector`, or `Connector`.
- Do not change the SQLite schema or Core pipeline.
- Do not add an external dependency.
- Do not publish, deploy, tag, or create a release.
- Read optional credentials only from process environment variables; never accept them as command
  arguments, print them, persist them, or include them in an error.
- Keep stdout as a pretty-printed JSON array of `Signal` objects.
- Preserve the dependency direction. The CLI may compose connectors but must not contain connector
  normalization or pipeline logic.

## Considered Approaches

### 1. Add sibling source commands (selected)

Keep the existing CSV command and add `github` and `coingecko` commands:

```text
csv-to-signal analyze <file.csv> [detector options]
csv-to-signal github <owner>/<repo> [detector options]
csv-to-signal coingecko <coin-id> [source options] [detector options]
```

This is additive, keeps existing scripts working, and maps each command directly to one connector.
The package name remains CSV-oriented, but renaming it would be a much larger breaking release.

### 2. Add a source discriminator below `analyze`

Examples would be `analyze csv <file>`, `analyze github <owner>/<repo>`, and
`analyze coingecko <coin-id>`. This is conceptually uniform but either breaks the current CSV
syntax or requires a permanent ambiguous compatibility branch.

### 3. Add a `--source` flag

An interface such as `analyze <input> --source github` minimizes command names but overloads one
positional argument with three meanings and makes source-specific option validation less clear.

Approach 1 is selected because it is the smallest backward-compatible public CLI addition.

## Public CLI Contract

### CSV

The existing command remains unchanged:

```text
csv-to-signal analyze <file.csv> [--min-score <n>] [--threshold <n>] [--window-hours <n>]
```

### GitHub

```text
csv-to-signal github <owner>/<repo> [--min-score <n>] [--threshold <n>] [--window-hours <n>]
```

- `<owner>/<repo>` must contain exactly one nonempty owner and one nonempty repository segment.
- Public repositories work without credentials.
- If `GITHUB_TOKEN` contains a nonblank value, the CLI passes it to `GitHubConnector` for private
  repository access and higher authenticated limits.
- The connector continues to emit one UTC-day commit-count point per day.

### CoinGecko

```text
csv-to-signal coingecko <coin-id> [--vs-currency <currency>] [--days <n>]
  [--min-score <n>] [--threshold <n>] [--window-hours <n>]
```

- `<coin-id>` must be nonempty.
- `--vs-currency` defaults to `usd` and must be nonempty when supplied.
- `--days` defaults to `30` and must be a positive integer when supplied.
- If `COINGECKO_DEMO_API_KEY` contains a nonblank value, the CLI passes it to
  `CoinGeckoConnector`; otherwise the connector uses CoinGecko's keyless public API path.
- The connector continues to emit the provider's valid price observations without new bucketing.

### Shared detector options

All three commands accept the existing detector options:

- `--min-score <n>`: finite number; default `0` in Core.
- `--threshold <n>`: finite number; adds `ThresholdDetector`.
- `--window-hours <n>`: positive finite number whose millisecond conversion is also finite; adds
  `WindowedChangeDetector`.

Arguments remain flag/value pairs. Unknown flags, missing values, invalid values, extra
positionals, and source-specific flags used with the wrong command produce a usage error before
opening `data.db` or making a network request. Repeated flags use the last valid value, matching
the current CLI behavior.

## Architecture and Data Flow

The CLI parser creates one connector and the common detector list, then calls the existing
pipeline exactly once:

```text
CLI arguments + optional environment credential
  -> CsvConnector | GitHubConnector | CoinGeckoConnector
  -> runPipeline(connector, SqliteStorage, detector options)
  -> formatSignals(signals)
  -> JSON stdout
```

`apps/cli` gains development/build-time dependencies on
`@signal-hub/connector-github` and `@signal-hub/connector-coingecko`. Esbuild bundles both private
workspace packages into `dist/index.js`; `better-sqlite3` remains the only registry runtime
dependency. Connector packages retain their current dependency boundaries and implementations.

The existing `data.db` location remains the current working directory. Metric IDs already include
their source (`github:...` or `coingecko:...`), so data from multiple commands can coexist without
a schema or deduplication-key change.

The authentication assumptions follow the providers' current primary documentation: GitHub's
list-commits endpoint permits unauthenticated public-resource requests and requires repository
Contents read permission for fine-grained private access, while CoinGecko documents both its Demo
key header and a keyless public API for the market-chart endpoint.

## Component Changes

### `apps/cli/src/cli.ts`

- Parse the three commands and their allowed options.
- Construct the selected existing connector.
- Read only `GITHUB_TOKEN` and `COINGECKO_DEMO_API_KEY`, trimming blank values to absent.
- Reuse one helper to construct percentage, threshold, and windowed detectors.
- Open storage only after complete argument validation and connector construction.
- Preserve connector and pipeline errors without adding argument or environment dumps.

No connector-specific response normalization belongs in this file.

### `apps/cli/package.json`

- Add the two private connector packages as exact-version development dependencies so they are
  available to TypeScript and bundled into the executable.
- Keep `better-sqlite3` as the only runtime dependency.
- Keep package name, executable name, version, engine range, and tarball allowlist unchanged.

### Documentation

- Update the package README, root README, Korean README, and library/development guidance where
  they currently describe the CLI as CSV-only.
- Document both optional credential environment variables without showing real credentials or
  recommending command-line secret arguments.
- State explicitly that the work does not publish a new npm version.

### Project records

- Add one focused task for the approved integration, archive it after verification, and record the
  public CLI decision, architecture update, and session outcome.
- Do not modify release records or create a release task.

## Error Handling

- Usage failures occur before storage or network side effects.
- GitHub and CoinGecko HTTP, JSON, pagination, size-limit, and timeout errors continue to come from
  their connector implementations.
- Connector diagnostic collections remain internal and are not added to stdout or stderr in this
  scope; changing the output envelope would break the current JSON contract.
- The CLI entry point continues to print one sanitized error message to stderr and set exit code 1.
- Storage is closed in `finally` after it has been opened.

## Testing Strategy

Implementation follows TDD and extends the existing CLI tests:

1. Unit-test GitHub command parsing, public operation, optional trimmed `GITHUB_TOKEN`, malformed
   repository identifiers, common detector options, and a mocked connector response.
2. Unit-test CoinGecko defaults, explicit source options, optional trimmed
   `COINGECKO_DEMO_API_KEY`, invalid `--days`/currency values, common detector options, and a mocked
   connector response.
3. Assert invalid arguments neither create `data.db` nor call `fetch`.
4. Keep built-executable tests network-free. Cover external commands through `runCli` tests with a
   mocked global `fetch`, and cover the executable bundle through package assertions; do not add a
   production API-base override solely for child-process tests.
5. Extend package tests to confirm the bundle contains no private workspace imports and
   `better-sqlite3` remains the sole runtime dependency.
6. Run focused CLI tests, all workspace tests, build, typecheck, full and production audits,
   package dry-run inspection, and the established release-check script when present.

Tests must assert behavior, not secret values. Test credentials use synthetic literals and must
never appear in errors or snapshots.

## Acceptance Criteria

- Existing CSV invocations and tests behave identically.
- GitHub public repository analysis can run without a token; an optional nonblank `GITHUB_TOKEN`
  reaches only the connector authorization header.
- CoinGecko price analysis defaults to USD/30 days; valid overrides work; an optional nonblank
  `COINGECKO_DEMO_API_KEY` reaches only the connector header.
- All commands use the same detectors, scoring, filtering, ordering, persistence, and JSON format.
- Invalid CLI input causes no database creation and no HTTP request.
- No schema, shared type, connector implementation, Core behavior, package/executable name, or
  runtime dependency set changes.
- The built tarball remains limited to `LICENSE`, `README.md`, `dist/index.js`, and `package.json`.
- No tag, publication, deployment, or live paid API call occurs.

## Out of Scope

- Changing connector normalization, pagination, diagnostics, timeout, or response-size policy.
- Persisting diagnostics, ETags, rate-limit state, or detector cooldown state.
- Adding Polymarket, generic REST, YAML configuration, scheduling, alerting, or dashboard support.
- Renaming `csv-to-signal`, changing the JSON output envelope, changing SQLite schema, or releasing
  a new package version.

# CSV to Signal

English | [한국어](docs/README.ko.md)

CSV to Signal turns timestamped numeric observations into deterministic, ranked signals.
It is intended for developers and analysts who want a small local engine for validating
time-series signal rules without operating a service, scheduler, or dashboard.

```text
CSV -> Core -> Detector -> Signal -> CLI
```

Given the same stored observations and detector configuration, CSV to Signal produces the same
signal identities and scores. The current user-facing command analyzes CSV files locally and
persists observations and signals in SQLite.

## Current support

- CSV input through the `csv-to-signal analyze` CLI.
- Consecutive percentage-change signals by default.
- Optional upward threshold-crossing signals.
- Score filtering and deterministic JSON output.
- Optional windowed change signals through `--window-hours`.
- GitHub commit history and CoinGecko price history as workspace libraries. These are not connected
  to the CLI.

CSV to Signal `0.3.0` is published on npm as
[`csv-to-signal`](https://www.npmjs.com/package/csv-to-signal) and includes windowed CLI analysis.
It does not provide scheduling, alerts, a REST API,
a dashboard, YAML configuration, Polymarket or generic REST ingestion, or ML-style anomaly,
trend, spike, and change-point detection.

## Requirements

- Node.js `^20.0.0 || ^22.0.0 || >=24.0.0`
- Corepack with pnpm 9.7.0

## Quick start

From the repository root:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build
node apps/cli/dist/index.js analyze examples/prices.csv
```

The included file contains:

```csv
metricId,timestamp,value
demo.price,2026-08-01T00:00:00Z,100
demo.price,2026-08-02T00:00:00Z,125
demo.price,2026-08-03T00:00:00Z,100
```

The command prints ranked JSON:

```json
[
  {
    "id": "[\"percentage-change\",\"demo.price\",\"2026-08-02T00:00:00.000Z\",125,25]",
    "metricId": "demo.price",
    "type": "increase",
    "score": 50,
    "direction": "up",
    "timestamp": "2026-08-02T00:00:00.000Z",
    "value": 125,
    "changePercent": 25
  },
  {
    "id": "[\"percentage-change\",\"demo.price\",\"2026-08-03T00:00:00.000Z\",100,-20]",
    "metricId": "demo.price",
    "type": "decrease",
    "score": 40,
    "direction": "down",
    "timestamp": "2026-08-03T00:00:00.000Z",
    "value": 100,
    "changePercent": -20
  }
]
```

## CLI reference

```text
csv-to-signal analyze <file.csv> [--min-score <n>] [--threshold <n>] [--window-hours <n>]
```

| Argument | Meaning |
|---|---|
| `<file.csv>` | CSV path, resolved from the current working directory |
| `--min-score <n>` | Return only signals whose score is at least `n`; defaults to `0` |
| `--threshold <n>` | Also emit a signal for an initial value at or above `n`, or a later upward crossing from below it |
| `--window-hours <n>` | Also compare the latest value with the newest observation at or before a positive, finite hour window |

For example:

```bash
node apps/cli/dist/index.js analyze examples/prices.csv --min-score 45 --threshold 120 --window-hours 24
```

Flags require finite numeric values and are parsed in flag/value pairs. If a flag is repeated,
the last value wins.

## CSV rules and common errors

The first nonblank line must contain exactly `metricId,timestamp,value` in that order. Header
case and surrounding whitespace are ignored. Every nonblank data row must have exactly three
comma-separated fields:

- `metricId` must be nonempty.
- `timestamp` must be parseable by JavaScript and is normalized to ISO 8601 UTC.
- `value` must be a finite number.
- Blank lines are ignored, but their physical line numbers are retained in error messages.

The parser is deliberately simple and does not support quoted fields, escaped commas, alternate
column order, or RFC 4180 CSV features. Typical failures report an invalid header, wrong column
count, missing metric ID, invalid timestamp, invalid numeric value, missing file, or CLI usage.

## Local database

Every CLI run opens or creates `data.db` in the current working directory, not beside the input
CSV. The database stores normalized data points and emitted signals. Re-running the same input is
idempotent because observations and deterministic signal IDs are inserted only once. `data.db`
is ignored by Git.

Use a dedicated working directory if you want separate databases for separate analyses.

## Release verification

Maintainers can build, inspect, install, and execute the npm tarball locally before publication:

```bash
pnpm release:check
```

The command performs a frozen install, build, all tests, typecheck, full and production dependency
audits, strict package-content validation, and an isolated tarball install/CLI smoke test. The
temporary tarball is deleted after verification. It never authenticates to npm or publishes a
package.

The release artifact contains only the bundled CLI executable, package metadata, its package
README, and the Apache-2.0 license. GitHub and CoinGecko workspaces remain private and are not
runtime dependencies of the tarball; the private analysis workspace is bundled into the CLI.

## More documentation

- [Library usage](docs/library-usage.md): GitHub, CoinGecko, and `WindowedChangeDetector` examples.
- [Development guide](docs/development.md): repository layout, commands, tests, and dependency rules.
- [CSV to Signal 0.2.1 release plan](docs/2026-08-06-csv-to-signal-release.md): approved public
  package and executable identity after npm rejected the original unscoped name.
- [M6 windowed CLI plan](docs/2026-08-08-signal-hub-m6-windowed-cli.md): approved scope for the
  windowed CLI integration released in `0.3.0`.
- [MVP implementation plan](docs/2026-07-27-signal-hub-mvp.md): historical task-level implementation detail.

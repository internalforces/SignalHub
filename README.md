# Signal Hub

Signal Hub turns timestamped numeric observations into deterministic, ranked signals.
It is intended for developers and analysts who want a small local engine for validating
time-series signal rules without operating a service, scheduler, or dashboard.

```text
CSV -> Core -> Detector -> Signal -> CLI
```

Given the same stored observations and detector configuration, Signal Hub produces the same
signal identities and scores. The current user-facing command analyzes CSV files locally and
persists observations and signals in SQLite.

## Current support

- CSV input through the `signal-hub analyze` CLI.
- Consecutive percentage-change signals by default.
- Optional upward threshold-crossing signals.
- Score filtering and deterministic JSON output.
- GitHub commit history, CoinGecko price history, and windowed change analysis as workspace
  libraries. These are not connected to the CLI.

Signal Hub is not yet published to npm. It does not provide scheduling, alerts, a REST API,
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
signal-hub analyze <file.csv> [--min-score <n>] [--threshold <n>]
```

| Argument | Meaning |
|---|---|
| `<file.csv>` | CSV path, resolved from the current working directory |
| `--min-score <n>` | Return only signals whose score is at least `n`; defaults to `0` |
| `--threshold <n>` | Also emit a signal for an initial value at or above `n`, or a later upward crossing from below it |

For example:

```bash
node apps/cli/dist/index.js analyze examples/prices.csv --min-score 45 --threshold 120
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

## More documentation

- [Library usage](docs/library-usage.md): GitHub, CoinGecko, and `WindowedChangeDetector` examples.
- [Development guide](docs/development.md): repository layout, commands, tests, and dependency rules.
- [MVP implementation plan](docs/2026-07-27-signal-hub-mvp.md): historical task-level implementation detail.

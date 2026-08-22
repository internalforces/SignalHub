# csv-to-signal

`csv-to-signal` is a deterministic local CLI for turning timestamped CSV observations into ranked
JSON signals. It stores normalized observations and signals in SQLite and produces stable signal
identities for equal inputs and detector configuration.

## Requirements

- Node.js `^22.0.0 || ^24.0.0`

## Installation

```bash
npm install --global csv-to-signal
```

## Usage

```text
csv-to-signal analyze <file.csv> [--min-score <n>] [--threshold <n>] [--window-hours <n>]
```

Example input:

```csv
metricId,timestamp,value
demo.price,2026-08-01T00:00:00Z,100
demo.price,2026-08-02T00:00:00Z,125
demo.price,2026-08-03T00:00:00Z,100
```

Example command:

```bash
csv-to-signal analyze prices.csv --min-score 40 --threshold 120 --window-hours 24
```

The command writes ranked JSON to standard output. It opens or creates `data.db` in the current
working directory, so use a dedicated directory when analyses should use separate databases.

## CSV contract

The first nonblank line must be exactly `metricId,timestamp,value`, ignoring header case and
surrounding whitespace. Each nonblank data row must contain:

- a nonempty metric ID;
- a JavaScript-parseable timestamp, normalized to ISO 8601 UTC; and
- a finite numeric value.

The parser intentionally does not support quoted fields, escaped commas, alternate column order,
or other RFC 4180 features.

## Options

- `--min-score <n>` returns only signals with a score at least `n`; the default is `0`.
- `--threshold <n>` also detects an initial value at or above `n` and later upward crossings.
- `--window-hours <n>` also compares the latest value with the newest observation at or before the
  requested positive, finite hour window.

Options require finite numeric values and must be supplied in flag/value pairs. When repeated,
the last value wins.

## Scope

The CLI surface contains CSV analysis, consecutive percentage changes, optional upward threshold
crossings, optional windowed changes, score filtering, SQLite persistence, and JSON output. The
repository also contains GitHub and CoinGecko connectors, but those are private workspace
libraries and are not CLI commands.

## License

Apache-2.0. See `LICENSE` in this package.

## Repository

<https://github.com/internalforces/SignalHub>

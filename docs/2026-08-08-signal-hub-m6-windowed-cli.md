# Signal Hub M6 — Windowed Analysis CLI Integration

## Status

Completed on 2026-08-08 after approval by the project owner as TASK-024. This approval covers the public
`--window-hours` CLI option and a local `csv-to-signal@0.3.0` release candidate. It does not
authorize npm publication, connector CLI integration, scheduling, alerts, a REST API, schema
changes, or additional dependencies.

## Goal

Make the existing deterministic `WindowedChangeDetector` usable from the CSV CLI without changing
the default behavior:

```text
CSV -> existing percentage-change detector
    -> optional windowed-change detector (--window-hours)
    -> existing scoring, persistence, and JSON output
```

## Public CLI contract

```text
csv-to-signal analyze <file.csv> [--min-score <n>] [--threshold <n>] [--window-hours <n>]
```

- `--window-hours <n>` accepts a positive finite number of hours.
- When present, the CLI adds `WindowedChangeDetector(n * 60 * 60 * 1000)` alongside the default
  `PercentageChangeDetector` and any requested `ThresholdDetector`.
- Repeated flags retain the existing last-value-wins behavior.
- The default command, signal JSON shape, database schema, and storage location do not change.
- `0`, negative values, non-numeric values, missing values, and values whose millisecond conversion
  is not finite fail with the standard usage error.

## Deliverables

- CLI parsing and detector composition for `--window-hours`.
- Focused source-level and bundled-executable regression tests.
- English and Korean CLI documentation.
- Package metadata and local release verification aligned to `0.3.0`.
- Updated roadmap, architecture, decisions, task, project, and session records.

## Verification

- Focused CLI tests demonstrate a 24-hour window over irregular observations.
- Existing commands without `--window-hours` produce their previous behavior.
- Invalid window values fail visibly without creating a database.
- Workspace build, tests, typecheck, dependency audits, tarball inspection, isolated installation,
  and installed CLI execution pass.

Completion result: all nine workspaces build and typecheck, all 90 tests pass, full and production
audits report no known vulnerabilities, and the 8,906-byte four-file `csv-to-signal@0.3.0` tarball
installs and runs `--window-hours 24` in an isolated consumer. No tag or publication occurred.

## Not in TASK-024

- npm publication or Git tagging;
- a minimum-window-change CLI option;
- replacement or suppression of the default percentage-change detector;
- GitHub or CoinGecko CLI commands;
- changes to Core, Storage, shared contracts, signal JSON, or database schema;
- scheduling, alerts, explanations, REST APIs, dashboards, or LLM integration.

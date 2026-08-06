<!--
Purpose:        System design decisions and architecture structure
Owner:          Architect
Update Trigger: New component added, design decision changed, dependency structure changed
Harness Version: 1.1
-->

# Architecture — Signal Hub

_Last updated: 2026-08-06_

## System Overview

A CLI-based system built to achieve: a minimal, deterministic time-series → signal transformation engine (`CSV → Core → Detector → Signal → CLI`).

**Pattern**: Layered monorepo, strict one-directional package dependencies, Repository pattern for storage access. No event bus, no distributed execution, no ML — rule-based detectors only, by explicit design-review decision (see `memory/decisions.md` ADR-002).

## Component Structure

```
signal-hub/
├── apps/cli/                 # csv-to-signal analyze <file> — the only user-facing interface
├── packages/
│   ├── types/                # DataPoint, Signal, Detector, Connector interfaces (the shared contract)
│   ├── connector-sdk/        # isValidDataPoint() + re-exported Connector/DataPoint
│   ├── storage/               # SqliteStorage: DataPointRepository, SignalRepository
│   ├── analysis/              # PercentageChangeDetector, ThresholdDetector, WindowedChangeDetector, scoreSignals
│   └── core/                  # runPipeline(), formatSignals() — the orchestration layer
└── connectors/
    ├── csv/                   # CsvConnector: raw CSV rows → DataPoint[]
    ├── github/                # GitHubConnector: commit records → daily commit-count DataPoint[]
    └── coingecko/             # CoinGeckoConnector: market-chart prices → DataPoint[]
```

## Data Flow

```
CSV file, GitHub commits endpoint, or CoinGecko market chart
  → connector.fetch()                  (raw input → DataPoint[], ISO 8601 UTC timestamps)
  → isValidDataPoint() filter       (connector-sdk; drops malformed points)
  → SqliteStorage.dataPoints        (insert + dedupe by `${metricId}::${timestamp}`)
  → per metric: Detector.detect()   (percentage, threshold, or windowed change — stateless)
  → scoreSignals()                  (score = clamp(round(abs(changePercent) * 2), 0, 100); deterministic signal IDs)
  → filter by minScore, sort desc
  → SqliteStorage.signals           (persist)
  → formatSignals()                 (pretty JSON)
  → CLI stdout
```

## Design Decision Summary

> See `memory/decisions.md` for full details

| Decision | Choice | Date |
|----------|--------|------|
| Harness adoption | AI Development Harness v1.1, Standard tier | 2026-07-27 |
| MVP scope | Vertical slice only: CSV connector + 2 rule-based detectors + CLI; everything else deferred | 2026-07-27 |
| Monorepo tooling | pnpm workspaces + Turborepo + per-package `tsc` (no bundler) | 2026-07-27 |
| GitHub connector | Serial paginated commit ingestion with UTC-day aggregation and transient diagnostics | 2026-07-30 |
| Focused M3 | CoinGecko connector library only; no CLI, Core, Storage, or schema changes | 2026-08-04 |
| Focused M4 | Deterministic windowed detector library only; no CLI, Core, Storage, or schema changes | 2026-08-05 |
| CLI release topology | Publish one bundled CLI artifact; keep internal workspaces private and `better-sqlite3` external | 2026-08-06 |

## Architecture Constraints

- `connectors/*` may import only `connector-sdk` and `types` — never `core`
- `storage` may import only `types` — never `analysis`
- Only `core` may import `storage`, `analysis`, and `connector-sdk` together
- `apps/cli` may import `core`, `connectors/csv`, `analysis`, `storage`, and `types` to compose a pipeline, but it must not contain pipeline logic
- Detectors are stateless: `detect(series: DataPoint[]): Signal[]`, no side effects, no I/O
- Signal IDs are derived deterministically from detector configuration and signal inputs, so repeated analysis is stable and persisted signals are idempotent
- All persisted state lives in one SQLite file (`data.db`); no other storage mechanism is permitted in the MVP
- Timestamps are always ISO 8601 UTC strings by the time they reach `DataPoint`

## Release Packaging Boundary

The source workspace dependency direction remains unchanged. For npm distribution only, the CLI
bundles the JavaScript reached through `analysis`, `connector-csv`, `core`, `storage`,
`connector-sdk`, and `types`. Those workspaces remain private build/test dependencies and are not
registry runtime dependencies. `better-sqlite3` stays external because it is a native module and is
declared directly by the CLI package.

The release tarball allowlist is `dist/index.js`, `package.json`, `README.md`, and `LICENSE`.
Packaging must never include SQLite databases, source, tests, caches, logs, configuration, or
environment files. This distribution boundary does not change package ownership or the runtime
layering enforced in source.

## DEFER List (explicit — see design review §1.1/§1.2)

Do not implement without a new plan and human approval:

- Detectors: spike, anomaly, trend classification, change-point detection (ML-like — deferred)
- Connectors: Polymarket and generic REST
- `config` package: YAML config loader + env interpolation (deferred until a 2nd data source exists)
- Dashboard, alert system, marketplace, MCP server, distributed/multi-node scheduling
- Multi-provider LLM explanation (MVP explanation, if ever added, is template-only)

The CoinGecko connector was separately planned and approved as TASK-017. That approval does not
extend to CLI integration, persistence changes, or the remaining deferred connectors.

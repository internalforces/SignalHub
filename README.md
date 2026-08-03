# Signal Hub

A minimal, deterministic time-series to signal transformation engine.

```text
CSV -> Core -> Detector -> Signal -> CLI
```

## Quick start

```bash
pnpm install
pnpm build
node apps/cli/dist/index.js analyze data.csv
```

The command expects `data.csv` to be relative to the repository root. It must have a
`metricId,timestamp,value` header.

See [`docs/2026-07-27-signal-hub-mvp.md`](docs/2026-07-27-signal-hub-mvp.md) for the implementation plan.

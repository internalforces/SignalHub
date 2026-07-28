# Signal Hub

A minimal, deterministic time-series to signal transformation engine.

```text
CSV -> Core -> Detector -> Signal -> CLI
```

## Quick start

```bash
pnpm install
pnpm build
pnpm --filter signal-hub exec signal-hub analyze data.csv
```

See [`docs/2026-07-27-signal-hub-mvp.md`](docs/2026-07-27-signal-hub-mvp.md) for the implementation plan.

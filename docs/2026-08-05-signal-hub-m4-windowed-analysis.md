# Signal Hub M4 — Deterministic Windowed Analysis

## Status

Completed on 2026-08-05 with project-owner approval.

## Goal

Add one `WindowedChangeDetector` to `@signal-hub/analysis` for deterministic 24-hour,
7-day, or caller-defined change detection over irregularly spaced data.

## Behavior

- Use the latest point in the series as the current value.
- Set the boundary to `current.timestamp - windowMs`.
- Use the newest point at or before that boundary as the reference value.
- Return no signal when history is insufficient, the reference value is zero, the change is
  zero, or the change is below the configured minimum.
- Return at most one signal per call.
- Never use the wall clock; equal inputs and configuration must produce the same signal ID.
- Reuse the existing `Signal` shape and scoring behavior.

## Public API

```typescript
new WindowedChangeDetector(windowMs, minChangePercent?)
```

- `windowMs` must be a positive finite number of milliseconds.
- `minChangePercent` defaults to `0` and must be a non-negative finite number.
- The detector is exported from `@signal-hub/analysis`; Core and CLI composition are unchanged.

## Deliverables

- `WindowedChangeDetector`, package export, and focused tests in `packages/analysis`;
- documentation and task records updated for M4; and
- root build, test, and typecheck passing.

## Not in M4

- scheduler, checkpoints, caching, retries, rate-limit handling, or cooldowns;
- Core, CLI, connector, storage, or database-schema changes;
- YAML configuration, external dependencies, deployment, or npm publishing; and
- changes to the existing public `DataPoint`, `Signal`, `Detector`, or `Connector` shapes.

The project owner's 2026-08-05 instruction to perform M4 authorized only the scope above.

## Verification

- `pnpm build`: 9 packages passed.
- `pnpm test`: 84 tests passed, including 17 focused windowed-analysis tests.
- `pnpm typecheck`: 9 packages passed.

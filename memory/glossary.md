<!--
Purpose:        Project-specific terms and abbreviations
Owner:          All agents (contribute), Documenter (maintain)
Update Trigger: New domain term introduced, existing term meaning changed
Harness Version: 1.1
-->

# Glossary — Signal Hub

_Last updated: 2026-07-27_

## Domain Terms

| Term | Definition |
|------|-----------|
| DataPoint | The canonical shape a connector produces: `{ metricId, timestamp, value }`. Timestamps are always ISO 8601 UTC. |
| Signal | The output of a detector: `{ id, metricId, type, score, direction, timestamp, value, changePercent }`. Simplified shape — no `confidence`/`baseline` fields in the MVP. |
| Detector | A stateless class implementing `detect(series: DataPoint[]): Signal[]`. MVP ships `PercentageChangeDetector` and `ThresholdDetector`. |
| Connector | A class implementing `fetch(): Promise<DataPoint[]>` that maps a raw external source (CSV file, API, etc.) into `DataPoint[]`. MVP ships `CsvConnector` only. |
| Vertical Slice | The minimal end-to-end path proving the system works: `CSV → Core → Detector → Signal → CLI`, as opposed to building out every connector/detector before anything runs end-to-end. |
| Repository (pattern) | `DataPointRepository` / `SignalRepository` — the only interfaces allowed to talk to SQLite directly, owned by `@signal-hub/storage`. |
| DEFER list | The explicit list (in `memory/architecture.md`) of features flagged as overengineering risk in the design review and deliberately excluded from the MVP. |

## Abbreviations

| Abbr | Full Form | Description |
|------|-----------|-------------|
| ADR | Architecture Decision Record | Log of technical decisions |
| MVP | Minimum Viable Product | Smallest shippable version — here, the Phase 1 vertical slice |
| Gate | Human Approval Gate | Checkpoint requiring user approval |

## Harness Terms

| Term | Definition |
|------|-----------|
| Harness | The full AI development OS document structure (this directory) |
| Session | A single agent work unit |
| Active Task | A task currently in `tasks/active.md` |
| Registry | The list of active agent roles |

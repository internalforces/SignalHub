<!--
Purpose:        Reusable code/algorithms identified in prior project internalforces/Future-Signal, mapped to Signal Hub packages
Owner:          Architect / Researcher
Update Trigger: New reusable code found in Future-Signal, a candidate gets ported, a candidate is rejected
Harness Version: 1.1
-->

# Reuse Candidates — internalforces/Future-Signal → Signal Hub

_Last updated: 2026-08-05_

## Source

- Repo: https://github.com/internalforces/Future-Signal ("Outlook AI Signals" — a Polymarket
  expectation-monitoring dashboard). Same author's prior project (per user, 2026-07-27) — no
  separate license file in the repo; treated as internal prior work, not third-party code.
- Stack: Python 3.11 / FastAPI / SQLAlchemy / PostgreSQL backend, React/Vite/TypeScript frontend.
  **Different language from Signal Hub (TypeScript)** — nothing here is a drop-in copy-paste.
  Every candidate below is a **port**: re-implement the algorithm/pattern in TypeScript against
  Signal Hub's own types (`DataPoint`, `Signal`, `Detector`, `Connector`), not a file copy.
- Cloned read-only for inspection to `/private/tmp/.../scratchpad/Future-Signal` (session scratchpad,
  not checked into Signal Hub). Re-clone if you need to re-read source lines cited below.

## How to Use This Document

Before implementing anything in `packages/analysis`, `connectors/*`, or `packages/storage`
beyond the MVP (Tasks 1-10 in `docs/2026-07-27-signal-hub-mvp.md`), check
whether Future-Signal already solved the same problem. Cite the source file/function in the
commit message and in `memory/decisions.md` when a candidate is actually ported.

---

## High-Value Candidates (port these first)

### 1. Threshold detection with cooldown + no-fabrication guard
- **Source**: `backend/app/core/signal_detection.py` — `build_expectation_shift_signal`,
  `is_in_cooldown`, `detect_signals_for_run`
- **Maps to**: `packages/analysis` — `ThresholdDetector` (Task 6) and any future detector
- **What's reusable**: two behaviors Signal Hub's MVP `ThresholdDetector` does **not** have yet:
  1. **No-fabrication guard**: skip evaluation entirely when the input data is insufficient
     (`confidence_level == "insufficient_data"` / `change_24h is None`), rather than computing
     a signal off partial data. Signal Hub's `isValidDataPoint` covers point-level validity but
     has no equivalent "not enough history yet" guard at the detector level.
  2. **Cooldown**: a market/metric fires a given signal type **at most once per rolling window**
     (24h here), checked via `IssueSignal.triggered_at >= now - cooldown`. Signal Hub's MVP
     `ThresholdDetector` (Task 6) already has an edge-crossing rule (fires only on the
     below→above transition) which achieves something similar for a single batch run, but has
     no time-based cooldown across multiple pipeline runs against the same growing series —
     relevant once Signal Hub ingests the same CSV/connector repeatedly over time (M2+).
- **Port target**: not needed for M1 (single-run CLI). Revisit for M2 (GitHub connector, which
  will be polled repeatedly) — add a cooldown parameter to detectors or to `runPipeline`.

### 2. Windowed change calculation (nearest-snapshot-at-or-before boundary)
- **Status**: Ported to `WindowedChangeDetector` in TASK-014 on 2026-08-05.
- **Source**: `backend/app/core/snapshot_metrics.py` — `compute_change_for_window`
- **Maps to**: `packages/analysis` — a generalization of `PercentageChangeDetector` (Task 5)
- **What's reusable**: Signal Hub's MVP `PercentageChangeDetector` only compares **consecutive**
  points in the series. Future-Signal's `compute_change_for_window` instead finds the snapshot
  closest to (but not after) `now - window` and diffs against *that* — giving true "24h change"
  / "7d change" regardless of how irregularly data arrives. Directly portable algorithm:
  ```
  boundary = now - window
  candidates = history.filter(s => s.timestamp <= boundary)
  reference = max(candidates, by timestamp)   // most recent one still before the boundary
  return reference ? current.value - reference.value : null   // null, never a guessed number
  ```
- **Port result**: added as a separate `WindowedChangeDetector` with an explicit millisecond
  window and optional minimum change. It remains a stateless analysis-library feature; Core and
  CLI composition were deliberately unchanged.

### 3. Confidence level / heat score composite scoring
- **Source**: `backend/app/core/snapshot_metrics.py` — `compute_confidence_level`,
  `compute_heat_score`
- **Maps to**: `packages/analysis` — `scoreSignals` (Task 7)
- **What's reusable**: the *shape* of a richer scoring model than Signal Hub's MVP
  `score = clamp(round(abs(changePercent) * 2), 0, 100)`:
  - A **confidence tier** independent of score (`insufficient_data` /
    `caution_low_activity` / `caution_high_volatility` / `sufficient`) — flags *why* a score
    should be trusted less, rather than folding that into the number itself.
  - A **bounded composite** (`|change| * weight + volume_boost`, capped at 100) — same spirit
    as Signal Hub's clamp-to-100 formula, but blends a second factor (volume) instead of using
    change alone.
- **Port target**: this is exactly the `confidence`/`baseline` fields the design review cut
  from the MVP `Signal` type (see `docs/2026-07-27-signal-hub-mvp.md`
  "Extended fields can be added later"). When that's revisited, this file is the concrete
  reference implementation to port from — don't redesign from scratch.

### 4. Batch insert with per-row fallback
- **Source**: `backend/app/core/snapshot_metrics.py` — `insert_rows_with_fallback`
- **Maps to**: `packages/storage` — `SqliteStorage.dataPoints.insertMany` /
  `signals.insertMany` (Task 4)
- **What's reusable**: Signal Hub's MVP wraps the whole batch in one SQLite transaction
  (all rows succeed or the transaction throws — Task 4's `db.transaction(...)`). Future-Signal's
  pattern instead retries the whole batch once, then falls back to inserting rows individually
  (retrying each once) so **one malformed row can't block the rest of the run**. Flagged here,
  not filed as a bug — Signal Hub's MVP CSV connector already validates+throws before storage
  (`isValidDataPoint`, `CsvConnector`'s line-numbered errors) so this gap is lower-severity than
  it would be for a connector that can't pre-validate everything (e.g. a live API).
- **Port target**: reconsider once a connector exists that can partially fail per-row after
  validation (GitHub API pagination errors, rate limits mid-fetch — M2+).

### 5. Connector normalization with skip-reason auditability
- **Source**: `backend/app/core/collector.py` — `normalize_event`, `build_market_candidate`,
  `skip_record`, `fetch_events` (writes `skipped_records.json` alongside the accepted samples)
- **Maps to**: `connectors/*` — pattern for any connector beyond `CsvConnector` (Task 8)
- **What's reusable**: Signal Hub's MVP `CsvConnector` **throws on the first malformed row**
  (fail-fast, appropriate for a static, expected-well-formed local file — see
  `docs/2026-07-27-signal-hub-mvp.md` Task 8). Future-Signal's collector
  instead **skips** malformed/excluded records one at a time, collects a typed reason for each
  skip (`skip_record(event_id, reason, **details)`), and writes the full skip list to a
  side-channel file for later audit — appropriate for a live external API where some fraction
  of records are always going to be unusable and failing the whole fetch would be wrong.
- **Port target**: GitHub/CoinGecko/Polymarket connectors (M2/M3) should use the skip-and-log
  pattern, not the throw-fast pattern — cite this file when designing those.

---

## Direct Reference Implementation (Phase 3 — Polymarket connector)

### 6. Polymarket Gamma API connector
- **Source**: `backend/app/core/collector.py` — `fetch_events`, `normalize_event`,
  `build_market_candidate`, `build_resolution_rules`, plus the field-extraction helpers
  (`first_float`, `parse_json_list`, `parse_source_date`)
- **Maps to**: the deferred Polymarket connector (`roadmap.md` M3, design review Phase 3)
- **What's reusable**: this *is* a working Polymarket Gamma API (`gamma-api.polymarket.com`)
  client with real-world edge-case handling already worked out — binary-outcome filtering,
  closed/inactive market exclusion, missing-field rejection, volume/liquidity key fallback
  lists (the API inconsistently names these fields across responses). When Signal Hub builds
  its Polymarket connector, port this logic directly (paginated fetch → per-market validation
  → `DataPoint`-shaped output) rather than re-deriving the Gamma API's quirks from scratch.
- **Port target**: M3, not before. Needs a design pass first since Future-Signal's `DataPoint`
  equivalent (the `sample` dict in `normalize_event`) carries many fields Signal Hub's
  `DataPoint` doesn't have (category, resolution rules, etc.) — decide what collapses into
  `DataPoint.value` vs. gets dropped.

---

## Explicitly Not Reusable (out of scope for Signal Hub)

| Future-Signal component | Why it's excluded |
|---|---|
| `ai_report*.py`, `context_research*.py`, `context_verification.py`, `context_policy_v7.py`, `on_demand_*.py`, `scenario_*.py` | LLM-based briefing/scenario generation — Signal Hub's design review explicitly defers any LLM explainer to Phase 5+ (template-only explanation, if any, in the MVP) and states the project is "not an AI system" |
| `frontend/` (React dashboard) | Signal Hub's MVP is CLI-only; no UI in scope (design review Phase 4+) |
| `category_taxonomy.py` | Category classification is specific to Polymarket's tag taxonomy; not applicable to CSV/GitHub data |
| PostgreSQL-specific schema (JSONB, append-only multi-table design in `db/models.py`) | Signal Hub's MVP uses SQLite with a deliberately simpler 2-table schema (`data_points`, `signals`) — see ADR-003. The richer `Market`/`MarketSnapshot`/`MarketMetric`/`IssueSignal` split is a useful *reference* (see Candidate #2/#3 above) but not a schema to copy wholesale |
| `deploy/` (Docker Compose, Caddy) | No infrastructure decided yet for Signal Hub (`tech-stack.md` — npm publish only, not deployed) |

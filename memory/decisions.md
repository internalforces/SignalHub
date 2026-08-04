<!--
Purpose:        Key technical decision history in ADR format
Owner:          Architect / Researcher
Update Trigger: Record immediately after any significant technical decision
Harness Version: 1.1
-->

# Decision Log — Signal Hub

_Last updated: 2026-08-04_

## Template

```
### ADR-NNN: [Decision Title]
- **Date**: YYYY-MM-DD
- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Decided by**: [Role / User]

**Context**: Why was this decision needed?
**Decision**: What was chosen?
**Rationale**: Why was this chosen?
**Trade-offs**: What are the downsides?
**Consequences**: What changed as a result?
```

---

### ADR-001: AI Development Harness v1.1 Adoption

- **Date**: 2026-07-27
- **Status**: Accepted
- **Decided by**: User

**Context**: Consistent context delivery and task tracking were needed for AI-assisted development.
**Decision**: Adopt AI Development Harness v1.1 (Standard tier) to structure agent roles, workflows, and memory.
**Rationale**: Eliminates context loss between sessions; structures multi-agent collaboration.
**Trade-offs**: Upfront documentation cost.
**Consequences**: All agents operate from a shared, consistent context.

---

### ADR-002: MVP Scope — Vertical Slice Only

- **Date**: 2026-07-27
- **Status**: Accepted
- **Decided by**: User (design review), formalized into `docs/superpowers/plans/2026-07-27-signal-hub-mvp.md`

**Context**: The original design draft listed 5 connectors (CSV, GitHub, CoinGecko, Polymarket, REST) and 7 detector types (spike, anomaly, trend, volatility, change point, activity, threshold) as MVP — a design review flagged this as overengineering that would delay core-engine validation.
**Decision**: MVP ships only the CSV connector, `percentage-change` and `threshold` detectors, and a CLI. GitHub is Phase 2; CoinGecko/Polymarket/REST are Phase 3; scheduler/REST API/LLM explainer/alerts/dashboard/marketplace/MCP server are Phase 4+.
**Rationale**: A single vertical slice (`CSV → Core → Detector → Signal → CLI`) proves the core engine works before multiplying connector/detector surface area. Change-point detection, advanced anomaly detection, and trend classification are ML-like problems that don't belong in a rule-based MVP.
**Trade-offs**: Real-world validation (e.g. against GitHub's noisier data) is delayed to M2.
**Consequences**: `memory/architecture.md`'s DEFER list is binding — any agent proposing to implement a deferred item must raise it here first, and it requires HUMAN APPROVAL per `AGENTS.md`.

---

### ADR-003: Monorepo Tooling — pnpm + Turborepo, No Bundler

- **Date**: 2026-07-27
- **Status**: Accepted
- **Decided by**: Architect (during plan authoring)

**Context**: Signal Hub's packages depend on each other (`core` depends on `storage`, `analysis`, `connector-sdk`) and need a build order plus fast test iteration.
**Decision**: Use pnpm workspaces for package linking, Turborepo (`dependsOn: ["^build"]`) for build/test ordering, and plain per-package `tsc -p tsconfig.json` for compilation — no esbuild/tsup/webpack bundler.
**Rationale**: TS project references / bundlers add configuration surface the MVP doesn't need; `tsc` per package plus workspace symlinks resolving through each package's `main`/`types` fields is the simplest thing that works, and Turborepo's `^build` dependency graph gives correct ordering for free.
**Trade-offs**: Cross-package test runs require dependencies to be built first (`pnpm -r build` before `pnpm --filter core test`), since Vitest resolves workspace imports through built `dist/` output, not raw `src/`.
**Consequences**: Every task in the implementation plan that imports another workspace package includes an explicit "ensure workspace dependencies are built" step before running its tests.

---

### ADR-004: Mine `internalforces/Future-Signal` for Reusable Engine Logic

- **Date**: 2026-07-27
- **Status**: Accepted
- **Decided by**: User

**Context**: The user built a prior project, `internalforces/Future-Signal` ("Outlook AI Signals" —
a Polymarket expectation-monitoring dashboard, Python/FastAPI backend), and asked to port
reusable code from it into Signal Hub, with findings documented so future work can find them.
**Decision**: Clone and survey Future-Signal read-only; record every reusable algorithm/pattern
(not raw code — different language) in `memory/reuse-candidates.md`, mapped to the specific
Signal Hub package/task it applies to, with an explicit "port target" milestone. Do not port
anything into M1 — the MVP plan (Tasks 1-10) is already fully specified and scoped; candidates
apply to M2+.
**Rationale**: Future-Signal already solved several problems Signal Hub will hit again — windowed
change calculation, threshold detection with cooldown, confidence/heat scoring, resilient batch
inserts, and skip-reason-audited connector normalization — plus it's a working reference
implementation for the deferred Polymarket connector (Gamma API quirks already handled).
Documenting *now*, before those tasks are planned, means the design work doesn't get redone from
scratch later.
**Trade-offs**: None of this is portable as literal code — Future-Signal is Python/SQLAlchemy/
PostgreSQL, Signal Hub is TypeScript/better-sqlite3. Every candidate needs a genuine reimplementation,
not a copy-paste; `reuse-candidates.md` should not be read as "code that will just work."
**Consequences**: `AGENTS.md`'s Context Loading Order now includes `memory/reuse-candidates.md`
for M2+ work; `tasks/backlog.md` TASK-011 (GitHub connector) and future Polymarket/CoinGecko
connector tasks should cite the relevant candidate before design starts.

---

### ADR-005: Deterministic Signal Identity

- **Date**: 2026-07-29
- **Status**: Accepted
- **Decided by**: Implementer, addressing PR #1 review findings

**Context**: Random signal IDs made equal input produce different CLI output and prevented SQLite's primary-key deduplication from suppressing repeated signal persistence.
**Decision**: Derive each signal ID from its detector configuration and signal inputs. Percentage-change signals use detector ID, metric, timestamp, value, and change; threshold signals additionally include the threshold.
**Rationale**: The project goal requires deterministic transformation, and stable IDs make repeated analysis idempotent without changing the database schema.
**Trade-offs**: IDs are descriptive serialized strings rather than opaque UUIDs.
**Consequences**: Detectors must not generate random IDs; tests cover repeatability and duplicate-persistence prevention.

---

### ADR-006: M2 GitHub Commit Connector

- **Date**: 2026-07-30
- **Status**: Accepted
- **Decided by**: User (implementation approval)

**Context**: M2 needs to validate the deterministic pipeline with public GitHub data, without changing the shared contracts, SQLite schema, or CLI surface.
**Decision**: Add `@signal-hub/connector-github`, using Node's built-in `fetch` to retrieve commit pages serially through GitHub's `Link` headers. Normalize valid `commit.committer.date` values into UTC-day commit counts, sort them ascending, and retain malformed-record IDs/reasons only in transient diagnostics.
**Rationale**: One point per day avoids the storage key collision caused by multiple commits at the same timestamp while preserving deterministic inputs for the existing detectors.
**Trade-offs**: The connector is not exposed through the CLI yet; it has no persisted ETag, retry, or cooldown state.
**Consequences**: The connector imports only `connector-sdk` and `types`; public-repository use is token-free, while a caller may supply a private-repository token directly to the constructor.

---

### ADR-007: CLI Composition Dependencies

- **Date**: 2026-08-03
- **Status**: Accepted
- **Decided by**: User (ISS-005 resolution approval)

**Context**: The MVP plan's architecture summary described the CLI as depending only on Core, while Task 10 and the implemented CLI directly construct the CSV connector, SQLite storage, and detectors. This left the documented dependency graph inconsistent with the intended composition root.
**Decision**: The CLI may directly depend on `core`, `connectors/csv`, `analysis`, `storage`, and `types` to compose a pipeline. It must delegate pipeline execution to Core and must not contain pipeline logic.
**Rationale**: The composition root needs concrete connector, detector, and storage instances; requiring a Core API refactor merely to hide those dependencies would enlarge the public API without improving the current design.
**Trade-offs**: The CLI package has a wider direct dependency set, so reviews must continue to ensure it does not absorb Core responsibilities.
**Consequences**: The MVP plan, project summary, and architecture constraints all record the same dependency direction. No source-code or public-interface change is required.

---

### ADR-008: M3 Pre-Approval Contract Safeguards

- **Date**: 2026-08-04
- **Status**: Proposed
- **Decided by**: PR #6 review remediation; pending human M3 approval

**Context**: The proposed M3 multi-source configuration and CLI contracts were incomplete around source identity, authorization interpolation, open buckets, failure behavior, provider history semantics, redirect safety, signal identity, storage isolation, bounded input, and early-failure cases identified in PR #6 review.
**Decision**: Isolate M3 persistence in its own fixed SQLite file and use an opaque per-source storage metric namespace that includes a canonical provider-identity digest while preserving configured metric IDs only in public output; allow shared display metric IDs but require unique source IDs and retain their history across display-metric renames; bound every source's detector input to its configured `historyDays` plus only the immediate preceding point as threshold context, filter signals to the horizon, and require a new source ID for horizon increases; reject revised values as `historical_conflict` and late backfills as `late_backfill`; allow whole-value interpolation only in request headers; require dataset-selecting headers to be declared and included only in the hashed identity; reject empty source lists, duplicate YAML mapping keys, YAML over 1 MiB, and YAML aliases; treat unbucketed duplicate timestamps as source failures; require every provider contract to define deterministic post-normalization duplicate handling before Core; include a bucket that ends exactly at the injected current time; permit only manually validated same-origin redirects; make generic REST single-response-only, explicit-offset RFC 3339-only, finite-JSON-number-only, and bounded to 5 MiB/10,000 records; apply a 15-second abort deadline to every HTTP hop and response stream; project public signal IDs with the unique source ID plus every detector-configuration tuple item while replacing the private metric tuple item; publish an exact grouped JSON contract for complete, partial, and all failed outcomes; make each source pipeline atomic; and make reviewed, human-approved Polymarket and CoinGecko contracts prerequisites to wider M3 approval.
**Rationale**: These rules prevent history from differently targeted source configurations being combined, prevent rolling-window threshold false positives, bound resource use and detection input, prevent stale or silently replaced values and contradictory signals, avoid public signal-ID collisions between sources sharing a display metric ID, protect credentials from cross-origin redirects, and ensure connector behavior and every JSON outcome are approved before implementation.
**Trade-offs**: M3 planning has two additional approval tasks, introduces a second local database file plus a storage-namespace/output projection layer, range-bounded reads with one predecessor lookup, and per-source transactions, makes public signal IDs source-scoped, rejects provider corrections, late backfills, and in-place horizon increases pending a separately approved reconciliation policy, limits generic REST to a single bounded response, restricts YAML features, and intentionally uses explicit partial completion rather than a run-wide transaction.
**Consequences**: No implementation is authorized. TASK-M3-0, TASK-M3-0b, and TASK-M3-1 must be approved before any deferred M3 connector, configuration, or CLI work begins; configuration, selection, and usage errors must persist nothing and emit only redacted failure classifications.

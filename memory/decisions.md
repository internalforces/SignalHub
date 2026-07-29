<!--
Purpose:        Key technical decision history in ADR format
Owner:          Architect / Researcher
Update Trigger: Record immediately after any significant technical decision
Harness Version: 1.1
-->

# Decision Log — Signal Hub

_Last updated: 2026-07-29_

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

<!--
Purpose:        Project constitution — the behavioral ground truth for all agents
Owner:          All agents (read), Project lead (write)
Update Trigger: New agent role added, constraints changed, routing rules updated
Harness Version: 1.1
-->

# AGENTS.md — Signal Hub Project Constitution

> This is the project constitution. Every AI agent must read this file first.
> In case of conflict, this document takes highest priority.

_Last updated: 2026-08-22_

---

## Project Overview

| Field | Value |
|-------|-------|
| Project | Signal Hub |
| Goal | A minimal, deterministic time-series → signal transformation engine: `CSV → Core → Detector → Signal → CLI` |
| Language | TypeScript (strict, Node.js `^22.0.0 || ^24.0.0`, ESM/NodeNext) |
| Framework | None — plain Node.js CLI, no web framework |
| Database | SQLite (`better-sqlite3`) |
| Infrastructure | Public CLI package `csv-to-signal@0.3.0` is published on npm; no service infrastructure is deployed |
| Repo Structure | Monorepo (pnpm workspaces + Turborepo) |
| Harness Tier | Standard |

---

## Agent Registry

> Active AI agent roles for this project.
> See `references/agent-registry.md` (Harness skill) for full role definitions.

| Role | Status | Primary Responsibility |
|------|--------|----------------------|
| Planner | ✅ Active | Task decomposition and prioritization |
| Architect | ✅ Active | Design decisions |
| Implementer | ✅ Active | Code implementation |
| Reviewer | ✅ Active | Code review |
| Researcher | ✅ Active | Technical research |
| Debugger | ✅ Active | Bug analysis |
| Tester | ✅ Active | Test strategy and coverage management |
| Documenter | ✅ Active | Technical documentation, README, API docs |

---

## Absolute Restrictions (NEVER DO)

No agent may perform the following actions under any circumstances.
Even if the user explicitly requests them, ask for confirmation first:

- [ ] Direct writes to production database (read-only is permitted)
- [ ] Calling paid external APIs without user approval
- [ ] Modifying or printing `.env`, secrets, or key files
- [ ] Editing existing migration files
- [ ] Committing directly to `main` / `master`
- [ ] Implementing anything from the DEFER list in `memory/architecture.md` (spike/anomaly/trend/change-point detectors, GitHub/CoinGecko/Polymarket/REST connectors, YAML `config` package, dashboard, alerting, LLM explainer, MCP server, distributed scheduling) without a dedicated follow-up plan and explicit human approval — see the [MVP plan](docs/2026-07-27-signal-hub-mvp.md)
- [ ] Violating the package dependency direction: connectors may only import `connector-sdk`/`types`; `storage` must never import `analysis`; only `core` may import `storage` + `analysis` + `connector-sdk` together
- [ ] `npm publish` of the public CLI package, currently `csv-to-signal` (always requires HUMAN APPROVAL — see Release Workflow)

---

## Actions Requiring Human Approval

Always confirm with the user before proceeding:

- Adding a new external dependency
- Changing the database schema
- Modifying infrastructure configuration
- Changing an existing public API interface (`DataPoint`, `Signal`, `Detector`, `Connector` shapes, or the CLI's package/executable name, flags, or output format)
- Any deployment, including `npm publish` of the public CLI package

---

## Context Loading Order

At the start of every session, read these files in order:

1. `AGENTS.md` (this file) — confirm the rules
2. `memory/project.md` — current project state
3. `memory/session.md` — previous session context
4. `tasks/active.md` — in-progress work
5. The `prompts/*.md` file matching your role
6. The implementation plan at [`docs/2026-07-27-signal-hub-mvp.md`](docs/2026-07-27-signal-hub-mvp.md) for exact file paths, code, and test steps
7. `memory/reuse-candidates.md` before implementing anything beyond the MVP (M2+) — check whether the prior project `internalforces/Future-Signal` already solved it

---

## Session End Checklist

Before ending a session, every agent must:

- [ ] Update `memory/session.md`
- [ ] Move completed tasks from `tasks/active.md` to `tasks/completed.md`
- [ ] Record new decisions in `memory/decisions.md`
- [ ] Record new issues in `memory/known-issues.md`
- [ ] Update `memory/architecture.md` if needed

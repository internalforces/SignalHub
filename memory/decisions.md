<!--
Purpose:        Key technical decision history in ADR format
Owner:          Architect / Researcher
Update Trigger: Record immediately after any significant technical decision
Harness Version: 1.1
-->

# Decision Log — Signal Hub

_Last updated: 2026-08-08_

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
- **Decided by**: User (design review), formalized into `docs/2026-07-27-signal-hub-mvp.md`

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

### ADR-008: Focus M3 on the CoinGecko Connector

- **Date**: 2026-08-04
- **Status**: Accepted
- **Decided by**: Project owner

**Context**: PR #6 attempted to specify three connectors, YAML configuration, a new CLI surface,
and new persistence semantics in one milestone. Repeated review expanded the plan without moving
the project toward executable validation.
**Decision**: M3 contains only `@signal-hub/connector-coingecko`. It uses the CoinGecko Demo
`market_chart` price series, adds no external dependency, and does not change the CLI, Core,
Storage, database schema, or shared contracts. Polymarket, generic REST, and YAML configuration
remain deferred behind separate plans and approvals.
**Rationale**: One connector is the smallest useful slice that validates another real external
time series while preserving the existing package and pipeline boundaries.
**Trade-offs**: M3 does not yet provide configuration-driven or CLI-accessible multi-source runs.
**Consequences**: TASK-017 is authorized. Its exact scope and completion criteria live in
`docs/2026-08-03-signal-hub-m3-v1-and-future-roadmap.md`.

---

### ADR-009: Approve the Vitest/Vite Security Upgrade

- **Date**: 2026-08-04
- **Status**: Accepted
- **Decided by**: Project owner

**Context**: The full dependency audit reports critical/high findings in the development-only
test stack. The lockfile currently resolves Vitest 2.1.9 and Vite 5.4.21; published fixes require
Vitest 3.2.6 or later and Vite 6.4.3 or later. Updating Vitest crosses a major version boundary and
therefore requires human approval under the dependency policy.

**Decision**: Authorize TASK-018 to update Vitest consistently across all workspace manifests and
refresh its transitive Vite/esbuild stack to compatible patched versions. The implementation must
retain Node.js 20 support and may not change production dependencies or public interfaces.

**Rationale**: The upgrade removes known test-tool vulnerabilities while keeping the change
isolated to development tooling.

**Trade-offs**: A major Vitest upgrade can change test-runner defaults or APIs, so the complete
workspace build, test, typecheck, frozen-install, and dependency-audit gates are mandatory.

**Consequences**: The dependency approval gate was satisfied and TASK-018 completed with Vitest
4.1.10, Vite 6.4.3, and esbuild 0.25.12. Node 20.19.5 and 22.22.3 validation, frozen
installation, build, 67 tests, typecheck, and both full and production audits pass, so ISS-009 is
resolved.

---

### ADR-010: Match the Advertised Node Range to Vitest 4 Support

- **Date**: 2026-08-05
- **Status**: Accepted
- **Decided by**: Project owner (PR #7 review resolution)

**Context**: The workspace upgraded to Vitest 4.1.10, whose published Node engine is
`^20.0.0 || ^22.0.0 || >=24.0.0`, while the root package continued to advertise `>=20`. That
broader range incorrectly included unsupported Node 21.x and 23.x installations.

**Decision**: Advertise `^20.0.0 || ^22.0.0 || >=24.0.0` as Signal Hub's Node engine range and
synchronize the project constitution, implementation guidance, plan, and dependency records.

**Rationale**: Package-engine declarations must not promise versions excluded by the test runner's
own engine constraint. The exact Vitest range retains the already validated Node 20 and 22 lines.

**Trade-offs**: Node 21.x and 23.x users must switch to a supported release line.

**Consequences**: Engine-enforcing installations reject unsupported odd-major versions before the
toolchain runs. No dependency, production behavior, database schema, or public CLI/API changes.

---

### ADR-011: Focus M4 on Deterministic Windowed Analysis

- **Date**: 2026-08-05
- **Status**: Accepted
- **Decided by**: Project owner

**Context**: Consecutive-point percentage changes do not represent fixed 24-hour or 7-day changes
when connector observations arrive at irregular intervals. Future-Signal already used the newest
snapshot at or before a time boundary to avoid fabricating missing history.

**Decision**: Add a separate `WindowedChangeDetector(windowMs, minChangePercent?)` to
`@signal-hub/analysis`. The latest series point defines both the current value and the boundary;
the newest same-metric point at or before that boundary is the reference. The detector returns at
most one signal and includes its configuration and selected inputs in a deterministic ID.

**Rationale**: A stateless detector is the smallest change that adds correct fixed-window analysis
without introducing wall-clock dependence, persistence state, or orchestration changes.

**Trade-offs**: Callers must supply sufficient history and compose the detector themselves; M4
does not expose it through Core defaults or the CLI.

**Consequences**: TASK-014 is complete. No shared type, database schema, dependency, connector,
Core, or CLI changes were made.

---

### ADR-012: Prioritize and Implement CLI Release Readiness Before New Product Surface

- **Date**: 2026-08-06
- **Status**: Accepted
- **Decided by**: Project owner

**Context**: M1 through M4 and TASK-021 are merged, but the CLI remains a private monorepo package.
A baseline pack assessment found that its version and metadata are not release-aligned, its tarball
contains local/development artifacts, and neither npm nor pnpm output installs independently.

**Decision**: Make M5 a focused TASK-022 CLI release-readiness milestone before starting proposed
consumption/explanation work. Package `signal-hub@0.2.0` as one Apache-2.0 bundle using approved
esbuild 0.25.12, with private workspace code bundled and `better-sqlite3` external. Validate Node
20/22/24 and stop at a locally verified tarball. The previous proposed consumption/explanation
milestone moves to M6.

**Rationale**: The implemented vertical slice should be reproducibly packageable before the project
adds more public surfaces. A local pack/install proof exposes release defects without deploying or
requiring registry credentials.

**Trade-offs**: Product expansion pauses while package topology, version, license, metadata, and
verification are settled. The recommended standalone bundle likely needs a new direct build
dependency and therefore separate human approval.

**Consequences**: TASK-022 is complete, ISS-013 is resolved, and the CLI is independently
installable from a strict four-file tarball. The root and internal libraries remain private.
`npm publish` remains separately prohibited without human approval.

---

### ADR-013: Authorize the Reviewed Public CLI 0.2.0 Release

- **Date**: 2026-08-06
- **Status**: Accepted
- **Decided by**: Project owner

**Context**: TASK-022 produced a verified Apache-2.0 release candidate, but publishing, pushing,
PR creation, tagging, and deployment remained separate approval gates.

**Decision**: Authorize pushing the release-readiness branch, opening its PR, creating and pushing
tag `v0.2.0`, and publicly publishing `signal-hub@0.2.0` after the exact release commit has passed
independent review, merged to `main`, and been revalidated. Registry credentials must not be
recorded or printed.

**Rationale**: The package has deterministic release checks and cross-version validation, while
retaining an independently reviewed merge as the source of truth prevents an unreviewed branch
commit from becoming a public release.

**Trade-offs**: Publication cannot finish in the current unauthenticated npm session, and the
repository's no-self-merge rule requires another reviewer before tagging.

**Consequences**: PR #10 is open and passes Node 20/22/24 CI. TASK-023 tracks the remaining
review, merge, npm authentication, tag, public publication, and registry verification steps.

---

### ADR-014: Rename the Public CLI Release to CSV to Signal 0.2.1

- **Date**: 2026-08-06
- **Status**: Accepted
- **Decided by**: Project owner

**Context**: The verified `signal-hub@0.2.0` candidate completed npm security-key authentication,
but npm rejected the unscoped name as too similar to existing `signalhub@4.9.0`. Registry E404 did
not establish that the name was publishable. The annotated `v0.2.0` tag already records the exact
rejected candidate at `09b0cc9`.

**Decision**: Use `csv-to-signal` as both the public npm package name and executable name. Prepare
version `0.2.1` and a future `v0.2.1` tag while preserving `v0.2.0`. Keep all private
`@signal-hub/*` workspace names, behavior, flags, output, schema, and dependency topology unchanged.

**Rationale**: `csv-to-signal` states the current public input and output directly, avoids coupling
the release to the rejected global name, and does not imply that private GitHub, CoinGecko, or
windowed-analysis workspaces are CLI features.

**Trade-offs**: The installed command changes before the first successful npm publication, and the
new identity requires another reviewed commit, tarball verification, tag, and final publication
approval.

**Consequences**: TASK-023 targets `csv-to-signal@0.2.1`. The existing `v0.2.0` tag must not be
moved or deleted. Publication remains prohibited until the exact merged candidate is presented and
explicitly approved.

---

### ADR-015: Publish CSV to Signal 0.2.1 from the Exact Reviewed Merge

- **Date**: 2026-08-06
- **Status**: Accepted and executed
- **Decided by**: Project owner

**Context**: PR #11 passed independent review and Node 20/22/24 CI, then merged as
`a3a00696d5526ea788199df2c1a3e1ce6a4217e3`. A clean release check reproduced the reviewed
four-file artifact, size 8,517 bytes and integrity
`sha512-2yy8IYlFEohj3KxTJuG7JcHTrkU4yh5QTPClJQNXBazQ3QnFNj2YtwyaaDdi1F5IfNZiqzjt7oEVoWK3V+Ustg==`.

**Decision**: After the owner explicitly approved this exact commit, tag, package, registry, size,
and integrity, create and push annotated tag `v0.2.1` and publish `csv-to-signal@0.2.1` publicly to
the npm registry with the `latest` dist-tag.

**Rationale**: Publishing only the exact reviewed merge preserves release provenance and ensures
the registry artifact matches the independently installed and executed candidate.

**Consequences**: `csv-to-signal@0.2.1` is public and `latest`. Registry integrity and a clean
consumer installation/execution match the approved artifact. TASK-023 and M5 are complete. The
immutable 0.2.1 README retains one pre-release sentence; ISS-018 tracks its correction in a future
separately approved version.

---

### ADR-016: Defer the ISS-018 README Correction to the Next Approved Patch

- **Date**: 2026-08-07
- **Status**: Accepted
- **Decided by**: Project owner

**Context**: The immutable npm package `csv-to-signal@0.2.1` contains one outdated sentence saying
publication has not occurred. The repository source README is already corrected, and the runtime,
CLI output, package integrity, and installation behavior are unaffected.

**Decision**: Include the corrected README in the next separately approved patch release. Do not
publish 0.2.2 immediately solely to replace this low-impact sentence.

**Rationale**: A new immutable registry version and full release workflow are disproportionate to
one documentation-only sentence when consumers can use the package normally and the source is
already correct.

**Consequences**: ISS-018 remains open and must be checked during the next patch release. GitHub
Release v0.2.1 discloses the known issue and the deferral; no npm version, tag, code, API, schema,
dependency, or runtime behavior changes as part of this decision.

---

### ADR-017: Expose Windowed Analysis Through One Additive CLI Option

- **Date**: 2026-08-08
- **Status**: Accepted and implemented
- **Decided by**: Project owner

**Context**: `WindowedChangeDetector` was implemented and tested in M4, but remained inaccessible
to users of the public CSV CLI. Network connector commands, APIs, alerts, and explanations would
introduce larger interfaces or side effects.

**Decision**: Make M6 a focused TASK-024 that adds `--window-hours <n>` to `csv-to-signal analyze`.
The option accepts a positive finite number, adds the existing detector beside the default
percentage detector and optional threshold detector, and preserves last-value-wins parsing. Prepare
an unpublished `0.3.0` candidate without changing Core, shared contracts, JSON, or the database.

**Rationale**: This exposes already verified deterministic functionality through the smallest
user-facing extension and preserves all existing default behavior.

**Trade-offs**: A run may emit both consecutive and windowed signals, and the CLI does not expose
the detector library's minimum-change constructor argument. The new flag requires a minor version
release before npm users can access it.

**Consequences**: TASK-024 is complete with 90 passing tests, typecheck, clear production/full
audits, and an independently installable four-file `csv-to-signal@0.3.0` candidate. No Git tag or
npm publication was authorized or performed. A newly disclosed development-only nanoid advisory
encountered during verification was resolved at patched version 3.3.17 and recorded as ISS-019.

---

### ADR-018: Publish CSV to Signal 0.3.0 from the Exact Reviewed Merge

- **Date**: 2026-08-08
- **Status**: Accepted and executed
- **Decided by**: Project owner

**Context**: TASK-024 was independently reviewed and merged through PR #14 as exact commit
`59ec92e37dbd11226391f8eef59965b6821f8023`. The project owner explicitly requested validation and
deployment of `0.3.0`. A complete release check reproduced an 8,906-byte four-file artifact with
shasum `871169642169e4504dbf60265f76aafb5b04d143` and integrity
`sha512-k1z2wk1Ub+9QE0yHLOv2iLBJCGLIhFnW7zTO1PcN4FNhTuvP0e0M5VSv7yA0CPZN3y7MGmy0nayMgR9JrExa6Q==`.

**Decision**: Tag the exact merge as `v0.3.0`, publish `csv-to-signal@0.3.0` to npm with the
`latest` dist-tag, verify the registry artifact in a clean consumer, and publish a stable GitHub
Release from the same tag.

**Rationale**: One reviewed commit, one verified artifact, and matching Git/npm release identities
preserve release provenance while making the approved windowed CLI feature available to users.

**Trade-offs**: npm publication and Git tags are immutable. The CLI still intentionally omits
network connector commands and all separately deferred service features.

**Consequences**: `csv-to-signal@0.3.0` is npm `latest`; its registry shasum and integrity match the
locally validated artifact. A clean consumer installed and executed `--window-hours 24`, created
its database outside the package, and found no packaged database file. GitHub Release `v0.3.0` is
the latest stable release. ISS-018 is resolved by the corrected README in this new version while
the historical `0.2.1` artifact remains unchanged.

<!--
Purpose:        Current session state — context handoff between agents
Owner:          Currently active agent
Update Trigger: Read at session start; must update before session ends
Harness Version: 1.1
-->

# Current Session — Signal Hub

## Session Info

- **Date**: 2026-08-17
- **Agent Role**: Implementer
- **Session Goal**: Resolve PR #16's Node 24 failure and align the public engine contract with review feedback.

## Previous Session Summary

TASK-025 and TASK-026 were implemented on `codex/security-ci-maintenance` and opened as PR #16.
Its Node 20 and 22 checks passed, while Node 24.19.0 aborted in better-sqlite3 11.10.0 native
statement cleanup after the built CLI completed windowed analysis.

## Current Work

- [x] Inspected PR #16 metadata, failed-check logs, and the exact Node 24 native assertion.
- [x] Confirmed Node 20 and 22 pass and isolated better-sqlite3 11.10.0 as the failing component.
- [x] Received explicit owner approval for the better-sqlite3 major upgrade.
- [x] Pinned better-sqlite3 12.9.0 in Storage and the public CLI, then refreshed the lockfile.
- [x] Updated the release-metadata regression test and dependency/project records.
- [x] Pushed the focused fix and confirmed all PR #16 checks pass on Node 20, 22, and 24.
- [x] Verified the unresolved review thread about unbounded Node 26+ support against package metadata.
- [x] Bounded current root, CLI, and documentation support to Node 20, 22, and 24 releases.
- [x] Committed and pushed the review fix, then confirmed the Node 20/22/24 PR matrix passes.

## Completed This Session

- [x] TASK-027 resolves the Node 24.19.0 native cleanup abort without changing schema or public API.
- [x] The release-manifest test was observed failing before the manifest change and passing after it.
- [x] A clean Node 24.19.0 installation builds the CLI and passes both built-CLI regression tests.
- [x] The complete release check passes with frozen install, nine builds, 90 tests, typecheck,
  full and production audits, package inspection, isolated installation, and installed execution.
- [x] better-sqlite3 remains the only external CLI runtime dependency.
- [x] TASK-028 resolves the public engine-range mismatch without changing CLI behavior or output.

## Issues Found / Decisions Made

- ISS-021 records that better-sqlite3 11.10.0 is incompatible with the tested Node 24.19.0 CLI
  shutdown path.
- ADR-020 records the exact 12.9.0 pin: it supports Node 20/22/24, while 12.10+ removed Node 20
  prebuilt binaries and 13.x dropped Node 20 from its engine range.
- ADR-021 supersedes ADR-020's unbounded-support assumption and advertises only the tested Node
  20/22/24 release lines supported by the pinned native dependency.
- DEBT-003 remains active because better-sqlite3 12.9.0 still uses deprecated prebuild-install.
- The package engine metadata changed; CLI flags/output, schema, package version, publication, and
  deployment remain unchanged.

## Next Session: To-Do

1. Hand off the updated PR #16 for review and merge by another reviewer.
2. Select the next separately approved maintenance or product milestone.

## Important Context

- `csv-to-signal@0.3.0` remains the published npm `latest`; this work does not create a release.
- better-sqlite3 is exactly pinned to 12.9.0, and the public engine range is bounded to
  `^20.0.0 || ^22.0.0 || ^24.0.0`.
- Deferred features still require a dedicated plan and explicit human approval.

## Session Update — 2026-08-22

- **Agent Role**: Implementer
- **Session Goal**: Complete approved M8 runtime modernization without publishing.
- Created `codex/m8-runtime-modernization` from merged `origin/main` in an isolated worktree and
  confirmed the 90-test baseline.
- Added TASK-029 and the focused M8 plan, then observed the release-manifest regression test fail
  against the old Node 20/22/24 contract before changing runtime metadata.
- Narrowed root and public CLI engines to `^22.0.0 || ^24.0.0`, aligned `@types/node` to 22.20.1,
  changed the bundle target to Node 22, and reduced PR CI to Node 22/24.
- Pinned `better-sqlite3` 13.0.3 in Storage and the CLI; the lockfile now uses `node-addon-api` and
  has no `prebuild-install` dependency path.
- Confirmed clean npm and pnpm consumer probes load the bundled native prebuild and execute an
  in-memory SQLite query. pnpm workspace installation may still run a `node-gyp` configuration
  step when native build scripts are allowed, but it does not replace the bundled prebuild.
- Complete Node 22 and 24.19.0 release checks pass with nine builds, 90 tests, typecheck, full and
  production audits, the unchanged four-file tarball, isolated installation, installed windowed
  execution, database placement, and invalid-input checks.
- No CLI behavior, flag, output, schema, package version, tag, publication, deployment, or deferred
  feature changed. Next step is independent review and merge.

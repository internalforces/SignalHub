<!--
Purpose:        Current session state — context handoff between agents
Owner:          Currently active agent
Update Trigger: Read at session start; must update before session ends
Harness Version: 1.1
-->

# Current Session — Signal Hub

## Session Info

- **Date**: 2026-08-06
- **Agent Role**: Planner
- **Session Goal**: Plan TASK-022 CLI release readiness from a verified npm-pack baseline without publishing or changing runtime behavior.

## Previous Session Summary

The approved M1-M4 scope and TASK-021 are merged. A follow-up status audit verified 84 tests,
build, typecheck, dependency audits, and PR #9 CI, then identified release readiness as the next
recommended focus.

## Current Work

- [x] TASK-022 release-readiness implementation plan prepared; implementation approval is pending.

## Completed This Session

- [x] Created `codex/task-022-release-readiness-plan` from current `origin/main`.
- [x] Audited project/CLI versions, publication guards, package metadata, legal files, and CI coverage.
- [x] Ran `npm pack --dry-run --json` and a real temporary npm pack/install attempt.
- [x] Confirmed npm tarballs preserve `workspace:*` and fail installation with
  `EUNSUPPORTEDPROTOCOL`.
- [x] Confirmed pnpm rewrites workspace ranges, but installation still fails because the private
  `@signal-hub/*` packages are unpublished.
- [x] Confirmed the current tarball includes local `data.db`, `.turbo` logs, sources, tests, and
  configuration while omitting package README/license files.
- [x] Verified `signal-hub` returned registry `E404` during the assessment; no name reservation,
  authentication, or publication was attempted.
- [x] Created the M5 TASK-022 plan with release-topology, identity/version/license, dependency, CI,
  and publication approval gates.
- [x] Updated the roadmap, backlog, active-task marker, project state, issue log, and decision log.

## Issues Found / Decisions Made

- ADR-012 prioritizes release readiness as M5 and moves proposed consumption/explanation work to M6.
- ISS-013 records the unsafe, non-installable CLI tarball as a high release blocker with no current
  runtime impact while the package remains private.
- The recommended release topology is one bundled CLI package with `better-sqlite3` external, but
  implementation requires approval of the exact direct build dependency.
- No runtime, public interface, schema, package manifest, CI, or dependency change was made.

## Next Session: To-Do

1. Review and approve or revise TASK-022's single-package release topology.
2. Approve the package name/owner, `0.2.0` recommendation, and public license text.
3. Approve the exact bundler dependency before it is added and decide whether CI may gain a Node
   support matrix/package check.
4. Implement TASK-022 only after those gates; stop at a verified tarball.
5. Request separate explicit approval for any future `npm publish` action.

## Important Context

- The authoritative plan is `docs/2026-08-06-signal-hub-release-readiness-plan.md`.
- TASK-022 is in the backlog, not active; planning approval does not authorize implementation.
- Keep `private: true` until the other local readiness gates pass.
- The current tarball must not be distributed because it contains local SQLite data and cannot be
  installed outside the monorepo.
- `npm publish`, registry login/access changes, tags, releases, and deployment remain out of scope.

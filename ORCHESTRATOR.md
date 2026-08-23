<!--
Purpose:        Agent collaboration sequences and Human Approval Gates
Owner:          Architect / Planner
Update Trigger: New workflow added, roles changed, approval policy updated
Harness Version: 1.1
-->

# ORCHESTRATOR.md — Signal Hub Workflow Playbooks

_Last updated: 2026-08-23_

---

## Feature Workflow

```
[Planner]   Decompose feature → add to tasks/backlog.md
    ↓
[Architect] Design (for complex features only — e.g. a new connector or detector)
    ↓ ⚠️ HUMAN APPROVAL if new dependency or schema change
[Implementer] Implement (TDD: failing test → minimal code → passing test, per the plan)
    ↓
[Tester]    Confirm test strategy and coverage
    ↓
[Reviewer]  Code review → save to reports/
    ↓ ⚠️ HUMAN APPROVAL before merge
```

## BugFix Workflow

```
[Debugger]    Reproduce → root cause → register in known-issues.md
    ↓
[Implementer] Fix
    ↓
[Reviewer]    Review
    ↓ ⚠️ HUMAN APPROVAL before production deploy
```

## Research Workflow

```
[Researcher]  Research → reports/research-*.md
    ↓
[Architect]   Decision → memory/decisions.md (ADR)
    ↓
[Planner]     Convert to tasks if needed
```

## Documentation Workflow

```
[Documenter]  Draft README / API docs from code + memory/architecture.md
    ↓
[Reviewer]    Accuracy check against actual code
```

## Release Workflow (npm publish)

```
[Reviewer]    Final review → approve release notes and candidate scope
    ↓
[Architect]   Confirm impact → update memory/architecture.md
    ↓
[Release Mgr] Merge reviewed candidate → retain one exact tarball → verify Node 22/24
    ↓ ⚠️ HUMAN APPROVAL for the exact artifact, release tag, `npm publish`, and GitHub Release
[Release Mgr] Tag → publish retained tarball → verify registry/consumer → GitHub Release
    ↓
[Documenter]  Record checksums and outcome → close task through a reviewed PR
```

The complete AI and manual procedure, stop conditions, browser authentication behavior, and
recovery guidance are in [`docs/release-runbook.md`](docs/release-runbook.md). That runbook is the
single command-level authority; release-specific plans may add gates but must not weaken it.

---

## Human Approval Gates Summary

| Situation | Reason |
|-----------|--------|
| New external dependency | Security and license review |
| DB schema change | Irreversible change |
| Release tag, npm publication/dist-tag, or GitHub Release | Exact artifact and final responsibility stay with humans; follow `docs/release-runbook.md` |
| Any item from the DEFER list (see `memory/architecture.md`) | Scope creep risk flagged explicitly in the design review |
| Public API interface change (`DataPoint`, `Signal`, `Detector`, `Connector`, CLI package/executable name or flags) | Backward compatibility impact |

<!--
Purpose:        Agent collaboration sequences and Human Approval Gates
Owner:          Architect / Planner
Update Trigger: New workflow added, roles changed, approval policy updated
Harness Version: 1.1
-->

# ORCHESTRATOR.md — Signal Hub Workflow Playbooks

_Last updated: 2026-07-27_

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
[Reviewer]    Final review → write CHANGELOG
    ↓
[Architect]   Confirm impact → update memory/architecture.md
    ↓ ⚠️ HUMAN APPROVAL for release tag and `npm publish`
After deploy: update memory/project.md version, clean up tasks/completed.md
```

---

## Human Approval Gates Summary

| Situation | Reason |
|-----------|--------|
| New external dependency | Security and license review |
| DB schema change | Irreversible change |
| `npm publish` of the `signal-hub` package | Final responsibility stays with humans |
| Any item from the DEFER list (see `memory/architecture.md`) | Scope creep risk flagged explicitly in the design review |
| Public API interface change (`DataPoint`, `Signal`, `Detector`, `Connector`, CLI flags) | Backward compatibility impact |

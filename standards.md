<!--
Purpose:        Code and documentation quality standards
Owner:          Reviewer
Update Trigger: Code style changes, new tooling, test coverage threshold changes
Harness Version: 1.1
-->

# standards.md — Signal Hub Standards

_Last updated: 2026-07-27_

## Code Style

- **Language**: TypeScript, strict mode, target ES2022, module/moduleResolution NodeNext
- **Indentation**: 2 spaces (as used consistently in the implementation plan's code)
- **Max line length**: Not yet defined — TBD (no linter configured yet)
- **Naming**: variables/functions `camelCase`, classes `PascalCase`, constants `UPPER_SNAKE_CASE`
- **Module boundaries**: enforced by workspace dependency direction, not tooling — see `memory/architecture.md` § Architecture Constraints. There is no lint rule for this yet; Reviewer must check package.json `dependencies` by hand until one exists.

## Commit Messages

```
<type>(<scope>): <subject>
```
Types: `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore` | `security`

Scope should be the package name without the `@signal-hub/` prefix, e.g. `feat(storage): ...`, `feat(cli): ...` — matches the commit messages already used in the implementation plan.

## PR Rules

- Title follows commit message format
- Reviewer agent sign-off required before merge
- Self-merge is not allowed

## Test Standards

- Unit tests: every detector, every repository method, `scoreSignals`, `formatSignals`, `isValidDataPoint`
- Integration tests: `runPipeline` end-to-end against an in-memory SQLite database; `runCli` end-to-end against a temp directory and real CSV file
- Minimum coverage: Not yet defined — TBD (no coverage threshold set; Tester should propose one once the MVP tasks land)
- Use `:memory:` SQLite for any test that touches `SqliteStorage` — never a real file

## Security Standards

- No hardcoded secrets in code
- Validate all inputs (this is `@signal-hub/connector-sdk`'s `isValidDataPoint`'s job — Core must not skip it)
- Pull-request CI audits production dependencies at high severity; dependency-maintenance tasks must also run a full audit before completion

## Documentation Standards

- Comments required only where the WHY is non-obvious (hidden constraint, workaround, subtle invariant) — see the project's own no-comments-by-default convention in the plan's generated code
- Record key decisions in `memory/decisions.md`

## Review Checklist (before requesting review)

- [ ] Code style compliant
- [ ] Test coverage met (per the task's own test list in the implementation plan)
- [ ] No security issues
- [ ] Documentation complete
- [ ] No AGENTS.md restrictions violated
- [ ] No DEFER-list feature snuck in scope (see `memory/architecture.md`)
- [ ] Package dependency direction respected

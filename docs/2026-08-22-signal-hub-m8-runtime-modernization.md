# Signal Hub M8 — Runtime Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [x]`) syntax for tracking.

**Goal:** Remove the EOL Node 20 compatibility contract and move the public CLI's SQLite runtime
to the N-API-based `better-sqlite3` 13.x line while preserving all existing CLI behavior.

**Architecture:** Keep the existing package graph, SQLite schema, CLI flags, JSON output, and
four-file release boundary unchanged. Update only the supported runtime contract, native SQLite
dependency, bundle target, CI matrix, and current project records, then verify the exact tarball in
an isolated consumer install.

**Tech Stack:** TypeScript strict/NodeNext, Node.js `^22.0.0 || ^24.0.0`, pnpm 9.7.0,
Turborepo, Vitest 4.1.10, esbuild 0.25.12, `@types/node` 22.20.1,
`better-sqlite3` 13.0.3.

**Spec:** `memory/known-issues.md` DEBT-005 and owner approval on 2026-08-22.

## Global Constraints

- Supported runtimes are exactly `^22.0.0 || ^24.0.0`; Node 20 is no longer advertised or tested.
- Pin `better-sqlite3` exactly to `13.0.3` in Storage and the public CLI.
- Build the public CLI bundle for `node22` while keeping `better-sqlite3` external.
- Do not change CLI commands, flags, output, signal contracts, database schema, or package version.
- Do not publish, tag, deploy, or add a new external dependency.
- Keep the existing four-file tarball allowlist and independently install and execute the tarball.

---

### Task 1: Lock the Runtime Contract with a Regression Test

**Files:**
- Modify: `apps/cli/tests/package.test.ts`
- Test: `apps/cli/tests/package.test.ts`

**Interfaces:**
- Consumes: root and CLI `package.json` manifests.
- Produces: a regression contract for Node engines, the SQLite runtime pin, and esbuild target.

- [x] **Step 1: Extend the manifest type and load the root manifest**

```ts
interface PackageManifest {
  scripts?: Record<string, string>;
}

const rootManifest = JSON.parse(
  readFileSync(resolve(cliDirectory, "..", "..", "package.json"), "utf-8"),
) as PackageManifest;
```

- [x] **Step 2: Change the release-metadata expectation before changing manifests**

```ts
expect(rootManifest.engines?.node).toBe("^22.0.0 || ^24.0.0");
expect(manifest).toMatchObject({
  engines: { node: "^22.0.0 || ^24.0.0" },
  dependencies: { "better-sqlite3": "13.0.3" },
});
expect(manifest.scripts?.build).toContain("--target=node22");
```

- [x] **Step 3: Run the focused test and verify RED**

Run: `pnpm --filter csv-to-signal test -- tests/package.test.ts`

Expected: FAIL because the current root/CLI engines include Node 20, the runtime pin is 12.9.0,
and the bundle target is node20.

---

### Task 2: Update the Runtime, Native Dependency, and CI Matrix

**Files:**
- Modify: `package.json`
- Modify: `apps/cli/package.json`
- Modify: `packages/storage/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Task 1's manifest regression contract.
- Produces: Node 22/24 workspace and public package metadata with `better-sqlite3@13.0.3`.

- [x] **Step 1: Update the root and public engines to the exact supported range**

```json
"engines": { "node": "^22.0.0 || ^24.0.0" }
```

- [x] **Step 2: Align the workspace Node types with the minimum supported release line**

```json
"@types/node": "^22.20.1"
```

- [x] **Step 3: Pin the Storage and CLI runtime dependency**

```json
"better-sqlite3": "13.0.3"
```

- [x] **Step 4: Raise the CLI bundle target**

```text
--target=node22
```

- [x] **Step 5: Remove Node 20 from the pull-request matrix**

```yaml
node-version: [22, 24]
```

- [x] **Step 6: Refresh the lockfile without changing unrelated dependency versions**

Run: `pnpm install --lockfile-only`

Expected: `better-sqlite3@13.0.3` and `node-addon-api` replace the 12.9.0
`prebuild-install` dependency path.

- [x] **Step 7: Run the focused test and verify GREEN**

Run: `pnpm --filter csv-to-signal test -- tests/package.test.ts`

Expected: PASS with all CLI package tests green.

---

### Task 3: Synchronize Current Documentation and Project Records

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `apps/cli/README.md`
- Modify: `docs/README.ko.md`
- Modify: `docs/development.md`
- Modify: `tech-stack.md`
- Modify: `dependencies.md`
- Modify: `prompts/implementation.md`
- Modify: `roadmap.md`
- Modify: `memory/project.md`
- Modify: `memory/architecture.md`
- Modify: `memory/decisions.md`
- Modify: `memory/known-issues.md`
- Modify: `memory/session.md`
- Modify: `tasks/active.md`
- Modify: `tasks/completed.md`

**Interfaces:**
- Consumes: the verified runtime contract from Task 2.
- Produces: one current, non-contradictory Node 22/24 support statement and M8 audit trail.

- [x] **Step 1: Replace current support statements, leaving historical plans and completed-task
      evidence unchanged**

Use `^22.0.0 || ^24.0.0`, Node 22/24 CI, and `better-sqlite3` 13.0.3 in current documentation.

- [x] **Step 2: Record ADR-022**

Record the owner-approved removal of EOL Node 20, the N-API migration, preserved product behavior,
and the no-publication boundary.

- [x] **Step 3: Resolve DEBT-003 and DEBT-005**

Move both items from active technical debt to the resolved table with M8 as the resolution.

- [x] **Step 4: Close TASK-029 records only after verification succeeds**

Move TASK-029 from `tasks/active.md` to `tasks/completed.md` and update the session handoff.

---

### Task 4: Verify the Complete Release Boundary

**Files:**
- Verify: all files changed by Tasks 1–3.

**Interfaces:**
- Consumes: the M8 candidate workspace and release tarball.
- Produces: evidence that code, types, audits, packaging, installation, and execution still pass.

- [x] **Step 1: Run the complete release check under Node 22**

Run: `pnpm release:check`

Expected: frozen install, nine builds, 90 tests, typecheck, full and production audits, four-file
tarball inspection, isolated install, and installed CLI execution all pass.

- [x] **Step 2: Run the same complete release check under Node 24.19.0**

Run: `npx --yes --package node@24.19.0 --call 'node --version && pnpm release:check'`

Expected: the same build, test, typecheck, audit, package, installation, and execution checks pass.

- [x] **Step 3: Verify no deprecated installer remains**

Run: `pnpm why prebuild-install`

Expected: no dependency path is reported.

- [x] **Step 4: Verify the diff and repository state**

Run: `git diff --check && git status --short`

Expected: no whitespace errors and only intentional M8 files changed.

- [x] **Step 5: Commit the reviewed candidate**

```bash
git add .
git commit -m "chore(runtime): modernize supported Node releases"
```

No push, tag, release, or publication is part of M8.

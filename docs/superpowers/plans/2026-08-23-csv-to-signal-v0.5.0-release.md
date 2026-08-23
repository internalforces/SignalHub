# CSV to Signal v0.5.0 Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release the merged M9 external-connector CLI integration as `csv-to-signal@0.5.0` from
one reviewed, verified merge while preserving the existing package boundary and exact-artifact
approval gate.

**Architecture:** Prepare the public version and current documentation on a release branch, lock
the release identity with the existing package regression test and release checker, and verify the
four-file npm artifact on Node 22 and 24. Merge through a reviewed PR, reproduce one artifact from
the exact merge commit, then stop for explicit approval before creating `v0.5.0` or publishing.

**Tech Stack:** TypeScript strict/NodeNext, Node.js `^22.0.0 || ^24.0.0`, pnpm 9.7.0,
Turborepo, Vitest 4.1.10, npm public registry, GitHub CLI.

**Spec:** `docs/superpowers/specs/2026-08-22-external-connectors-cli-design.md`,
`docs/superpowers/plans/2026-08-22-external-connectors-cli.md`, the five-step owner request on
2026-08-23, and the `AGENTS.md` release gates.

## Global Constraints

- Release identity is exactly `csv-to-signal@0.5.0`, Git tag `v0.5.0`, npm registry
  `https://registry.npmjs.org/`, and dist-tag `latest`.
- Preserve `analyze <file.csv>`, `github <owner>/<repo>`, `coingecko <coin-id>`, all flags, JSON
  output, shared contracts, SQLite schema, dependencies, and the four-file package allowlist.
- Update the GitHub-facing `README.md` and npm-facing `apps/cli/README.md` so the documented npm
  artifact includes all three commands and no longer carries the `0.4.0` pre-integration caveat.
- Do not commit directly to `main`; merge the candidate through a pull request.
- Do not create or push `v0.5.0`, run `npm publish`, change dist-tags, or create a GitHub Release
  until the exact merged tarball metadata is presented and the owner explicitly approves it.
- Publish the exact verified tarball, not a later rebuild.

---

### Task 1: Lock the v0.5.0 Package Identity

**Files:**
- Modify: `apps/cli/tests/package.test.ts`
- Modify: `apps/cli/package.json`
- Modify: `scripts/release-check.mjs`
- Test: `apps/cli/tests/package.test.ts`
- Test: `scripts/release-check.test.mjs`

**Interfaces:**
- Consumes: the existing `PackageManifest` assertion and exact-tarball release checker.
- Produces: an automated package identity contract for `csv-to-signal@0.5.0`.

- [x] **Step 1: Change the expected package-test version before the manifest**

```ts
expect(manifest).toMatchObject({
  name: "csv-to-signal",
  version: "0.5.0",
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `pnpm --filter csv-to-signal test -- tests/package.test.ts`

Expected: FAIL because the manifest still reports `0.4.0`.

- [x] **Step 3: Change only the public CLI manifest version**

```json
"name": "csv-to-signal",
"version": "0.5.0"
```

- [x] **Step 4: Run the focused test and verify GREEN**

Run: `pnpm --filter csv-to-signal test -- tests/package.test.ts`

Expected: all package tests pass and the dry-run tarball contains only `dist/index.js`,
`package.json`, `README.md`, and `LICENSE`.

- [x] **Step 5: Run the exact-tarball test and verify the stale guard is RED**

Run: `node --test scripts/release-check.test.mjs`

Expected: FAIL because `scripts/release-check.mjs` still requires `0.4.0`.

- [x] **Step 6: Update the release checker to require `0.5.0` and verify GREEN**

Run: `node --test scripts/release-check.test.mjs`

Expected: the retained package-only tarball is installed and verified as `csv-to-signal@0.5.0`.

---

### Task 2: Update GitHub and npm README State

**Files:**
- Modify: `README.md`
- Modify: `apps/cli/README.md`
- Modify: `docs/README.ko.md`
- Modify: `docs/development.md`

**Interfaces:**
- Consumes: the M9 command surface and `0.5.0` candidate identity.
- Produces: repository and packed-package guidance that accurately describes all three commands.

- [x] **Step 1: Update the root GitHub README**

State that `0.4.0` remains npm `latest` while `0.5.0` is the reviewed release candidate. Explain
that `0.5.0` adds the GitHub and CoinGecko commands without changing the CSV command or JSON format,
and link this release plan.

- [x] **Step 2: Update the npm package README**

Describe the package as a local CSV, GitHub, and CoinGecko signal CLI. Remove the statement that
the external commands exist only in repository builds. Retain installation, environment-only
credential, database placement, CSV contract, options, license, and repository guidance.

- [x] **Step 3: Align Korean and development guidance**

Record the same published-versus-candidate boundary in `docs/README.ko.md` and explain in
`docs/development.md` that the `0.5.0` tarball bundles the private connector workspaces.

- [x] **Step 4: Review package contents through the existing dry-run assertion**

Run: `pnpm --filter csv-to-signal test -- tests/package.test.ts`

Expected: the npm-facing README remains one of exactly four packed files.

---

### Task 3: Record the Release Candidate and Approval Boundary

**Files:**
- Modify: `memory/project.md`
- Modify: `memory/session.md`
- Modify: `memory/decisions.md`
- Modify: `roadmap.md`
- Modify: `tasks/active.md`
- Modify: `docs/superpowers/plans/2026-08-23-csv-to-signal-v0.5.0-release.md`

**Interfaces:**
- Consumes: the owner-selected `0.5.0` target and verified package identity.
- Produces: TASK-033 and ADR-026 records separating candidate preparation from immutable actions.

- [x] **Step 1: Add TASK-033 as the active release task**

Record gates for full verification, PR merge, exact merged tarball reproduction, final approval,
npm registry verification, and GitHub Release creation.

- [x] **Step 2: Add ADR-026 as an accepted preparation decision**

Record why the additive GitHub/CoinGecko surface is released as pre-1.0 minor `0.5.0`, the exact
registry/tag/dist-tag, and the final approval boundary.

- [x] **Step 3: Update project, roadmap, and session state**

State that `csv-to-signal@0.4.0` remains npm `latest` while `0.5.0` is an unmerged candidate. Do not
claim publication before registry verification succeeds.

- [x] **Step 4: Leave publication conditions open**

Keep TASK-033 active and the tag/publish/GitHub Release plan steps unchecked until those immutable
actions are separately approved and verified.

---

### Task 4: Verify, Commit, and Open the Release PR

**Files:**
- Verify: all files changed by Tasks 1-3.

**Interfaces:**
- Consumes: the `0.5.0` release branch.
- Produces: a reviewed release PR with passing local and hosted checks.

- [x] **Step 1: Run the complete Node 22 release check**

Run: `pnpm release:check`

Expected: frozen install, nine builds, 116 tests, typecheck, full/production audits, four-file
package inspection, isolated installation, and installed execution pass for `0.5.0`.

- [x] **Step 2: Run the complete Node 24.19.0 release check**

Run: `npx --yes --package node@24.19.0 --call 'node --version && pnpm release:check'`

Expected: the same verification passes under Node 24.19.0.

- [x] **Step 3: Verify diff hygiene and release boundaries**

Run: `git diff --check && git status --short`

Expected: no whitespace errors, dependency changes, public-interface changes beyond the approved
additive M9 commands already merged, schema changes, tag, or publication.

- [x] **Step 4: Commit the release candidate**

```bash
git add apps/cli/package.json apps/cli/tests/package.test.ts apps/cli/README.md README.md
git add docs/README.ko.md docs/development.md docs/superpowers/plans/2026-08-23-csv-to-signal-v0.5.0-release.md
git add memory/project.md memory/session.md memory/decisions.md roadmap.md tasks/active.md
git add scripts/release-check.mjs
git commit -m "chore(release): prepare csv-to-signal 0.5.0"
```

- [x] **Step 5: Push and create the PR against `main`**

Use title `chore(release): prepare csv-to-signal 0.5.0`. The PR body must list Node 22/24 checks,
the four-file package boundary, both README updates, and the final immutable-action gate.

- [ ] **Step 6: Wait for hosted CI and review before merge**

Do not self-merge before the required review sign-off. Merge only when all required checks pass.
PR #21 passes hosted Node 22 and Node 24 CI; independent review and merge remain pending.

---

### Task 5: Reproduce the Exact Merged Artifact

**Files:**
- Verify: the exact release-PR merge commit.

**Interfaces:**
- Consumes: the reviewed merge SHA.
- Produces: one retained `csv-to-signal-0.5.0.tgz` plus its size and checksums.

- [ ] **Step 1: Create a clean detached worktree at the merge SHA**

Run `pnpm install --frozen-lockfile` there before packing. Do not reuse release-branch build output.

- [ ] **Step 2: Produce the artifact once on Node 22**

Run:

```bash
RELEASE_ARTIFACT_DIR=$(mktemp -d /tmp/csv-to-signal-v0.5.0-artifact.XXXXXX)
pnpm release:check -- --retain-tarball "$RELEASE_ARTIFACT_DIR"
RELEASE_TARBALL="$RELEASE_ARTIFACT_DIR/csv-to-signal-0.5.0.tgz"
```

Expected: exactly one retained `csv-to-signal-0.5.0.tgz`, installed and exercised successfully.

- [ ] **Step 3: Verify the same bytes on Node 24.19.0**

Run:

```bash
npx --yes --package node@24.19.0 --call \
  "node --version && pnpm release:check -- --verify-tarball '$RELEASE_TARBALL'"
```

Do not repack or replace the artifact.

- [ ] **Step 4: Verify unpublished status and release authority**

Confirm `csv-to-signal@0.5.0` returns registry E404, `npm whoami` is `internalforces`, package
access is public, and the owner list contains `internalforces`. Stop on any other result.

- [ ] **Step 5: Compute and present exact metadata**

Present merge SHA, absolute tarball path, byte size, SHA-1 shasum, SHA-256, SHA-512 integrity,
registry, access, dist-tag, intended Git tag, and exact publish command.

- [ ] **Step 6: Stop for final immutable-action approval**

Do not tag, publish, change dist-tags, or create a GitHub Release before the owner approves the
exact metadata from Step 5.

---

### Task 6: Publish and Close the Release After Final Approval

**Files:**
- Modify after publication: `AGENTS.md`
- Modify after publication: `README.md`
- Modify after publication: `docs/README.ko.md`
- Modify after publication: `docs/development.md`
- Modify after publication: `tech-stack.md`
- Modify after publication: `memory/project.md`
- Modify after publication: `memory/session.md`
- Modify after publication: `memory/decisions.md`
- Modify after publication: `roadmap.md`
- Move after publication: TASK-033 from `tasks/active.md` to `tasks/completed.md`

**Interfaces:**
- Consumes: the exact owner-approved merge and retained tarball.
- Produces: npm `latest` `csv-to-signal@0.5.0`, tag/GitHub Release `v0.5.0`, registry verification,
  and project closeout records.

- [ ] **Step 1: Create and push annotated `v0.5.0` at the approved merge SHA**
- [ ] **Step 2: Publish only the approved tarball**

```bash
npm publish "$RELEASE_TARBALL" \
  --access public \
  --tag latest \
  --registry https://registry.npmjs.org/
```

- [ ] **Step 3: Verify registry metadata and a clean consumer**

Confirm version and `latest` are `0.5.0`, registry SHA-1/SHA-512 match the retained file, the clean
registry install exposes all three commands, deterministic CSV output remains intact, and
`data.db` is created only in the consumer working directory.

- [ ] **Step 4: Create stable GitHub Release `v0.5.0` from the exact tag**
- [ ] **Step 5: Update published-version records and close TASK-033 through a follow-up PR**

Preserve historical `0.4.0` evidence while changing current-version references to `0.5.0` only
after publication verification succeeds.

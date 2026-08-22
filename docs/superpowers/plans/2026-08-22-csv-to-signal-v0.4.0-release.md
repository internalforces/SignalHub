# CSV to Signal v0.4.0 Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the merged M8 runtime modernization as `csv-to-signal@0.4.0` from one reviewed,
verified merge while preserving the package contents and CLI behavior.

**Architecture:** Prepare the version and governance records on a release branch, lock the release
identity with the existing package regression test, and verify the four-file npm artifact on Node
22 and 24. Merge through a reviewed PR, reproduce the artifact from the exact merge commit, then
stop for the constitutionally required approval before creating `v0.4.0` or running `npm publish`.

**Tech Stack:** TypeScript strict/NodeNext, Node.js `^22.0.0 || ^24.0.0`, pnpm 9.7.0,
Turborepo, Vitest 4.1.10, npm public registry, GitHub CLI.

**Spec:** `docs/2026-08-22-signal-hub-m8-runtime-modernization.md`, `AGENTS.md` release gates,
and project-owner approval on 2026-08-22 to prepare `0.4.0`.

## Global Constraints

- Release identity is exactly `csv-to-signal@0.4.0`, Git tag `v0.4.0`, npm registry
  `https://registry.npmjs.org/`, and dist-tag `latest`.
- Do not change commands, flags, JSON output, shared contracts, SQLite schema, dependencies, or the
  four-file package allowlist.
- Do not commit directly to `main`; merge the candidate through a pull request.
- Do not create or push `v0.4.0`, run `npm publish`, change dist-tags, or create a GitHub Release
  until the exact merged tarball metadata is presented and the owner explicitly approves it.
- Publish the exact verified tarball, not a rebuilt directory whose contents were not approved.

---

### Task 1: Lock the v0.4.0 Package Identity

**Files:**
- Modify: `apps/cli/tests/package.test.ts`
- Modify: `apps/cli/package.json`
- Test: `apps/cli/tests/package.test.ts`

**Interfaces:**
- Consumes: the existing `PackageManifest` test fixture and `csv-to-signal@0.3.0` manifest.
- Produces: an automated package identity contract for `csv-to-signal@0.4.0`.

- [x] **Step 1: Change the expected release version before the manifest**

```ts
expect(manifest).toMatchObject({
  name: "csv-to-signal",
  version: "0.4.0",
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `pnpm --filter csv-to-signal test -- tests/package.test.ts`

Expected: FAIL because the manifest still reports `0.3.0`.

- [x] **Step 3: Change only the public CLI version**

```json
"name": "csv-to-signal",
"version": "0.4.0"
```

- [x] **Step 4: Run the focused test and verify GREEN**

Run: `pnpm --filter csv-to-signal test -- tests/package.test.ts`

Expected: all three package tests pass and the dry-run tarball still contains only
`dist/index.js`, `package.json`, `README.md`, and `LICENSE`.

---

### Task 2: Record the Approved Release Candidate and Approval Boundary

**Files:**
- Modify: `memory/project.md`
- Modify: `memory/session.md`
- Modify: `memory/decisions.md`
- Modify: `roadmap.md`
- Modify: `tasks/active.md`
- Modify: `docs/superpowers/plans/2026-08-22-csv-to-signal-v0.4.0-release.md`

**Interfaces:**
- Consumes: the owner-approved version and Task 1 package identity.
- Produces: TASK-030 and ADR-023 records that distinguish a verified candidate from publication.

- [x] **Step 1: Add TASK-030 as the active release task**

Record `CSV to Signal 0.4.0 Release` with completion gates for Node 22/24 verification,
independent review, PR merge, exact merged artifact approval, npm verification, and GitHub Release.

- [x] **Step 2: Add ADR-023 as an accepted preparation decision**

Record why dropping Node 20 is released as `0.4.0`, the exact target registry/tag, and the separate
immutable-action approval gate.

- [x] **Step 3: Update current project, roadmap, and session state**

State that `0.3.0` remains npm `latest` while the reviewed `0.4.0` candidate is being prepared.
Do not claim that `0.4.0` is published before registry verification succeeds.

- [x] **Step 4: Close candidate-preparation checkboxes only after verification**

Leave publication-related TASK-030 conditions active until npm and GitHub Release verification
complete. Do not move TASK-030 to `tasks/completed.md` during candidate preparation.

---

### Task 3: Verify and Review the Release Candidate

**Files:**
- Modify: `scripts/release-check.mjs` — align the explicit packed-manifest version guard with the
  approved `0.4.0` candidate identity.
- Test: `scripts/release-check.test.mjs` — retain one package-only tarball and verify its exact path.
- Verify: all files changed by Tasks 1-2.

**Interfaces:**
- Consumes: the `0.4.0` release branch.
- Produces: a reviewed branch whose exact package boundary passes on Node 22 and Node 24.

**Observed RED / approved correction:** The initial Node 22 `pnpm release:check` completed the
frozen install, nine builds, 90 tests, typecheck, and both audits, then failed with `Packed
manifest does not match the approved release identity`. The branch manifest and package regression
test already assert `0.4.0`; `scripts/release-check.mjs` still asserted `0.3.0`. Update only that
stale explicit guard, verify the minimal package GREEN hypothesis with `pnpm release:package`, then
restart the complete Node 22 and Node 24 checks below. The failed initial full Node 22 run is the
required RED evidence; it does not complete Step 1.

- [x] **Step 1: Run the complete Node 22 release check**

Run: `pnpm release:check`

Expected: frozen install, nine builds, 90 tests, typecheck, full/production audits, four-file
package inspection, isolated install, and installed CLI execution pass for `0.4.0`.

- [x] **Step 2: Run the complete Node 24.19.0 release check**

Run: `npx --yes --package node@24.19.0 --call 'node --version && pnpm release:check'`

Expected: the same verification passes under Node 24.19.0.

- [x] **Step 3: Verify diff hygiene and release boundaries**

Run: `git diff --check`

Expected: no whitespace errors, no dependency or public-interface change, no tag, and no
publication.

- [x] **Step 4: Commit and request independent review**

```bash
git add apps/cli/package.json apps/cli/tests/package.test.ts docs/superpowers/plans/2026-08-22-csv-to-signal-v0.4.0-release.md memory/project.md memory/session.md memory/decisions.md roadmap.md tasks/active.md
git add scripts/release-check.mjs scripts/release-check.test.mjs
git commit -m "chore(release): prepare csv-to-signal 0.4.0"
```

Review must confirm the semantic version, immutable-action gate, package boundary, tests, and lack
of unrelated API/schema/dependency changes.

---

### Task 4: Merge the Candidate and Reproduce the Exact Artifact

**Files:**
- Verify: exact pull-request merge commit.

**Interfaces:**
- Consumes: the reviewed release PR with passing Node 22/24 CI.
- Produces: one retained `csv-to-signal-0.4.0.tgz` plus its size, shasum, integrity, and merge SHA.

- [ ] **Step 1: Push the branch and create a PR against `main`**

Use title `chore(release): prepare csv-to-signal 0.4.0` and include Node 22/24 verification in the
PR body.

- [ ] **Step 2: Wait for CI and merge through the PR**

Do not push a direct commit to `main`. Record the exact merge SHA after the PR is merged.

- [ ] **Step 3: Produce once and verify the exact tarball on Node 22 and Node 24**

In a clean detached worktree at the merge SHA, run `pnpm install --frozen-lockfile`. Create and
validate an explicit caller-owned artifact directory outside the repository, then run:

```bash
node --version
pnpm release:check -- --retain-tarball <validated-caller-owned-artifact-directory>
npx --yes --package node@24.19.0 --call \
  'node --version && pnpm release:check -- --verify-tarball <absolute-retained-tarball-path>'
```

The first command must run on Node 22, produce exactly one retained `csv-to-signal-0.4.0.tgz`,
and install and exercise it. The Node 24 command must install and exercise that same absolute path
without packing again. Do not rebuild or replace the retained tarball after either verification.

- [ ] **Step 4: Verify unpublished status, access, ownership, and artifact metadata**

```bash
if npm view csv-to-signal@0.4.0 version \
  --registry https://registry.npmjs.org/ >version-check.out 2>version-check.err; then
  echo "csv-to-signal@0.4.0 already exists" >&2
  exit 1
fi
rg '\bE404\b' version-check.err
npm whoami --registry https://registry.npmjs.org/
npm access get status csv-to-signal --registry https://registry.npmjs.org/
npm owner ls csv-to-signal --registry https://registry.npmjs.org/
```

Expected: the version lookup fails with `E404` specifically from
`https://registry.npmjs.org/`. Stop if it succeeds or fails for any other reason. The authenticated
account must be exactly `internalforces`, package access must permit the intended public release,
and the owner list from that registry must contain `internalforces`. Compute size, SHA-1 shasum,
SHA-512 integrity, and SHA-256 only after both exact-tarball verification runs succeed. Every
checksum must be computed from `<absolute-retained-tarball-path>`, and only that path may be
presented for approval or publication.

- [ ] **Step 5: Stop for final immutable-action approval**

Present merge SHA, tarball path, size, checksums, registry, access, dist-tag, tag, test results, and
the exact intended commands. Do not tag or publish until the owner explicitly approves.

---

### Task 5: Publish and Close the Release After Final Approval

**Files:**
- Modify after successful publication: `AGENTS.md`
- Modify after successful publication: `README.md`
- Modify after successful publication: `docs/README.ko.md`
- Modify after successful publication: `docs/development.md`
- Modify after successful publication: `tech-stack.md`
- Modify after successful publication: `memory/project.md`
- Modify after successful publication: `memory/session.md`
- Modify after successful publication: `memory/decisions.md`
- Modify after successful publication: `roadmap.md`
- Move after successful publication: TASK-030 from `tasks/active.md` to `tasks/completed.md`

**Interfaces:**
- Consumes: the exact owner-approved merge and retained tarball.
- Produces: npm `latest` `csv-to-signal@0.4.0`, tag/GitHub Release `v0.4.0`, registry verification,
  and project closeout records.

- [ ] **Step 1: After final approval, create and push annotated tag `v0.4.0` at the merge SHA**
- [ ] **Step 2: Publish only the retained tarball with explicit public release settings**

```bash
npm publish <absolute-owner-approved-retained-tarball-path> \
  --access public \
  --tag latest \
  --registry https://registry.npmjs.org/
```

- [ ] **Step 3: Verify npm metadata, integrity, clean install, execution, output, and database path**

```bash
npm view csv-to-signal@0.4.0 version dist.integrity dist.shasum dist.tarball \
  --registry https://registry.npmjs.org/
npm view csv-to-signal dist-tags.latest --registry https://registry.npmjs.org/
npm install csv-to-signal@0.4.0 --registry https://registry.npmjs.org/
```

Run the install in a clean consumer directory. Confirm the registry version and `latest` dist-tag
are `0.4.0`, the registry SHA-1 and SHA-512 values match the retained file, and the installed CLI
preserves the approved output and local database placement.

- [ ] **Step 4: Create stable GitHub Release `v0.4.0` from the exact tag**
- [ ] **Step 5: Update current-version documentation and close TASK-030 through a follow-up PR**

Update the current release references in `AGENTS.md`, `README.md`, `docs/README.ko.md`,
`docs/development.md`, `tech-stack.md`, `memory/project.md`, `memory/session.md`, and `roadmap.md`.
Preserve historical `0.3.0` evidence, including the M6 plan links and prior release records. Record
verified publication in ADR-023 and move TASK-030 to `tasks/completed.md`.

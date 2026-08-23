<!--
Purpose:        Canonical npm release runbook for AI agents and human operators
Owner:          Release Manager / Project owner
Update Trigger: Release tooling, authentication, registry, support matrix, or approval gates change
Harness Version: 1.1
-->

# CSV to Signal Release Runbook

This is the canonical procedure for publishing the public `csv-to-signal` CLI package to npm and
creating its matching GitHub Release. It is written for both AI agents and developers performing a
manual release.

Use this runbook only after a separately reviewed release candidate has been merged. Preparing a
candidate does not authorize a tag, `npm publish`, a dist-tag change, or a GitHub Release.

## Fixed release identity

| Item | Value |
|------|-------|
| npm package | `csv-to-signal` |
| npm registry | `https://registry.npmjs.org/` |
| npm access | Public |
| npm dist-tag | `latest` |
| Git tag | `v<version>` at the reviewed merge commit |
| supported Node releases | Node 22 and Node 24 |
| packed files | `LICENSE`, `README.md`, `dist/index.js`, `package.json` |
| npm runtime dependency | `better-sqlite3` only |

As of 2026-08-23, the expected npm owner account is `gilgo`; the package author and GitHub
repository identity are `internalforces`. Treat these as assertions to verify, not credentials to
copy. Never record authentication URLs, tokens, cookies, security-key data, or npm log contents in
the repository.

## Release state machine

```text
reviewed candidate
  -> merged commit
  -> one retained tarball
  -> same bytes verified on Node 22 and 24
  -> exact metadata presented
  -> explicit owner approval
  -> tag + npm publish
  -> registry + clean-consumer verification
  -> GitHub Release
  -> documentation-only closeout PR
```

Do not reorder these states. In particular, never create or push the Git tag before exact-artifact
approval. The `v0.5.0` tag was created before the final approval gate and later verified at the
correct merge; that was a documented process deviation, not a precedent.

## AI agent operating contract

For a release task, load the normal project context from `AGENTS.md`, then read this entire runbook
before running release commands.

An AI agent must:

1. Work from a clean detached worktree at the exact reviewed merge SHA.
2. Produce one retained tarball and never replace or repack it after verification begins.
3. Verify that same file on Node 22 and Node 24.
4. Confirm the target version is not already published, the npm package is public, the npm owner is
   expected, and the GitHub authentication points to the intended repository owner.
5. Present all metadata listed in the approval checkpoint below.
6. Stop and obtain explicit human approval for that exact file before any immutable or external
   release action.
7. If npm requests browser authentication, tell the user what opened and wait for them to complete
   it. Do not copy the one-time authentication URL into project files or the final release record.
8. Verify npm and GitHub independently after publication. A successful command alone is not enough.
9. Record any gate deviation truthfully and open a documentation-only closeout PR. Never commit
   directly to `main`.

Execute release commands in one persistent zsh session with `set -euo pipefail`. If an automation
tool starts a fresh shell for each call, it must re-enable fail-fast mode and restore the reviewed
release variables in every call. Never place a mutating command after an unchecked assertion.

Prior approval for a different version, a request to “try,” or a successful dry run is not final
publication approval. Approval must follow presentation of the exact retained artifact metadata.

Stop without publishing if any of these conditions occur:

- the merge SHA, local tag target, or remote `main` do not agree;
- the worktree is dirty;
- Node 22 or Node 24 verification fails;
- the target npm version already exists;
- `npm whoami`, npm owners, access, registry, package name, or dist-tag differ from the approved
  values;
- the tarball contains anything outside the four-file allowlist;
- checksums change between steps;
- final approval is absent or ambiguous.

## Manual release procedure

### 1. Establish the release inputs

Start from the primary repository checkout after the release PR has merged. Replace the example
values; do not paste literal placeholders into a release command. Run all steps in the same zsh
session. `set -euo pipefail` makes any unhandled failed assertion stop the release.

```bash
set -euo pipefail
RELEASE_VERSION="0.6.0"
RELEASE_MERGE_SHA="<full-reviewed-merge-sha>"
RELEASE_TAG="v${RELEASE_VERSION}"
RELEASE_REPOSITORY="internalforces/SignalHub"
RELEASE_ROOT=$(git rev-parse --show-toplevel)
RELEASE_WORKTREE="${RELEASE_ROOT}/.worktrees/release-${RELEASE_VERSION}-merged"
```

Confirm the merge and current registry state:

```bash
git fetch origin
git show --no-patch --oneline "$RELEASE_MERGE_SHA"
test "$(git rev-parse origin/main)" = "$RELEASE_MERGE_SHA"
npm view csv-to-signal dist-tags --json --registry https://registry.npmjs.org/
RELEASE_VERSION_CHECK=$(mktemp "/tmp/csv-to-signal-v${RELEASE_VERSION}-version-check.XXXXXX")
if npm view "csv-to-signal@${RELEASE_VERSION}" version \
  --registry https://registry.npmjs.org/ > /dev/null 2> "$RELEASE_VERSION_CHECK"; then
  echo "csv-to-signal@${RELEASE_VERSION} is already published" >&2
  exit 1
elif ! grep -q "E404" "$RELEASE_VERSION_CHECK"; then
  cat "$RELEASE_VERSION_CHECK" >&2
  exit 1
fi
```

`origin/main` must equal `RELEASE_MERGE_SHA`. The last command must return npm `E404`. Any
published version is immutable; never attempt to overwrite it.

Check that neither a local nor a remote release tag already exists:

```bash
test -z "$(git tag --list "$RELEASE_TAG")"
test -z "$(git ls-remote --tags origin "refs/tags/${RELEASE_TAG}" "refs/tags/${RELEASE_TAG}^{}")"
```

Both commands must produce no tag. If a tag exists, stop and verify its history with the project
owner; do not delete, move, or recreate it.

### 2. Verify release authority

```bash
gh auth status
test "$(gh api user --jq .login)" = "internalforces"
if ! npm whoami --registry https://registry.npmjs.org/ > /dev/null 2>&1; then
  npm login --auth-type=web --registry https://registry.npmjs.org/
fi
test "$(npm whoami --registry https://registry.npmjs.org/)" = "gilgo"
NPM_OWNERS=$(npm owner ls csv-to-signal --registry https://registry.npmjs.org/ | \
  awk '{print $1}' | sort)
printf 'npm owners=%s\n' "$NPM_OWNERS"
test "$NPM_OWNERS" = "gilgo"
npm access get status csv-to-signal --registry https://registry.npmjs.org/ --json | \
  node -e '
    let input = "";
    process.stdin.on("data", (chunk) => { input += chunk; });
    process.stdin.on("end", () => {
      const result = JSON.parse(input);
      if ((result["csv-to-signal"] ?? result) !== "public") process.exit(1);
    });
  '
```

Expected project identities are GitHub `internalforces`, npm owner `gilgo`, and npm access
`public`. If the npm session has expired, the block opens the web login flow. Complete it yourself.
npm may request a second browser authentication during
`npm publish`; this is a fresh CLI-operation authorization and is distinct from entering a 2FA
code. An already authenticated `npm whoami` session does not guarantee that publish will skip it.

### 3. Create a clean detached worktree

The project-local `.worktrees/` directory is ignored by Git.

```bash
git worktree add --detach "$RELEASE_WORKTREE" "$RELEASE_MERGE_SHA"
cd "$RELEASE_WORKTREE"
test "$(git rev-parse HEAD)" = "$RELEASE_MERGE_SHA"
test -z "$(git status --porcelain -uall)"
pnpm install --frozen-lockfile
```

The worktree must be detached at the exact merge SHA and have no modified or untracked files.

### 4. Produce one retained artifact on Node 22

Use the repository's active Node 22 runtime:

```bash
node -e 'if (Number(process.versions.node.split(".")[0]) !== 22) { console.error(`Expected Node 22, received ${process.version}`); process.exit(1); }'
node --version
pnpm --version
RELEASE_ARTIFACT_DIR=$(mktemp -d "/tmp/csv-to-signal-v${RELEASE_VERSION}-artifact.XXXXXX")
pnpm release:check -- --retain-tarball "$RELEASE_ARTIFACT_DIR"
RELEASE_TARBALL="$RELEASE_ARTIFACT_DIR/csv-to-signal-${RELEASE_VERSION}.tgz"
test -f "$RELEASE_TARBALL"
```

`pnpm release:check` performs the frozen install, nine workspace builds, all tests, type checks,
full and production dependency audits, four-file package inspection, isolated installation,
installed CLI execution, invalid-input checks, and database-placement checks.

Do not run another pack command after this point. `RELEASE_TARBALL` is the only publishable file.

### 5. Verify the same bytes on Node 24

```bash
npx --yes --package node@24.19.0 --call \
  "node --version && pnpm release:check -- --verify-tarball '$RELEASE_TARBALL'"
```

This command installs and exercises the existing file; it must not produce a replacement tarball.

### 6. Compute the approval metadata

```bash
RELEASE_SIZE=$(wc -c < "$RELEASE_TARBALL" | tr -d '[:space:]')
RELEASE_SHA1=$(shasum -a 1 "$RELEASE_TARBALL" | awk '{print $1}')
RELEASE_SHA256=$(shasum -a 256 "$RELEASE_TARBALL" | awk '{print $1}')
RELEASE_INTEGRITY="sha512-$(openssl dgst -sha512 -binary "$RELEASE_TARBALL" | openssl base64 -A)"
printf 'size=%s\nsha1=%s\nsha256=%s\nintegrity=%s\n' \
  "$RELEASE_SIZE" "$RELEASE_SHA1" "$RELEASE_SHA256" "$RELEASE_INTEGRITY"
git rev-parse HEAD
git rev-parse origin/main
```

Keep these four exact values in the approval record. They become the expected values for the
mandatory pre-publish comparison.

### 7. Mandatory approval checkpoint

Present all of the following to the project owner and stop:

- exact package name and version;
- full reviewed merge SHA;
- absolute retained tarball path;
- byte size;
- SHA-1 shasum;
- SHA-256 checksum;
- SHA-512 integrity with the `sha512-` prefix;
- registry, public access, and `latest` dist-tag;
- npm authenticated account and current package owners;
- intended Git tag;
- exact `npm publish` command.

The approval must clearly authorize this exact tarball, tag, public npm registry, `latest` dist-tag,
and matching GitHub Release. Do not infer approval from earlier release planning.

### 8. Create the approved tag

Only after approval:

```bash
git tag -a "$RELEASE_TAG" "$RELEASE_MERGE_SHA" -m "csv-to-signal ${RELEASE_TAG}"
test "$(git rev-parse "${RELEASE_TAG}^{}")" = "$RELEASE_MERGE_SHA"
git push origin "$RELEASE_TAG"
REMOTE_TAG_SHA=$(git ls-remote origin "refs/tags/${RELEASE_TAG}^{}" | awk '{print $1}')
test "$REMOTE_TAG_SHA" = "$RELEASE_MERGE_SHA"
```

The peeled local and remote tag must equal `RELEASE_MERGE_SHA`.

### 9. Publish the retained tarball

Before publishing, copy the four values from the owner's approval into the variables below. This
comparison protects the approval boundary even if the terminal session or temporary file changed
while waiting. Do not proceed if any assertion fails.

```bash
APPROVED_SIZE="<approved-byte-size>"
APPROVED_SHA1="<approved-sha1>"
APPROVED_SHA256="<approved-sha256>"
APPROVED_INTEGRITY="<approved-sha512-integrity>"

CURRENT_SIZE=$(wc -c < "$RELEASE_TARBALL" | tr -d '[:space:]')
CURRENT_SHA1=$(shasum -a 1 "$RELEASE_TARBALL" | awk '{print $1}')
CURRENT_SHA256=$(shasum -a 256 "$RELEASE_TARBALL" | awk '{print $1}')
CURRENT_INTEGRITY="sha512-$(openssl dgst -sha512 -binary "$RELEASE_TARBALL" | openssl base64 -A)"

test "$CURRENT_SIZE" = "$APPROVED_SIZE"
test "$CURRENT_SHA1" = "$APPROVED_SHA1"
test "$CURRENT_SHA256" = "$APPROVED_SHA256"
test "$CURRENT_INTEGRITY" = "$APPROVED_INTEGRITY"
test "$(git rev-parse HEAD)" = "$RELEASE_MERGE_SHA"
test "$(git rev-parse "${RELEASE_TAG}^{}")" = "$RELEASE_MERGE_SHA"
```

Publish only after every assertion succeeds:

```bash
npm publish "$RELEASE_TARBALL" \
  --access public \
  --tag latest \
  --registry https://registry.npmjs.org/
```

If npm prints `Press ENTER to open in the browser`, press Enter and complete the web approval. Keep
the terminal session open; successful completion prints `+ csv-to-signal@<version>`.

Do not rebuild or republish if the public lookup initially returns E404. npm metadata can take a
short time to propagate. Poll the read-only lookup; exhausting the attempts stops the release
before consumer or GitHub Release steps:

```bash
REGISTRY_METADATA=""
for attempt in 1 2 3 4 5 6; do
  if REGISTRY_METADATA=$(npm view "csv-to-signal@${RELEASE_VERSION}" \
    version dist.shasum dist.integrity dist.tarball \
    --json --registry https://registry.npmjs.org/); then
    printf '%s\n' "$REGISTRY_METADATA"
    break
  fi
  if [ "$attempt" = "6" ]; then
    echo "npm metadata did not propagate after 6 attempts" >&2
    exit 1
  fi
  sleep 5
done
node -e '
  const [metadataJson, version, sha1, integrity] = process.argv.slice(1);
  const metadata = JSON.parse(metadataJson);
  if (
    metadata.version !== version ||
    metadata["dist.shasum"] !== sha1 ||
    metadata["dist.integrity"] !== integrity
  ) process.exit(1);
' "$REGISTRY_METADATA" "$RELEASE_VERSION" "$APPROVED_SHA1" "$APPROVED_INTEGRITY"
test "$(npm view csv-to-signal dist-tags.latest --registry https://registry.npmjs.org/)" = \
  "$RELEASE_VERSION"
```

### 10. Verify registry bytes and a clean consumer

The registry `dist.shasum` and `dist.integrity` must exactly match the retained tarball. Confirm
`latest` equals `RELEASE_VERSION`, then install from the registry rather than the local tarball:

```bash
RELEASE_CONSUMER_DIR=$(mktemp -d "/tmp/csv-to-signal-v${RELEASE_VERSION}-consumer.XXXXXX")
cd "$RELEASE_CONSUMER_DIR"
npm init -y
npm install "csv-to-signal@${RELEASE_VERSION}" --registry https://registry.npmjs.org/
if ./node_modules/.bin/csv-to-signal > usage.out 2> usage.err; then
  echo "Expected usage command to fail" >&2
  exit 1
fi
grep -q "csv-to-signal analyze" usage.err
grep -q "csv-to-signal github" usage.err
grep -q "csv-to-signal coingecko" usage.err
```

The usage probe makes no provider request. Exercise the published package with the repository's
known CSV fixture, compare two runs, assert the approved JSON, and check database placement:

```bash
cp "$RELEASE_WORKTREE/examples/prices.csv" ./prices.csv
./node_modules/.bin/csv-to-signal analyze prices.csv --window-hours 24 > output-1.json
./node_modules/.bin/csv-to-signal analyze prices.csv --window-hours 24 > output-2.json
cmp output-1.json output-2.json
node --input-type=module -e '
  import { readFileSync } from "node:fs";
  const rows = JSON.parse(readFileSync("output-1.json", "utf8"));
  const actual = rows.map(({ type, direction, timestamp, value, changePercent }) => ({
    type, direction, timestamp, value, changePercent,
  }));
  const expected = [
    { type: "increase", direction: "up", timestamp: "2026-08-02T00:00:00.000Z", value: 125, changePercent: 25 },
    { type: "decrease", direction: "down", timestamp: "2026-08-03T00:00:00.000Z", value: 100, changePercent: -20 },
    { type: "decrease", direction: "down", timestamp: "2026-08-03T00:00:00.000Z", value: 100, changePercent: -20 },
  ];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected registry CSV output: ${JSON.stringify(actual)}`);
  }
'
test -f data.db
test -z "$(find node_modules/csv-to-signal -name '*.db' -print -quit)"
```

If an approved release intentionally changes this fixture's output, update the expected JSON in the
reviewed candidate and this runbook before publication; never weaken the assertion during release.

### 11. Create the GitHub Release

After registry verification:

```bash
RELEASE_NOTES_FILE="<absolute-path-to-reviewed-release-notes.md>"
test -f "$RELEASE_NOTES_FILE"
gh release create "$RELEASE_TAG" \
  --repo "$RELEASE_REPOSITORY" \
  --verify-tag \
  --title "csv-to-signal ${RELEASE_TAG}" \
  --notes-file "$RELEASE_NOTES_FILE"
GITHUB_RELEASE=$(gh release view "$RELEASE_TAG" \
  --repo "$RELEASE_REPOSITORY" \
  --json tagName,name,isDraft,isPrerelease,url,publishedAt)
node -e '
  const [releaseJson, tag] = process.argv.slice(1);
  const release = JSON.parse(releaseJson);
  if (release.tagName !== tag || release.isDraft || release.isPrerelease) process.exit(1);
' "$GITHUB_RELEASE" "$RELEASE_TAG"
printf '%s\n' "$GITHUB_RELEASE"
```

Release notes should summarize user-visible changes, supported Node releases, installation, and
verification provenance. Never include credentials or temporary authentication URLs.

### 12. Close the release through a pull request

On a new `codex/` branch, update current-version records, exact checksums, verification evidence,
the completed release task, and any process deviation. Preserve earlier releases as historical
evidence. Run documentation consistency checks, `git diff --check`, the workspace tests, and the
release-check test. Push the branch, open a PR, and wait for Node 22/24 CI and independent review.

Do not commit release records directly to `main`, and do not delete release worktrees while their
PRs may still need follow-up changes.

## Failure handling and recovery

| Failure | Required action |
|---------|-----------------|
| target npm version exists | Stop. Select a new version through a reviewed release change. |
| checksum changes | Stop. Discard the new artifact from release consideration and investigate. |
| browser authentication expires | Re-run the approved publish command on the same tarball and complete the new browser flow only if npm confirms the version is still absent. |
| publish succeeds but lookup returns E404 | Wait for propagation; do not republish. |
| npm checksum differs | Stop consumer rollout and investigate registry/local artifact provenance. |
| Git tag points elsewhere | Stop. Do not move or delete the tag without a dedicated human decision. |
| GitHub Release creation fails | Leave npm and the immutable tag unchanged; retry only the GitHub Release after diagnosing the failure. |
| published package is defective | Do not unpublish automatically. Obtain approval for deprecation, dist-tag changes, or a corrected patch release. |

npm versions and Git tags are immutable release evidence. “Rollback” normally means publishing a
reviewed corrective version or, with separate approval, moving `latest` to an already verified
version. Never rewrite a published version or silently move a tag.

## v0.5.0 lessons captured by this runbook

- npm authentication and GitHub authentication are separate. The active identities were npm
  `gilgo` and GitHub `internalforces`.
- npm publish required a browser approval even though `npm whoami` already succeeded. In another
  session, `npm login` and `npm publish` can each open a web flow, which explains two browser
  logins without a 2FA-code prompt.
- npm briefly returned E404 and `latest: 0.4.0` immediately after a successful publish, then
  returned `0.5.0`; this was propagation delay, not a reason to republish.
- The retained 12,754-byte tarball was built once and verified on Node 22 and Node 24 before
  publication. Registry SHA-1 and SHA-512 matched that file.
- The `v0.5.0` tag was created before final approval. Its target happened to be correct, but future
  releases must wait until the exact-artifact checkpoint.
- The clean consumer check caught an incorrect human assumption about the expected signal count;
  inspecting and asserting the actual approved JSON distinguished a test expectation error from a
  package defect.

Historical release-specific values belong in release plans and `memory/session.md`. Keep this
runbook version-independent except for explicitly labeled lessons.

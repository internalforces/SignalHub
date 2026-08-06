# Signal Hub M5 — CLI Release Readiness Plan

## Status

Completed on 2026-08-06 after the project owner approved the single-package topology,
`signal-hub@0.2.0`, Apache-2.0, esbuild 0.25.12, and the Node 20/22/24 CI matrix.
This work prepared a locally installable npm tarball only. It did not authorize or perform
`npm publish`, deployment, registry authentication, tag creation, or a GitHub release.

## Goal

Make the `signal-hub` CLI package release-ready without changing its commands or JSON output:

```text
clean checkout -> build -> npm pack -> isolated install -> signal-hub analyze -> verified output
```

The release candidate must be a minimal package that installs outside the monorepo, contains no
workspace-only references or local data, and reports one version consistently.

## Baseline Findings

The 2026-08-06 assessment used Node 22.22.3, npm 10.9.8, pnpm 9.7.0, and commit `713417b`.

| Area | Current finding | Release impact |
|---|---|---|
| Version | Project memory says `v0.2.0-dev`; the CLI and private libraries say `0.1.0`; the workspace root has no version | A release version has no single source of truth |
| Publication guard | `apps/cli/package.json` has `"private": true` | npm correctly refuses publication while the guard remains |
| Package metadata | CLI package lacks description, license, repository, homepage, bugs, keywords, Node engines, files allowlist, and publish configuration | Consumers and registry metadata would be incomplete |
| Legal files | No repository or package-level `LICENSE` exists | A public license must be chosen before public distribution |
| Package contents | `npm pack --dry-run --json` includes `.turbo` logs, `data.db`, TypeScript source, tests, and `tsconfig.json`; it omits a package README and license | The tarball is noisy and could distribute local SQLite data |
| npm-packed dependencies | `npm pack` preserves five `workspace:*` runtime dependencies | A clean `npm install` fails with `EUNSUPPORTEDPROTOCOL` |
| pnpm-packed dependencies | `pnpm pack` rewrites those dependencies to `0.1.0` | Installation still fails because the private `@signal-hub/*` packages are unpublished |
| Package name | `npm view signal-hub` returned registry `E404` during the assessment | The unscoped name appeared unused, but availability must be rechecked immediately before any approved release |
| Existing verification | Build, 84 tests, typecheck, full audit, and production audit pass | Runtime behavior is healthy before packaging changes |

The npm documentation confirms that `private: true` blocks publication, the `files` field controls
the package allowlist, and `npm pack --dry-run` is the supported way to inspect tarball contents:

- <https://docs.npmjs.com/cli/configuring-npm/package-json/>
- <https://docs.npmjs.com/cli/pack/>
- <https://docs.npmjs.com/cli/publish/#files-included-in-package>

pnpm documents that `pnpm pack` rewrites `workspace:` dependencies to registry versions; those
packages must therefore be published too or removed from the packed runtime graph:

- <https://pnpm.io/workspaces#publishing-workspace-packages>

## Required Decisions and Approval Gates

The project owner resolved the implementation gates on 2026-08-06. Publication remains gated.

### Gate 1 — Release topology

Approved: publish one self-contained `signal-hub` CLI package. Bundle the private TypeScript
workspace packages into the CLI output and keep `better-sqlite3` as the only external runtime
dependency.

Why this is preferred:

- it matches the constitution's stated goal of publishing the CLI package, not a public library suite;
- it avoids publishing and versioning six internal packages before the CLI can install; and
- it keeps the current library workspaces private and preserves their existing APIs.

The approved implementation pins esbuild 0.25.12 as a direct CLI development dependency.
Publishing every internal package remains a fallback that requires a separate, larger release plan.

### Gate 2 — Public identity and license

Approved identity:

- package name: `signal-hub`;
- owner/author: `internalforces`;
- first public version candidate: `0.2.0`; and
- license: Apache-2.0, copyright 2026 internalforces.

Name availability is not ownership and can change. Recheck it immediately before an approved
release; do not reserve or publish a name as part of TASK-022.

### Gate 3 — CI coverage

Approved and implemented: pull-request CI covers Node 20, 22, and 24. Node 22 additionally runs the
complete release-candidate check.

### Gate 4 — Publication

Passing every readiness check does not authorize publication. `npm publish` always requires a new,
explicit human approval after the exact tarball, version, registry, and tag are presented.

## Planned Implementation

### 1. Establish one release version and complete CLI metadata

Files:

- Modify: `apps/cli/package.json`
- Modify: `memory/project.md`
- Create after owner license choice: `LICENSE` and package-visible license text
- Create: `apps/cli/README.md`

Work:

- align the CLI package version with the approved project version;
- keep the workspace root private;
- add description, license, repository, homepage, bugs, keywords, Node engines, and an explicit
  public-registry `publishConfig`;
- add a strict `files` allowlist containing only required runtime output and package documentation;
- retain the `signal-hub` binary mapping and ESM declaration; and
- remove `private: true` only on the CLI package, only after the remaining local gates pass.

The package README must document installation, the supported CSV contract, the CLI flags, the
current-working-directory `data.db` behavior, and the fact that GitHub/CoinGecko/windowed APIs are
not CLI commands.

### 2. Make the tarball independent of private workspace packages

Files:

- Modify: `apps/cli/package.json`
- Modify or add: CLI build configuration and focused packaging tests
- Refresh: `pnpm-lock.yaml` only if an approved direct build dependency is added

Work for the recommended single-package topology:

- bundle CLI-owned and private workspace JavaScript into the distributable entry point;
- keep `better-sqlite3` external and declare it directly as the CLI's runtime dependency;
- keep private workspace packages as build/test dependencies only;
- preserve the existing shebang, ESM behavior, CLI flags, output format, and SQLite behavior; and
- ensure the built entry point contains no unresolved `@signal-hub/*` runtime imports.

This work may not change `DataPoint`, `Signal`, `Detector`, `Connector`, Core, database schema, or
the CLI's flags/output format.

### 3. Make package contents deterministic and safe

Add an automated package-content assertion that fails when the tarball:

- contains `data.db`, any `*.db`, `.turbo`, tests, TypeScript source, configuration, coverage,
  logs, credentials, or environment files;
- omits the built binary, `package.json`, README, or license;
- contains a `workspace:` dependency or an unpublished `@signal-hub/*` runtime dependency; or
- has a version, package name, binary path, engine range, or license different from the approved
  metadata.

The test should inspect `npm pack --dry-run --json` output and the manifest extracted from a real
temporary tarball. Temporary artifacts must be created outside the repository.

### 4. Prove clean consumer installation and execution

From a clean build, create a tarball in a temporary directory, then verify in a second empty
directory:

1. `npm install <absolute-tarball-path>` succeeds without workspace access;
2. the installed `signal-hub` binary is available;
3. `signal-hub analyze <sample.csv>` returns valid ranked JSON;
4. the generated `data.db` appears only in the consumer's working directory; and
5. malformed input and unknown flags retain their existing error behavior.

The smoke test must use only local fixture data and must not contact GitHub, CoinGecko, or any paid
service.

### 5. Add the release-check entry point and documentation

Files:

- Modify: root `package.json`
- Modify: `docs/development.md`
- Modify: `README.md` only where repository and installed-package instructions differ
- Modify with separate approval: `.github/workflows/ci.yml`

Add one documented local command that runs, in order:

1. frozen install validation;
2. build, tests, and typecheck;
3. full and production dependency audits;
4. package-content validation; and
5. isolated tarball installation and CLI smoke testing.

It must stop at a verified tarball and print its path, name, version, size, and integrity. It must
not authenticate to npm or invoke a publish command.

## Definition of Done

- [x] Release topology, package identity, version, and license are explicitly approved.
- [x] Any new external build dependency is explicitly approved before addition.
- [x] Project and CLI versions agree on the approved release candidate version.
- [x] Only the CLI package is publishable; the workspace root and internal libraries remain private.
- [x] The packed manifest has no `workspace:` or private `@signal-hub/*` runtime dependency.
- [x] `npm pack --dry-run --json` reports only the approved file allowlist.
- [x] No database, source, test, cache, log, environment, or credential file is packed.
- [x] A fresh temporary npm project installs the tarball and runs the built CLI successfully.
- [x] Supported Node release lines are validated in the approved local or CI matrix.
- [x] Frozen install, build, all tests, typecheck, and both dependency audits pass.
- [x] User and developer documentation distinguishes local development from installed-package use.
- [x] No package is published, no release/tag is created, and no registry credential is used.

## Verification

- `pnpm release:check` passed on Node 22.22.3 with forced build, 87 tests, forced typecheck,
  production audit, full audit, package validation, isolated install, and CLI execution.
- The isolated package/install/execute check also passed on Node 20.20.2 and Node 24.19.0.
- Pull-request CI is configured for clean Node 20/22/24 installs and full workspace checks.
- `npm pack --dry-run --json` reports exactly four files: `dist/index.js`, `package.json`,
  `README.md`, and `LICENSE`.
- The verified tarball is 8,504 bytes and has no workspace or private-package runtime dependency.
- No known dependency vulnerability was reported.
- No npm authentication, publication, tag, release, or deployment occurred.

## Explicitly Out of Scope

- `npm publish`, registry login, access changes, dist-tags, Git tags, GitHub Releases, or deployment;
- publishing `@signal-hub/*` libraries under the recommended single-package topology;
- changing CLI commands, flags, output, detector behavior, shared interfaces, or the SQLite schema;
- GitHub, CoinGecko, or windowed-analysis CLI integration;
- automated changelog/version tooling; and
- any deferred connector, API, alerting, explanation, dashboard, or scheduling feature.

## Rollback and Safety

- Keep `private: true` until all other readiness checks are green.
- Make package metadata, build, and verification changes on a feature branch, never on `main`.
- If the standalone package cannot preserve current behavior, revert the packaging changes and
  return to the release-topology decision gate; do not broaden the task into multi-package release.
- Delete temporary tarballs after validation and never create them inside a publishable package
  directory.

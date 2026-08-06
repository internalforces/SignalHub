# CSV to Signal 0.2.1 Release Identity Plan

## Status

Approved by the project owner on 2026-08-06 and in progress on
`codex/csv-to-signal-release`. This plan changes the public npm package and executable identity;
it does not authorize publishing the changed artifact before its exact merged commit and tarball
are presented for final approval.

## Context

The reviewed `signal-hub@0.2.0` tarball passed all local and Node 20/22/24 checks. Its annotated
`v0.2.0` tag was pushed at commit `09b0cc9`, but npm rejected publication after successful 2FA
because unscoped name `signal-hub` is too similar to existing package `signalhub@4.9.0`.

The owner selected `csv-to-signal` because it directly describes the supported public flow:

```text
CSV -> Detector -> Signal
```

## Approved Identity

- npm package: `csv-to-signal`
- executable: `csv-to-signal`
- release candidate: `0.2.1`
- future tag after review and merge: `v0.2.1`
- license and author: Apache-2.0, `internalforces`
- registry: `https://registry.npmjs.org/`

The existing `v0.2.0` tag remains an immutable record of the rejected unscoped candidate. It must
not be deleted or moved.

## Scope

1. Change only the public CLI package name, executable name, version, usage string, and associated
   release validation and documentation.
2. Preserve flags, JSON output, detector behavior, database schema, package topology, dependency
   direction, and the private `@signal-hub/*` workspace names.
3. Continue to pack only `LICENSE`, `README.md`, `dist/index.js`, and `package.json`.
4. Verify a clean tarball install exposes `csv-to-signal` and produces the same deterministic output.
5. Stop after branch review and a verified tarball. Creating `v0.2.1` or publishing requires a new
   explicit approval for the exact merged commit and artifact.

## Verification

- [x] Focused CLI metadata, usage, executable, and package tests.
- [x] Frozen install, full build, 87 tests, typecheck, production and full dependency audits.
- [x] Dry-run package allowlist and real temporary tarball inspection.
- [x] Isolated install and `csv-to-signal analyze` smoke and error-path checks.
- Registry recheck immediately before any separately approved publish.

The branch candidate is 8,517 bytes, contains exactly four approved files, and has integrity
`sha512-2yy8IYlFEohj3KxTJuG7JcHTrkU4yh5QTPClJQNXBazQ3QnFNj2YtwyaaDdi1F5IfNZiqzjt7oEVoWK3V+Ustg==`.
It remains unpublished and untagged as `v0.2.1`.

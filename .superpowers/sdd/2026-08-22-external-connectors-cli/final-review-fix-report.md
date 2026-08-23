# Final review fix report

## Summary

Fixed both final-review findings. The parser now validates every occurrence of repeated options before returning (while retaining last-value-wins for valid repeats), and CSV command paths preserve their original leading/trailing spaces after nonblank validation. Added parser and `runCli` regressions covering invalid earlier values and no database/network side effects.

## RED evidence

Command:

```text
pnpm --filter csv-to-signal exec vitest run tests/arguments.test.ts tests/cli.test.ts
```

Result before implementation: 3 failures across 24 tests. The parser accepted invalid earlier values in repeated numeric options, trimmed the CSV path instead of preserving it, and `runCli` proceeded into the connector path (the mocked fetch setup then failed) rather than returning `Usage:`. These failures reproduced both review findings and the required side-effect regression.

## GREEN evidence

Focused tests, typecheck, and bundle:

```text
pnpm --filter csv-to-signal exec vitest run tests/arguments.test.ts tests/cli.test.ts
pnpm --filter csv-to-signal typecheck
pnpm --filter csv-to-signal build
```

Results: 2 test files passed, 24 tests passed; typecheck exited 0; bundle build exited 0 and emitted `dist/index.js`.

Full verification:

```text
pnpm test
pnpm release:check
git diff --check
```

Results: full workspace test completed successfully (17 tasks; CLI 29 tests, all workspace suites passing); release check completed successfully with 9 builds, 17 test tasks, 17 typecheck tasks, clear dependency audits, and release candidate package verification; `git diff --check` passed.

## Files changed

- `apps/cli/src/arguments.ts` — retain all flag occurrences for validation, validate every numeric/string occurrence, and preserve raw CSV paths.
- `apps/cli/tests/arguments.test.ts` — add the three invalid-earlier repeated numeric regressions and raw CSV path regression.
- `apps/cli/tests/cli.test.ts` — add invalid-earlier repeated option no-side-effect regression.

## Self-review

- Confirmed valid repeated values still use the final occurrence for `minScore`, `threshold`, `windowMs`, `days`, and `vsCurrency`.
- Confirmed every occurrence is validated before command construction, storage creation, connector creation, or fetch.
- Confirmed CSV uses trimmed input only for blank/flag-like validation and returns the original nonblank `rawInput`; GitHub owner/repo and CoinGecko identifiers remain trimmed.
- Confirmed no package version, runtime baseline, record, documentation, shared contract, Core, schema, or connector implementation changed.
- Confirmed no live provider API was called; CLI provider tests use mocked `fetch`.
- Confirmed `git diff --check` passed.

## Concerns

None within the final-review fix scope.

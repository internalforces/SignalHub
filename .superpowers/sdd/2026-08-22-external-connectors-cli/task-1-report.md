# Task 1 Report: Pure command and option parser

## Implementation summary

Activated TASK-029 and added a dependency-free `parseCliArgs` implementation. The parser returns a discriminated `ParsedCliCommand` for CSV, GitHub, and CoinGecko commands, parses shared detector settings, applies CoinGecko defaults, uses the last repeated option value, and rejects malformed or invalid input with the complete `USAGE` string.

## RED

Command:

```text
pnpm --filter csv-to-signal exec vitest run tests/arguments.test.ts
```

Output: failed before implementation because Vitest could not resolve `../src/arguments.js`; the parser module did not yet exist. This was expected for the initial failing-test phase.

## GREEN

Commands:

```text
pnpm --filter csv-to-signal exec vitest run tests/arguments.test.ts
pnpm --filter csv-to-signal typecheck
```

Output: parser test file passed with 6 tests; TypeScript typecheck exited 0.

## Files changed

- `tasks/active.md` — activated TASK-029 and updated the date.
- `apps/cli/src/arguments.ts` — added pure command/option parser, types, and usage text.
- `apps/cli/tests/arguments.test.ts` — added parser behavior and validation tests.

## Self-review

- Confirmed parser imports no connectors, storage, Core, environment, or network modules.
- Confirmed source-specific flags are rejected for other commands and repeated options resolve to the last value.
- Confirmed invalid numeric, missing, empty, positional, and source-specific inputs throw `Error(USAGE)`.
- Ran `git diff --check` successfully.

## Concerns

None for the scope of Task 1. Full integration and release checks remain for later tasks in TASK-029.

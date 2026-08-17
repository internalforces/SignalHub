# Development guide

## Prerequisites and setup

Signal Hub supports Node.js `^20.0.0 || ^22.0.0 || >=24.0.0` and pins pnpm 9.7.0 through the
root manifest.

```bash
corepack enable
pnpm install --frozen-lockfile
```

No environment file, service, or local database setup is required for the test suite. GitHub and
CoinGecko credentials are needed only when a caller chooses to exercise authenticated live API
requests.

## Repository structure

```text
SignalHub/
├── apps/cli/                 # CSV command-line application
├── connectors/
│   ├── csv/                  # strict local CSV input
│   ├── github/               # UTC daily GitHub commit counts
│   └── coingecko/            # CoinGecko market-chart prices
├── packages/
│   ├── types/                # shared DataPoint, Signal, Detector, Connector contracts
│   ├── connector-sdk/        # connector validation and contract re-exports
│   ├── storage/              # SQLite repositories
│   ├── analysis/             # detectors and scoring
│   └── core/                 # pipeline orchestration and JSON formatting
├── docs/                     # user guides and milestone plans
├── memory/                   # internal project state and decisions
└── tasks/                    # active, backlog, and completed work records
```

There are nine buildable workspaces: one CLI app, three connectors, and five shared packages.
Each workspace compiles independently with TypeScript; Turborepo orders dependency builds.

## Development commands

Run these from the repository root:

```bash
pnpm build                         # build all 9 workspaces
pnpm test                          # run all Vitest suites
pnpm typecheck                     # type-check all workspaces without emitting files
pnpm audit --prod --audit-level=high
pnpm audit                         # full dependency audit for maintenance work
pnpm release:check                 # validate a local CLI tarball end to end
```

To work on one package:

```bash
pnpm --filter @signal-hub/analysis build
pnpm --filter @signal-hub/analysis test
pnpm --filter @signal-hub/analysis typecheck
pnpm --filter csv-to-signal test
```

The CLI package's test command builds its workspace dependencies and its executable first, so it
also works from a clean checkout. There is currently no configured lint, format, or coverage
command.

## Test strategy

- Unit tests cover shared contracts, validation, repositories, each detector, scoring, and output
  formatting.
- Connector tests mock network requests; normal test runs do not call GitHub or CoinGecko.
- Core tests use an in-memory SQLite database.
- CLI tests use temporary directories and real CSV files, including the built executable.
- Pull-request CI validates Node 20, 22, and 24 with a frozen install, production dependency audit,
  build, tests, and type-checking. Node 22 additionally runs the complete release-candidate check.
- A separate Node 24 dependency-audit workflow runs the full dependency audit every Monday at
  00:00 UTC and can also be triggered manually. Both workflows use Actions v6 with read-only
  repository permissions.

When documentation includes a command or output example, run it against the built code before
requesting review.

## Package dependency rules

Dependency direction is intentionally one-way:

```text
connectors/* -> connector-sdk, types
storage      -> types
analysis     -> types
core         -> storage, analysis, connector-sdk, types
apps/cli     -> core, connectors/csv, analysis, storage, types
```

- Connectors must never import Core.
- Storage must never import Analysis.
- Only Core may import Storage, Analysis, and Connector SDK together.
- The CLI is the composition root but must not contain pipeline logic.
- No package outside Storage may access SQLite directly.

These rules are enforced through package manifests and review rather than lint tooling.

## Local data and release status

The CLI creates `data.db` in its current working directory. Tests that use storage must use
SQLite's `:memory:` path.

The workspace root and internal libraries remain private. The `csv-to-signal@0.3.0` CLI with
windowed analysis is published on npm. Its build bundles private workspace code
and keeps `better-sqlite3` as the only external runtime dependency. A strict file allowlist prevents
source, tests, caches, logs, configuration, and local databases from entering the tarball.

`pnpm release:check` creates package artifacts only in a temporary directory, installs the tarball
into an isolated consumer project, exercises valid and invalid CLI paths, prints artifact metadata,
and deletes the temporary files. Any npm publish, registry access change, tag, release, or deployment
still requires separate explicit human approval.

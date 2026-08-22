# GitHub and CoinGecko CLI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backward-compatible `github` and `coingecko` commands to the `csv-to-signal` CLI by composing the two existing connector libraries through the unchanged Core pipeline.

**Architecture:** Split pure argument validation into `apps/cli/src/arguments.ts`, leaving `apps/cli/src/cli.ts` as the composition root that selects a connector, creates the existing detectors, opens SQLite, and calls `runPipeline`. The CLI reads optional provider credentials from an injected environment view defaulting to `process.env`, which makes credential behavior deterministic in tests without adding production-only hooks.

**Tech Stack:** TypeScript strict mode, Node.js `^20.0.0 || ^22.0.0 || ^24.0.0`, ESM/NodeNext, pnpm workspaces, Turborepo, Vitest 4.1.10, esbuild 0.25.12, better-sqlite3 12.9.0.

**Spec:** `docs/superpowers/specs/2026-08-22-external-connectors-cli-design.md`

## Global Constraints

- Keep `csv-to-signal analyze <file.csv>` backward compatible.
- Add `github <owner>/<repo>` and `coingecko <coin-id>` as sibling commands.
- Keep stdout as a pretty-printed JSON `Signal[]` and keep `data.db` in the current working directory.
- Do not change shared types, connector implementations, Core behavior, SQLite schema, package/executable name, or published version `0.3.0`.
- Do not add an external dependency; the two existing private connector workspaces are build-time CLI dependencies and must be bundled.
- `better-sqlite3` must remain the only registry runtime dependency.
- Read optional credentials only from `GITHUB_TOKEN` and `COINGECKO_DEMO_API_KEY`; never accept, print, persist, or include them in errors.
- Automated tests must mock network access; do not make a live provider request.
- Do not tag, publish, deploy, or modify infrastructure.

---

### Task 1: Pure command and option parser

**Files:**
- Modify: `tasks/active.md`
- Create: `apps/cli/src/arguments.ts`
- Create: `apps/cli/tests/arguments.test.ts`

**Interfaces:**
- Produces: `parseCliArgs(args: string[]): ParsedCliCommand`.
- Produces: `ParsedCliCommand`, a discriminated union with `source: "csv" | "github" | "coingecko"` and shared `minScore`, `threshold`, and `windowMs` detector settings.
- Produces: `USAGE`, the complete three-command usage string used by parser errors.
- Consumes: no connector, storage, Core, environment, or network dependency.

- [ ] **Step 1: Activate the approved task**

Replace `No active task.` in `tasks/active.md` with:

```markdown
### TASK-029: GitHub and CoinGecko CLI Integration
- **Owner**: Implementer
- **Priority**: High
- **Milestone**: M8
- **Description**: Add backward-compatible CLI commands for the existing GitHub and CoinGecko connectors.
- **Definition of Done**:
  - [ ] Existing CSV command remains compatible
  - [ ] GitHub and CoinGecko commands use the unchanged Core pipeline
  - [ ] Optional environment credentials are never exposed
  - [ ] Invalid input causes no database or network side effect
  - [ ] Build, tests, typecheck, audits, package inspection, and release check pass
```

Update the file's `_Last updated` value to `2026-08-22`.

- [ ] **Step 2: Write the failing parser tests**

Create `apps/cli/tests/arguments.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../src/arguments.js";

describe("parseCliArgs", () => {
  it("preserves the CSV command and parses shared detector options", () => {
    expect(
      parseCliArgs([
        "analyze",
        "prices.csv",
        "--min-score",
        "40",
        "--threshold",
        "120",
        "--window-hours",
        "24",
      ]),
    ).toEqual({
      source: "csv",
      filePath: "prices.csv",
      minScore: 40,
      threshold: 120,
      windowMs: 86_400_000,
    });
  });

  it("parses a GitHub owner/repository input", () => {
    expect(parseCliArgs(["github", " octocat/Hello-World "])).toEqual({
      source: "github",
      owner: "octocat",
      repo: "Hello-World",
      minScore: undefined,
      threshold: undefined,
      windowMs: undefined,
    });
  });

  it("parses CoinGecko defaults and explicit source options", () => {
    expect(parseCliArgs(["coingecko", "bitcoin"])).toEqual({
      source: "coingecko",
      coinId: "bitcoin",
      vsCurrency: "usd",
      historyDays: 30,
      minScore: undefined,
      threshold: undefined,
      windowMs: undefined,
    });
    expect(
      parseCliArgs([
        "coingecko",
        "ethereum",
        "--vs-currency",
        " KRW ",
        "--days",
        "7",
      ]),
    ).toMatchObject({ coinId: "ethereum", vsCurrency: "KRW", historyDays: 7 });
  });

  it("uses the last repeated option value", () => {
    expect(
      parseCliArgs([
        "coingecko",
        "bitcoin",
        "--days",
        "7",
        "--days",
        "30",
        "--window-hours",
        "24",
        "--window-hours",
        "12",
      ]),
    ).toMatchObject({ historyDays: 30, windowMs: 43_200_000 });
  });

  it("rejects malformed commands, positions, and source-specific options", () => {
    expect(() => parseCliArgs([])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["bogus", "value"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["analyze", "--threshold", "1"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["github", "owner"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["github", "/repo"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["github", "owner/repo/extra"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["github", "owner/repo", "--days", "7"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["analyze", "prices.csv", "extra"])).toThrow(/Usage:/);
  });

  it("rejects missing, empty, and invalid option values", () => {
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--days"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--days", "0"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--days", "1.5"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--vs-currency", " "])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--min-score", "nope"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--window-hours", "0"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--window-hours", "1e308"])).toThrow(/Usage:/);
  });
});
```

- [ ] **Step 3: Run the parser tests to verify they fail**

Run:

```bash
pnpm --filter csv-to-signal exec vitest run tests/arguments.test.ts
```

Expected: FAIL because `../src/arguments.js` does not exist.

- [ ] **Step 4: Implement the pure parser**

Create `apps/cli/src/arguments.ts`:

```typescript
const HOUR_MS = 60 * 60 * 1000;
const COMMON_FLAGS = ["--min-score", "--threshold", "--window-hours"] as const;

export const USAGE = [
  "Usage:",
  "  csv-to-signal analyze <file.csv> [--min-score <n>] [--threshold <n>] [--window-hours <n>]",
  "  csv-to-signal github <owner>/<repo> [--min-score <n>] [--threshold <n>] [--window-hours <n>]",
  "  csv-to-signal coingecko <coin-id> [--vs-currency <currency>] [--days <n>] [--min-score <n>] [--threshold <n>] [--window-hours <n>]",
].join("\n");

interface DetectorOptions {
  minScore: number | undefined;
  threshold: number | undefined;
  windowMs: number | undefined;
}

export type ParsedCliCommand =
  | ({ source: "csv"; filePath: string } & DetectorOptions)
  | ({ source: "github"; owner: string; repo: string } & DetectorOptions)
  | ({
      source: "coingecko";
      coinId: string;
      vsCurrency: string;
      historyDays: number;
    } & DetectorOptions);

export function parseCliArgs(args: string[]): ParsedCliCommand {
  const [command, rawInput, ...rest] = args;
  const input = rawInput?.trim();
  if (!command || !input || input.startsWith("--")) {
    throw new Error(USAGE);
  }

  const allowedFlags = new Set<string>(COMMON_FLAGS);
  if (command === "coingecko") {
    allowedFlags.add("--vs-currency");
    allowedFlags.add("--days");
  } else if (command !== "analyze" && command !== "github") {
    throw new Error(USAGE);
  }

  const values = readFlagValues(rest, allowedFlags);
  const detectorOptions: DetectorOptions = {
    minScore: readFiniteNumber(values.get("--min-score")),
    threshold: readFiniteNumber(values.get("--threshold")),
    windowMs: readWindowMs(values.get("--window-hours")),
  };

  if (command === "analyze") {
    return { source: "csv", filePath: input, ...detectorOptions };
  }

  if (command === "github") {
    const segments = input.split("/").map((segment) => segment.trim());
    if (segments.length !== 2 || segments.some((segment) => segment.length === 0)) {
      throw new Error(USAGE);
    }
    return { source: "github", owner: segments[0], repo: segments[1], ...detectorOptions };
  }

  const vsCurrency = (values.get("--vs-currency") ?? "usd").trim();
  const rawDays = values.get("--days") ?? "30";
  const historyDays = Number(rawDays);
  if (!vsCurrency || !Number.isInteger(historyDays) || historyDays <= 0) {
    throw new Error(USAGE);
  }

  return {
    source: "coingecko",
    coinId: input,
    vsCurrency,
    historyDays,
    ...detectorOptions,
  };
}

function readFlagValues(args: string[], allowedFlags: ReadonlySet<string>): Map<string, string> {
  if (args.length % 2 !== 0) {
    throw new Error(USAGE);
  }

  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const rawValue = args[index + 1];
    if (!allowedFlags.has(flag) || !rawValue || rawValue.trim().length === 0 || rawValue.startsWith("--")) {
      throw new Error(USAGE);
    }
    values.set(flag, rawValue);
  }
  return values;
}

function readFiniteNumber(rawValue: string | undefined): number | undefined {
  if (rawValue === undefined) {
    return undefined;
  }
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    throw new Error(USAGE);
  }
  return value;
}

function readWindowMs(rawValue: string | undefined): number | undefined {
  const hours = readFiniteNumber(rawValue);
  if (hours === undefined) {
    return undefined;
  }
  const windowMs = hours * HOUR_MS;
  if (windowMs <= 0 || !Number.isFinite(windowMs)) {
    throw new Error(USAGE);
  }
  return windowMs;
}
```

- [ ] **Step 5: Run the parser tests to verify they pass**

Run:

```bash
pnpm --filter csv-to-signal exec vitest run tests/arguments.test.ts
pnpm --filter csv-to-signal typecheck
```

Expected: parser tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit the parser task**

```bash
git add tasks/active.md apps/cli/src/arguments.ts apps/cli/tests/arguments.test.ts
git commit -m "feat(cli): parse external connector commands"
```

---

### Task 2: Compose GitHub and CoinGecko connectors in the CLI

**Files:**
- Modify: `apps/cli/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `apps/cli/src/cli.ts`
- Modify: `apps/cli/tests/cli.test.ts`

**Interfaces:**
- Consumes: `parseCliArgs(args)` from Task 1.
- Consumes: `GitHubConnector`, `CoinGeckoConnector`, `CsvConnector`, `Connector`, existing detectors, `SqliteStorage`, and `runPipeline`.
- Produces: `CliEnvironment { GITHUB_TOKEN?: string; COINGECKO_DEMO_API_KEY?: string }`.
- Produces: `runCli(args: string[], environment?: CliEnvironment): Promise<string>`; the default environment is `process.env`.

- [ ] **Step 1: Add existing workspace connectors to the CLI build graph**

Add these exact entries to `apps/cli/package.json` `devDependencies`:

```json
"@signal-hub/connector-coingecko": "0.1.0",
"@signal-hub/connector-github": "0.1.0"
```

Refresh only dependency metadata:

```bash
pnpm install --lockfile-only
pnpm --filter csv-to-signal... build
```

Expected: lockfile refresh and dependency-ordered build exit 0; no new registry dependency appears.

- [ ] **Step 2: Write failing CLI integration tests**

In `apps/cli/tests/cli.test.ts`, add `vi` to the Vitest import and add:

```typescript
function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function commit(sha: string, date: string): unknown {
  return { sha, commit: { committer: { date } } };
}
```

Add `vi.unstubAllGlobals();` to the existing `afterEach`, then add these tests:

```typescript
it("analyzes GitHub commits and forwards a trimmed optional token", async () => {
  const fetch = vi.fn().mockResolvedValue(
    jsonResponse([
      commit("first", "2026-08-01T12:00:00Z"),
      commit("second", "2026-08-02T12:00:00Z"),
      commit("third", "2026-08-02T13:00:00Z"),
    ]),
  );
  vi.stubGlobal("fetch", fetch);

  const signals = JSON.parse(
    await runCli(["github", "octocat/Hello-World"], { GITHUB_TOKEN: " test-token " }),
  ) as Array<{ metricId: string }>;

  expect(signals).toHaveLength(1);
  expect(signals[0].metricId).toBe("github:octocat/Hello-World:commits");
  expect(fetch.mock.calls[0][1]?.headers).toMatchObject({
    Authorization: "Bearer test-token",
  });
});

it("omits GitHub authorization when the environment token is blank", async () => {
  const fetch = vi.fn().mockResolvedValue(jsonResponse([]));
  vi.stubGlobal("fetch", fetch);

  await runCli(["github", "octocat/Hello-World"], { GITHUB_TOKEN: "   " });

  expect(fetch.mock.calls[0][1]?.headers).not.toHaveProperty("Authorization");
});

it("analyzes CoinGecko prices with defaults and an optional Demo key", async () => {
  const fetch = vi.fn().mockResolvedValue(
    jsonResponse({
      prices: [
        [Date.parse("2026-08-01T00:00:00.000Z"), 100],
        [Date.parse("2026-08-02T00:00:00.000Z"), 125],
      ],
    }),
  );
  vi.stubGlobal("fetch", fetch);

  const signals = JSON.parse(
    await runCli(["coingecko", "bitcoin"], {
      COINGECKO_DEMO_API_KEY: " demo-key ",
    }),
  ) as Array<{ metricId: string }>;

  expect(signals).toHaveLength(1);
  expect(signals[0].metricId).toBe("coingecko:bitcoin:price:usd");
  expect(fetch.mock.calls[0][0]).toBe(
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30",
  );
  expect(fetch.mock.calls[0][1]?.headers).toMatchObject({
    "x-cg-demo-api-key": "demo-key",
  });
});

it("uses CoinGecko keyless access when the Demo key is blank", async () => {
  const fetch = vi.fn().mockResolvedValue(jsonResponse({ prices: [] }));
  vi.stubGlobal("fetch", fetch);

  await runCli(["coingecko", "bitcoin"], { COINGECKO_DEMO_API_KEY: "   " });

  expect(fetch.mock.calls[0][1]?.headers).not.toHaveProperty("x-cg-demo-api-key");
});

it("applies explicit CoinGecko source and shared detector options", async () => {
  const fetch = vi.fn().mockResolvedValue(
    jsonResponse({
      prices: [
        [Date.parse("2026-08-01T00:00:00.000Z"), 100],
        [Date.parse("2026-08-02T00:00:00.000Z"), 150],
      ],
    }),
  );
  vi.stubGlobal("fetch", fetch);

  const signals = JSON.parse(
    await runCli([
      "coingecko",
      "ethereum",
      "--vs-currency",
      "krw",
      "--days",
      "7",
      "--threshold",
      "120",
      "--window-hours",
      "24",
    ]),
  ) as Array<{ metricId: string; type: string }>;

  expect(signals.some((signal) => signal.type === "threshold")).toBe(true);
  expect(signals.every((signal) => signal.metricId === "coingecko:ethereum:price:krw")).toBe(true);
  expect(fetch.mock.calls[0][0]).toContain("vs_currency=krw&days=7");
});

it("rejects external-source usage before database or network side effects", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);

  await expect(runCli(["github", "owner"])).rejects.toThrow(/Usage:/);
  await expect(runCli(["coingecko", "bitcoin", "--days", "0"])).rejects.toThrow(/Usage:/);

  expect(fetch).not.toHaveBeenCalled();
  expect(existsSync(join(directory, "data.db"))).toBe(false);
});

it("does not expose environment credentials in provider errors", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response("forbidden", { status: 403 }));
  vi.stubGlobal("fetch", fetch);

  const result = runCli(["github", "octocat/private-repo"], {
    GITHUB_TOKEN: "must-not-appear",
  });
  await expect(result).rejects.toThrow("status 403");
  await expect(result).rejects.not.toThrow("must-not-appear");
});
```

- [ ] **Step 3: Run the CLI tests to verify they fail**

Run:

```bash
pnpm --filter csv-to-signal exec vitest run tests/cli.test.ts
```

Expected: FAIL because `runCli` still accepts only one argument and only supports `analyze`.

- [ ] **Step 4: Replace the CLI composition with the approved connector selection**

Replace `apps/cli/src/cli.ts` with:

```typescript
import { resolve } from "node:path";
import {
  PercentageChangeDetector,
  ThresholdDetector,
  WindowedChangeDetector,
} from "@signal-hub/analysis";
import { CoinGeckoConnector } from "@signal-hub/connector-coingecko";
import { CsvConnector } from "@signal-hub/connector-csv";
import { GitHubConnector } from "@signal-hub/connector-github";
import { formatSignals, runPipeline } from "@signal-hub/core";
import { SqliteStorage } from "@signal-hub/storage";
import type { Connector, Detector } from "@signal-hub/types";
import { parseCliArgs, type ParsedCliCommand } from "./arguments.js";

export interface CliEnvironment {
  GITHUB_TOKEN?: string;
  COINGECKO_DEMO_API_KEY?: string;
}

export async function runCli(
  args: string[],
  environment: CliEnvironment = process.env,
): Promise<string> {
  const command = parseCliArgs(args);
  const connector = createConnector(command, environment);
  const detectors = createDetectors(command);
  const storage = new SqliteStorage(resolve(process.cwd(), "data.db"));

  try {
    const signals = await runPipeline(connector, storage, {
      detectors,
      minScore: command.minScore,
    });
    return formatSignals(signals);
  } finally {
    storage.close();
  }
}

function createConnector(command: ParsedCliCommand, environment: CliEnvironment): Connector {
  if (command.source === "csv") {
    return new CsvConnector(resolve(process.cwd(), command.filePath));
  }
  if (command.source === "github") {
    return new GitHubConnector({
      owner: command.owner,
      repo: command.repo,
      token: optionalCredential(environment.GITHUB_TOKEN),
    });
  }
  return new CoinGeckoConnector({
    coinId: command.coinId,
    vsCurrency: command.vsCurrency,
    historyDays: command.historyDays,
    apiKey: optionalCredential(environment.COINGECKO_DEMO_API_KEY),
  });
}

function createDetectors(command: ParsedCliCommand): Detector[] {
  const detectors: Detector[] = [new PercentageChangeDetector()];
  if (command.threshold !== undefined) {
    detectors.push(new ThresholdDetector(command.threshold));
  }
  if (command.windowMs !== undefined) {
    detectors.push(new WindowedChangeDetector(command.windowMs));
  }
  return detectors;
}

function optionalCredential(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}
```

- [ ] **Step 5: Run focused tests and typecheck to verify they pass**

Run:

```bash
pnpm --filter csv-to-signal exec vitest run tests/arguments.test.ts tests/cli.test.ts
pnpm --filter csv-to-signal typecheck
pnpm --filter csv-to-signal build
```

Expected: focused tests PASS, typecheck exits 0, and esbuild produces `apps/cli/dist/index.js` with no unresolved private imports.

- [ ] **Step 6: Commit connector composition**

```bash
git add apps/cli/package.json pnpm-lock.yaml apps/cli/src/cli.ts apps/cli/tests/cli.test.ts
git commit -m "feat(cli): analyze GitHub and CoinGecko sources"
```

---

### Task 3: Lock the package and bundle boundary

**Files:**
- Modify: `apps/cli/package.json`
- Modify: `apps/cli/tests/package.test.ts`

**Interfaces:**
- Produces: package metadata describing CSV, GitHub, and CoinGecko analysis.
- Preserves: exact private connector development dependencies, the four-file tarball allowlist, and `better-sqlite3` as the only runtime dependency.

- [ ] **Step 1: Write the failing package metadata assertions**

Add `description?: string` and `keywords?: string[]` to `PackageManifest` in
`apps/cli/tests/package.test.ts`. Extend the first test with:

```typescript
expect(manifest.description).toBe(
  "Deterministic CSV, GitHub, and CoinGecko time-series signal analysis from the command line",
);
expect(manifest.keywords).toEqual([
  "cli",
  "csv",
  "github",
  "coingecko",
  "signals",
  "sqlite",
  "time-series",
]);
expect(manifest.devDependencies).toMatchObject({
  "@signal-hub/connector-coingecko": "0.1.0",
  "@signal-hub/connector-github": "0.1.0",
});
```

- [ ] **Step 2: Run the package test to verify it fails**

Run:

```bash
pnpm --filter csv-to-signal exec vitest run tests/package.test.ts
```

Expected: FAIL because the manifest description and keyword list still describe CSV only.

- [ ] **Step 3: Update the package metadata**

In `apps/cli/package.json`, set:

```json
"description": "Deterministic CSV, GitHub, and CoinGecko time-series signal analysis from the command line"
```

Set `keywords` to:

```json
[
  "cli",
  "csv",
  "github",
  "coingecko",
  "signals",
  "sqlite",
  "time-series"
]
```

Do not change `name`, `version`, `bin`, `files`, `engines`, `dependencies`, or `publishConfig`.

- [ ] **Step 4: Verify package tests and the tarball boundary**

Run:

Run from the repository root:

```bash
pnpm --filter csv-to-signal build
pnpm --filter csv-to-signal exec vitest run tests/package.test.ts tests/bin.test.ts
```

Then run from `apps/cli`:

```bash
npm pack --dry-run --json --ignore-scripts
```

Expected: tests PASS; the dry run lists only `LICENSE`, `README.md`, `dist/index.js`, and
`package.json`; the bundled executable contains no `@signal-hub/` import.

- [ ] **Step 5: Commit package metadata and regression coverage**

```bash
git add apps/cli/package.json apps/cli/tests/package.test.ts
git commit -m "test(cli): lock external connector bundle metadata"
```

---

### Task 4: Update user and developer documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/README.ko.md`
- Modify: `apps/cli/README.md`
- Modify: `docs/library-usage.md`
- Modify: `docs/development.md`
- Modify: `dependencies.md`

**Interfaces:**
- Documents: repository-built commands, source-specific options, shared detector options, optional environment credentials, unchanged database/output behavior, and unpublished status.
- Preserves: clear separation between the published npm `0.3.0` artifact and the newly implemented but unpublished repository commands.

- [ ] **Step 1: Update the English CLI command reference**

In both `README.md` and `apps/cli/README.md`, include this command block:

```text
csv-to-signal analyze <file.csv> [--min-score <n>] [--threshold <n>] [--window-hours <n>]
csv-to-signal github <owner>/<repo> [--min-score <n>] [--threshold <n>] [--window-hours <n>]
csv-to-signal coingecko <coin-id> [--vs-currency <currency>] [--days <n>] [--min-score <n>] [--threshold <n>] [--window-hours <n>]
```

Document these exact source behaviors:

```markdown
- `github <owner>/<repo>` analyzes UTC daily commit counts. Public repositories need no token;
  set `GITHUB_TOKEN` for private access.
- `coingecko <coin-id>` analyzes market-chart prices. `--vs-currency` defaults to `usd` and
  `--days` defaults to `30`; set `COINGECKO_DEMO_API_KEY` to use a Demo key.
- Credentials are read from the environment only and are never accepted as CLI arguments.
```

State that the repository build includes these commands while npm `csv-to-signal@0.3.0` remains
the previously published CSV/windowed release and no new version is published by TASK-029.

- [ ] **Step 2: Update the Korean guide**

Add the same three-command block to `docs/README.ko.md` and document:

```markdown
- `github <owner>/<repo>`는 UTC 날짜별 커밋 수를 분석합니다. 공개 저장소는 토큰 없이
  사용할 수 있고, 비공개 저장소는 `GITHUB_TOKEN`을 설정합니다.
- `coingecko <coin-id>`는 시장 가격 기록을 분석합니다. `--vs-currency` 기본값은 `usd`,
  `--days` 기본값은 `30`이며 Demo 키는 `COINGECKO_DEMO_API_KEY`로 전달합니다.
- 인증정보는 환경변수에서만 읽으며 명령 인수로 받지 않습니다.
```

State that these commands are in the repository build and are not a new npm publication.

- [ ] **Step 3: Reconcile library and development guidance**

In `docs/library-usage.md`, replace the statement that the connectors are not wired to the CLI
with:

```markdown
The GitHub and CoinGecko connectors can be composed directly as private workspace libraries and
are also available through the repository-built `csv-to-signal github` and
`csv-to-signal coingecko` commands. The published npm `0.3.0` artifact predates these commands.
```

In `docs/development.md`:

- Change `apps/cli/` to describe the CSV, GitHub, and CoinGecko composition root.
- Change the dependency diagram line to
  `apps/cli -> core, connectors/{csv,github,coingecko}, analysis, storage, types`.
- State that CLI external-source tests mock `globalThis.fetch` and never call providers.
- State that optional live credentials are `GITHUB_TOKEN` and `COINGECKO_DEMO_API_KEY`.

In `dependencies.md`, change the external-service notes to:

```markdown
| GitHub REST API | GitHub commit time-series ingestion | Optional `GITHUB_TOKEN` supplied by the CLI or explicit library constructor option | Public repositories can be queried without authentication; CLI integration is available in the repository build |
| CoinGecko public/Demo API | Market-chart price ingestion | Optional `COINGECKO_DEMO_API_KEY` supplied by the CLI or explicit library constructor option | Keyless public access and Demo-key access are supported; CLI integration is available in the repository build |
```

- [ ] **Step 4: Check documentation for stale scope claims and secrets**

Run:

```bash
rg -n "not connected|not wired|not CLI commands|CSV command-line application|connectors/csv" README.md apps/cli/README.md docs/README.ko.md docs/library-usage.md docs/development.md dependencies.md
rg -n "GITHUB_TOKEN|COINGECKO_DEMO_API_KEY" README.md apps/cli/README.md docs/README.ko.md docs/library-usage.md docs/development.md dependencies.md
git diff --check
```

Expected: the first search returns no stale CLI-scope claim; the second returns only credential
variable names and explanatory examples, never values; `git diff --check` exits 0.

- [ ] **Step 5: Commit documentation**

```bash
git add README.md docs/README.ko.md apps/cli/README.md docs/library-usage.md docs/development.md dependencies.md
git commit -m "docs(cli): document external connector commands"
```

---

### Task 5: Verify the complete change and reconcile project records

**Files:**
- Modify: `memory/project.md`
- Modify: `memory/architecture.md`
- Modify: `memory/decisions.md`
- Modify: `memory/session.md`
- Modify: `tasks/active.md`
- Modify: `tasks/completed.md`

**Interfaces:**
- Records: TASK-029 completion and ADR-022.
- Verifies: all workspace behavior, dependency health, standalone bundle, installed CSV compatibility, and package contents without publishing.

- [ ] **Step 1: Run focused and workspace verification**

Run:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm typecheck
pnpm audit --prod --audit-level=high
pnpm audit
pnpm release:check
```

Expected: every command exits 0; all tests pass; audits report no known vulnerabilities; the
release check builds, packs, installs, and exercises the unchanged CSV command without publishing.

- [ ] **Step 2: Verify dependency direction and secret handling mechanically**

Run:

```bash
rg -n '"dependencies"|"devDependencies"|@signal-hub/connector-(github|coingecko)|better-sqlite3' apps/cli/package.json connectors/github/package.json connectors/coingecko/package.json
rg -n "GITHUB_TOKEN|COINGECKO_DEMO_API_KEY" apps/cli/src apps/cli/tests
rg -n "console\.(log|error)|Authorization|x-cg-demo-api-key" apps/cli/src connectors/github/src connectors/coingecko/src
git diff --check
```

Expected: connector packages still depend only on connector-sdk/types; CLI references credentials
only in the environment boundary and synthetic tests; no logging statement emits them; formatting
checks pass.

- [ ] **Step 3: Record the accepted architecture decision**

Append to `memory/decisions.md`:

```markdown
### ADR-022: Add Backward-Compatible External Connector CLI Commands

- **Date**: 2026-08-22
- **Status**: Accepted and implemented
- **Decided by**: Project owner

**Context**: GitHub and CoinGecko connectors were complete private workspace libraries, but users
of the CLI could analyze only CSV files. Replacing the existing `analyze <file.csv>` shape would
break published scripts, while connector-specific normalization already belongs in the libraries.

**Decision**: Preserve `analyze <file.csv>` and add sibling `github <owner>/<repo>` and
`coingecko <coin-id>` commands. Reuse the existing detector options and Core pipeline. Read optional
credentials only from `GITHUB_TOKEN` and `COINGECKO_DEMO_API_KEY`, bundle both private connectors,
and keep `better-sqlite3` as the sole registry runtime dependency.

**Rationale**: Additive commands provide clear source-specific validation without changing shared
contracts, schema, output, or existing CSV invocations.

**Trade-offs**: The public package name remains CSV-oriented, connector diagnostics remain internal,
and the repository feature is not available from npm until a separately approved release.

**Consequences**: TASK-029 exposes both existing connectors through the repository-built CLI with
mocked-network regression coverage. No package version, publication, deployment, schema, Core, or
connector implementation changed.
```

- [ ] **Step 4: Update architecture and project summaries**

In `memory/architecture.md`:

- Change the CLI component description to list CSV, GitHub, and CoinGecko commands.
- Change the CLI dependency constraint to include all three connector workspaces.
- Add the ADR-022 command choice to the decision summary.
- Replace statements that CoinGecko or GitHub CLI integration is deferred with the completed
  TASK-029 boundary; keep Polymarket, generic REST, configuration, scheduling, and all other DEFER
  items unchanged.

In `memory/project.md`:

- Set the session phase to M8 implementation complete without changing the published npm version.
- Add TASK-029 to Recent Changes.
- Change the constraints that say GitHub/CoinGecko CLI integration remains deferred.
- State that repository builds expose both commands while npm `csv-to-signal@0.3.0` remains the
  latest published release.

- [ ] **Step 5: Archive TASK-029 and update the session handoff**

Restore `tasks/active.md` to `No active task.` and append this row to `tasks/completed.md`:

```markdown
| TASK-029 | GitHub and CoinGecko CLI Integration | 2026-08-22 | Implementer | Added backward-compatible external-source commands with environment-only optional credentials, shared detector composition, mocked-network CLI coverage, documentation, and complete package verification; no publication performed |
```

Append a `2026-08-22 (External connector CLI implementation)` section to `memory/session.md` that
records:

```markdown
- TASK-029 completed the approved GitHub and CoinGecko CLI integration.
- Existing CSV behavior, JSON output, SQLite schema, Core pipeline, and connector implementations remain unchanged.
- Optional credentials are environment-only and were covered with synthetic, redaction-safe tests.
- Frozen install, build, all tests, typecheck, both audits, package inspection, and release check pass.
- `csv-to-signal@0.3.0` remains npm `latest`; no tag, publication, deployment, or live API request occurred.
```

Update each touched record's `_Last updated` date to `2026-08-22`.

- [ ] **Step 6: Run the final record and worktree checks**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors; only TASK-029 implementation, documentation, plan, and project
record files are changed. Pre-existing user changes to `memory/known-issues.md` and earlier
`memory/session.md` entries remain preserved.

- [ ] **Step 7: Commit project records**

```bash
git add memory/project.md memory/architecture.md memory/decisions.md memory/session.md tasks/active.md tasks/completed.md
git commit -m "docs(project): complete external connector CLI integration"
```

- [ ] **Step 8: Review the complete branch without publishing**

Run:

```bash
git status --short --branch
git log -6 --oneline --decorate
```

Expected: implementation commits are present, no required work remains, and no tag, npm publish,
deployment, push, or merge has occurred.

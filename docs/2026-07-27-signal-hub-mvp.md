# Signal Hub MVP (Phase 1 Vertical Slice) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 1 vertical slice of Signal Hub: `CSV → Core → Detector → Signal → CLI`, so that `signal-hub analyze data.csv` prints ranked JSON signals.

**Architecture:** A pnpm/Turborepo monorepo with strict one-directional dependencies (`cli → {core, connectors/csv, analysis, storage, types}`, `core → {storage, analysis, connector-sdk, types}`, `connectors/csv → {connector-sdk, types}`). The CSV connector maps raw rows to canonical `DataPoint`s. The CLI composes the connector, storage, and detectors; Core validates and deduplicates them into SQLite, runs stateless detectors per metric, scores the resulting signals, persists them, and returns them sorted for the CLI to print.

**Tech Stack:** TypeScript (strict, Node `^20.0.0 || ^22.0.0 || >=24.0.0`, ESM/NodeNext), pnpm workspaces, Turborepo, Vitest, better-sqlite3.

## Global Constraints

- Language: TypeScript strict mode, target ES2022, module/moduleResolution NodeNext, Node.js `^20.0.0 || ^22.0.0 || >=24.0.0`.
- Package manager: pnpm workspaces (`packageManager: pnpm@9.7.0`), task orchestration via Turborepo.
- Test runner: Vitest 4.1.10 with explicit Vite 6.4.3, zero-config, tests live in each package's `tests/` directory; in-memory SQLite (`:memory:`) for storage-touching tests.
- Signal model uses the simplified shape from the design review (no `confidence`/`baseline` fields): `{ id, metricId, type, score, direction, timestamp, value, changePercent }`.
- Only two detectors ship in this plan: `percentage-change` and `threshold`. Spike/anomaly/trend/change-point detection are explicitly deferred.
- No YAML config loader in this phase — the CLI uses flags (`--min-score`, `--threshold`) and sensible defaults. The `config` package and multi-source YAML wiring are deferred until a second data source exists.
- Storage: `better-sqlite3`, one SQLite file, repository pattern (`DataPointRepository`, `SignalRepository`) — no other package may talk to the database directly.
- Dependency direction is enforced by workspace deps only: `connectors/* → connector-sdk, types`; `storage → types`; `analysis → types`; `core → types, storage, analysis, connector-sdk`; `apps/cli → core, connectors/csv, analysis, storage, types`. The CLI composes pipeline dependencies and must not contain pipeline logic. Connectors must never import `core`; `storage` must never import `analysis`.
- Timestamps: connectors normalize to ISO 8601 UTC via `new Date(x).toISOString()` before returning `DataPoint`s.
- Out of scope for this plan (deferred to later plans): GitHub/CoinGecko/Polymarket/REST connectors, dashboard, alerting, LLM explainer, MCP server, distributed scheduling, config YAML loader.

---

## File Structure

```text
signal-hub/
├── package.json                          # root workspace + turbo scripts
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .gitignore
├── README.md
├── packages/
│   ├── types/                            # DataPoint, Signal, Detector, Connector interfaces
│   ├── connector-sdk/                    # isValidDataPoint() + re-exported Connector type
│   ├── storage/                          # SqliteStorage + repositories
│   ├── analysis/                         # PercentageChangeDetector, ThresholdDetector, scoreSignals
│   └── core/                             # runPipeline(), formatSignals()
├── connectors/
│   └── csv/                              # CsvConnector
└── apps/
    └── cli/                              # signal-hub analyze <file>
```

Each package/connector/app follows the same internal shape: `package.json`, `tsconfig.json`, `src/index.ts` (+ helper files), `tests/*.test.ts`.

---

### Task 1: Monorepo & Tooling Bootstrap

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Produces: the `pnpm`/`turbo` scripts (`build`, `test`, `typecheck`) and `tsconfig.base.json` that every later package extends via `"extends": "../../tsconfig.base.json"`.

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "signal-hub",
  "private": true,
  "packageManager": "pnpm@9.7.0",
  "engines": { "node": "^20.0.0 || ^22.0.0 || >=24.0.0" },
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "@types/node": "^20.19.43",
    "typescript": "^5.5.4",
    "turbo": "^2.0.9",
    "vite": "6.4.3",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "connectors/*"
```

- [ ] **Step 3: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

- [ ] **Step 4: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

- [ ] **Step 5: Create `.gitignore`**

```text
node_modules/
dist/
*.db
.turbo/
```

- [ ] **Step 6: Create `README.md`**

```markdown
# Signal Hub

A minimal, deterministic time-series to signal transformation engine.

```text
CSV -> Core -> Detector -> Signal -> CLI
```

## Quick start

\`\`\`bash
pnpm install
pnpm build
pnpm --filter signal-hub exec signal-hub analyze data.csv
\`\`\`

See `docs/superpowers/plans/` for the implementation plan.
```

- [ ] **Step 7: Verify install succeeds**

Run: `pnpm install`
Expected: exits 0 (no packages yet, so nothing to link — this just validates the workspace files are well-formed).

- [ ] **Step 8: Commit**

```bash
git init
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .gitignore README.md docs
git commit -m "chore: bootstrap pnpm/turborepo monorepo"
```

---

### Task 2: Shared Types Package (`@signal-hub/types`)

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Test: `packages/types/tests/types.test.ts`

**Interfaces:**
- Produces: `DataPoint`, `SignalType`, `Direction`, `Signal`, `Detector`, `Connector` — the canonical shapes every other package imports from `@signal-hub/types`.

- [ ] **Step 1: Create `packages/types/package.json`**

```json
{
  "name": "@signal-hub/types",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vite": "6.4.3",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Create `packages/types/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

- [ ] **Step 3: Write the failing test**

```typescript
// packages/types/tests/types.test.ts
import { describe, expect, it } from "vitest";
import type { Connector, DataPoint, Detector, Signal } from "../src/index.js";

describe("types", () => {
  it("accepts a well-formed DataPoint", () => {
    const point: DataPoint = { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 42 };
    expect(point.metricId).toBe("m1");
  });

  it("accepts a well-formed Signal", () => {
    const signal: Signal = {
      id: "s1",
      metricId: "m1",
      type: "increase",
      score: 80,
      direction: "up",
      timestamp: "2026-07-27T00:00:00.000Z",
      value: 42,
      changePercent: 12.5,
    };
    expect(signal.type).toBe("increase");
  });

  it("Detector.detect returns Signal[]", () => {
    const detector: Detector = { id: "noop", detect: () => [] };
    expect(detector.detect([])).toEqual([]);
  });

  it("Connector.fetch returns a Promise<DataPoint[]>", async () => {
    const connector: Connector = { id: "noop", fetch: async () => [] };
    await expect(connector.fetch()).resolves.toEqual([]);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd packages/types && npx vitest run`
Expected: FAIL — `../src/index.js` does not exist yet.

- [ ] **Step 5: Write the implementation**

```typescript
// packages/types/src/index.ts
export interface DataPoint {
  metricId: string;
  timestamp: string; // ISO 8601 UTC
  value: number;
}

export type SignalType = "increase" | "decrease" | "spike" | "drop" | "threshold";
export type Direction = "up" | "down";

export interface Signal {
  id: string;
  metricId: string;
  type: SignalType;
  score: number;
  direction: Direction;
  timestamp: string;
  value: number;
  changePercent: number;
}

export interface Detector {
  id: string;
  detect(series: DataPoint[]): Signal[];
}

export interface Connector {
  id: string;
  fetch(): Promise<DataPoint[]>;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/types && npx vitest run`
Expected: PASS (4 tests)

- [ ] **Step 7: Verify compilation**

Run: `pnpm --filter @signal-hub/types build`
Expected: exits 0, produces `packages/types/dist/index.js` and `dist/index.d.ts`

- [ ] **Step 8: Commit**

```bash
git add packages/types
git commit -m "feat(types): add DataPoint, Signal, Detector, Connector interfaces"
```

---

### Task 3: Connector SDK — Validation Utilities

**Files:**
- Create: `packages/connector-sdk/package.json`
- Create: `packages/connector-sdk/tsconfig.json`
- Create: `packages/connector-sdk/src/validate.ts`
- Create: `packages/connector-sdk/src/index.ts`
- Test: `packages/connector-sdk/tests/validate.test.ts`

**Interfaces:**
- Consumes: `DataPoint` from `@signal-hub/types`.
- Produces: `isValidDataPoint(point: DataPoint): boolean`, re-exports `Connector`, `DataPoint` from `@signal-hub/types`.

- [ ] **Step 1: Create `packages/connector-sdk/package.json`**

```json
{
  "name": "@signal-hub/connector-sdk",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@signal-hub/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vite": "6.4.3",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Create `packages/connector-sdk/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

- [ ] **Step 3: Write the failing test**

```typescript
// packages/connector-sdk/tests/validate.test.ts
import { describe, expect, it } from "vitest";
import { isValidDataPoint } from "../src/validate.js";

describe("isValidDataPoint", () => {
  it("accepts a well-formed point", () => {
    expect(isValidDataPoint({ metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 42 })).toBe(true);
  });

  it("rejects an empty metricId", () => {
    expect(isValidDataPoint({ metricId: "", timestamp: "2026-07-27T00:00:00.000Z", value: 42 })).toBe(false);
  });

  it("rejects a non-finite value", () => {
    expect(isValidDataPoint({ metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: Number.NaN })).toBe(false);
    expect(isValidDataPoint({ metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: Number.POSITIVE_INFINITY })).toBe(false);
  });

  it("rejects an unparseable timestamp", () => {
    expect(isValidDataPoint({ metricId: "m1", timestamp: "not-a-date", value: 42 })).toBe(false);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd packages/connector-sdk && npx vitest run`
Expected: FAIL — `../src/validate.js` does not exist yet.

- [ ] **Step 5: Write the implementation**

```typescript
// packages/connector-sdk/src/validate.ts
import type { DataPoint } from "@signal-hub/types";

export function isValidDataPoint(point: DataPoint): boolean {
  return (
    typeof point.metricId === "string" &&
    point.metricId.length > 0 &&
    typeof point.value === "number" &&
    Number.isFinite(point.value) &&
    typeof point.timestamp === "string" &&
    !Number.isNaN(Date.parse(point.timestamp))
  );
}
```

```typescript
// packages/connector-sdk/src/index.ts
export type { Connector, DataPoint } from "@signal-hub/types";
export { isValidDataPoint } from "./validate.js";
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/connector-sdk && npx vitest run`
Expected: PASS (4 tests)

- [ ] **Step 7: Verify compilation**

Run: `pnpm --filter @signal-hub/types --filter @signal-hub/connector-sdk build`
Expected: exits 0

- [ ] **Step 8: Commit**

```bash
git add packages/connector-sdk
git commit -m "feat(connector-sdk): add isValidDataPoint validation"
```

---

### Task 4: SQLite Storage Layer (`@signal-hub/storage`)

**Files:**
- Create: `packages/storage/package.json`
- Create: `packages/storage/tsconfig.json`
- Create: `packages/storage/src/schema.ts`
- Create: `packages/storage/src/SqliteStorage.ts`
- Create: `packages/storage/src/index.ts`
- Test: `packages/storage/tests/SqliteStorage.test.ts`

**Interfaces:**
- Consumes: `DataPoint`, `Signal` from `@signal-hub/types`.
- Produces: `SqliteStorage` class with `dataPoints: DataPointRepository` (`insertMany(points: DataPoint[]): void`, `getByMetric(metricId: string): DataPoint[]`, ordered by timestamp ascending, deduplicated by `${metricId}::${timestamp}`), `signals: SignalRepository` (`insertMany(signals: Signal[]): void`, `getAll(): Signal[]`, ordered by score descending), and `close(): void`.

- [ ] **Step 1: Create `packages/storage/package.json`**

```json
{
  "name": "@signal-hub/storage",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@signal-hub/types": "workspace:*",
    "better-sqlite3": "^11.3.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.11",
    "typescript": "^5.5.4",
    "vite": "6.4.3",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Create `packages/storage/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

- [ ] **Step 3: Write the failing test**

```typescript
// packages/storage/tests/SqliteStorage.test.ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SqliteStorage } from "../src/SqliteStorage.js";
import type { DataPoint, Signal } from "@signal-hub/types";

describe("SqliteStorage", () => {
  let storage: SqliteStorage;

  beforeEach(() => {
    storage = new SqliteStorage(":memory:");
  });

  afterEach(() => {
    storage.close();
  });

  it("inserts and retrieves data points ordered by timestamp", () => {
    const points: DataPoint[] = [
      { metricId: "m1", timestamp: "2026-07-27T02:00:00.000Z", value: 2 },
      { metricId: "m1", timestamp: "2026-07-27T01:00:00.000Z", value: 1 },
    ];
    storage.dataPoints.insertMany(points);
    const result = storage.dataPoints.getByMetric("m1");
    expect(result.map((p) => p.value)).toEqual([1, 2]);
  });

  it("deduplicates data points with the same metricId and timestamp", () => {
    const point: DataPoint = { metricId: "m1", timestamp: "2026-07-27T01:00:00.000Z", value: 1 };
    storage.dataPoints.insertMany([point]);
    storage.dataPoints.insertMany([{ ...point, value: 999 }]);
    const result = storage.dataPoints.getByMetric("m1");
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(1);
  });

  it("returns an empty array for an unknown metric", () => {
    expect(storage.dataPoints.getByMetric("unknown")).toEqual([]);
  });

  it("inserts and retrieves signals ordered by score descending", () => {
    const signals: Signal[] = [
      { id: "s1", metricId: "m1", type: "increase", score: 40, direction: "up", timestamp: "t1", value: 1, changePercent: 10 },
      { id: "s2", metricId: "m1", type: "increase", score: 90, direction: "up", timestamp: "t2", value: 2, changePercent: 20 },
    ];
    storage.signals.insertMany(signals);
    const result = storage.signals.getAll();
    expect(result.map((s) => s.id)).toEqual(["s2", "s1"]);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd packages/storage && npx vitest run`
Expected: FAIL — `../src/SqliteStorage.js` does not exist yet.

- [ ] **Step 5: Write the schema**

```typescript
// packages/storage/src/schema.ts
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS data_points (
  id TEXT PRIMARY KEY,
  metric_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  value REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_data_points_metric_timestamp ON data_points (metric_id, timestamp);

CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  metric_id TEXT NOT NULL,
  type TEXT NOT NULL,
  score REAL NOT NULL,
  direction TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  value REAL NOT NULL,
  change_percent REAL NOT NULL
);
`;
```

- [ ] **Step 6: Write the implementation**

```typescript
// packages/storage/src/SqliteStorage.ts
import Database from "better-sqlite3";
import type { DataPoint, Signal } from "@signal-hub/types";
import { SCHEMA_SQL } from "./schema.js";

export interface DataPointRepository {
  insertMany(points: DataPoint[]): void;
  getByMetric(metricId: string): DataPoint[];
}

export interface SignalRepository {
  insertMany(signals: Signal[]): void;
  getAll(): Signal[];
}

export class SqliteStorage {
  private db: Database.Database;
  readonly dataPoints: DataPointRepository;
  readonly signals: SignalRepository;

  constructor(path: string) {
    this.db = new Database(path);
    this.db.exec(SCHEMA_SQL);

    const insertPointStmt = this.db.prepare(
      "INSERT OR IGNORE INTO data_points (id, metric_id, timestamp, value) VALUES (@id, @metric_id, @timestamp, @value)"
    );
    const getByMetricStmt = this.db.prepare(
      "SELECT metric_id as metricId, timestamp, value FROM data_points WHERE metric_id = ? ORDER BY timestamp ASC"
    );
    this.dataPoints = {
      insertMany: (points) => {
        const tx = this.db.transaction((rows: DataPoint[]) => {
          for (const p of rows) {
            insertPointStmt.run({ id: `${p.metricId}::${p.timestamp}`, metric_id: p.metricId, timestamp: p.timestamp, value: p.value });
          }
        });
        tx(points);
      },
      getByMetric: (metricId) => getByMetricStmt.all(metricId) as DataPoint[],
    };

    const insertSignalStmt = this.db.prepare(
      `INSERT OR IGNORE INTO signals (id, metric_id, type, score, direction, timestamp, value, change_percent)
       VALUES (@id, @metric_id, @type, @score, @direction, @timestamp, @value, @change_percent)`
    );
    const getAllSignalsStmt = this.db.prepare(
      `SELECT id, metric_id as metricId, type, score, direction, timestamp, value, change_percent as changePercent
       FROM signals ORDER BY score DESC`
    );
    this.signals = {
      insertMany: (sigs) => {
        const tx = this.db.transaction((rows: Signal[]) => {
          for (const s of rows) {
            insertSignalStmt.run({
              id: s.id,
              metric_id: s.metricId,
              type: s.type,
              score: s.score,
              direction: s.direction,
              timestamp: s.timestamp,
              value: s.value,
              change_percent: s.changePercent,
            });
          }
        });
        tx(sigs);
      },
      getAll: () => getAllSignalsStmt.all() as Signal[],
    };
  }

  close(): void {
    this.db.close();
  }
}
```

```typescript
// packages/storage/src/index.ts
export { SqliteStorage } from "./SqliteStorage.js";
export type { DataPointRepository, SignalRepository } from "./SqliteStorage.js";
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd packages/storage && npx vitest run`
Expected: PASS (4 tests)

- [ ] **Step 8: Verify compilation**

Run: `pnpm --filter @signal-hub/types --filter @signal-hub/storage build`
Expected: exits 0

- [ ] **Step 9: Commit**

```bash
git add packages/storage
git commit -m "feat(storage): add SqliteStorage with data point and signal repositories"
```

---

### Task 5: Percentage Change Detector

**Files:**
- Create: `packages/analysis/package.json`
- Create: `packages/analysis/tsconfig.json`
- Create: `packages/analysis/src/detectors/PercentageChangeDetector.ts`
- Test: `packages/analysis/tests/percentageChangeDetector.test.ts`

**Interfaces:**
- Consumes: `DataPoint`, `Signal`, `Detector` from `@signal-hub/types`.
- Produces: `class PercentageChangeDetector implements Detector` with `id = "percentage-change"`, constructor `(minChangePercent = 0)`, `detect(series: DataPoint[]): Signal[]` (each returned signal has `score: 0` — scoring happens in Task 7).

- [ ] **Step 1: Create `packages/analysis/package.json`**

```json
{
  "name": "@signal-hub/analysis",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@signal-hub/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vite": "6.4.3",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Create `packages/analysis/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

- [ ] **Step 3: Write the failing test**

```typescript
// packages/analysis/tests/percentageChangeDetector.test.ts
import { describe, expect, it } from "vitest";
import { PercentageChangeDetector } from "../src/detectors/PercentageChangeDetector.js";
import type { DataPoint } from "@signal-hub/types";

const series: DataPoint[] = [
  { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 100 },
  { metricId: "m1", timestamp: "2026-07-27T01:00:00.000Z", value: 110 },
  { metricId: "m1", timestamp: "2026-07-27T02:00:00.000Z", value: 99 },
];

describe("PercentageChangeDetector", () => {
  it("emits an increase signal when value rises", () => {
    const detector = new PercentageChangeDetector();
    const signals = detector.detect(series.slice(0, 2));
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ type: "increase", direction: "up", value: 110, changePercent: 10 });
  });

  it("emits a decrease signal when value falls", () => {
    const detector = new PercentageChangeDetector();
    const signals = detector.detect([series[1], series[2]]);
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe("decrease");
    expect(signals[0].direction).toBe("down");
    expect(signals[0].changePercent).toBeCloseTo(-10, 5);
  });

  it("suppresses signals below minChangePercent", () => {
    const detector = new PercentageChangeDetector(50);
    expect(detector.detect(series.slice(0, 2))).toHaveLength(0);
  });

  it("skips a point when the previous value is zero", () => {
    const detector = new PercentageChangeDetector();
    const zeroSeries: DataPoint[] = [
      { metricId: "m1", timestamp: "t0", value: 0 },
      { metricId: "m1", timestamp: "t1", value: 5 },
    ];
    expect(detector.detect(zeroSeries)).toHaveLength(0);
  });

  it("returns no signals for a series with fewer than two points", () => {
    const detector = new PercentageChangeDetector();
    expect(detector.detect([series[0]])).toHaveLength(0);
    expect(detector.detect([])).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd packages/analysis && npx vitest run`
Expected: FAIL — `../src/detectors/PercentageChangeDetector.js` does not exist yet.

- [ ] **Step 5: Write the implementation**

```typescript
// packages/analysis/src/detectors/PercentageChangeDetector.ts
import { randomUUID } from "node:crypto";
import type { DataPoint, Detector, Signal } from "@signal-hub/types";

export class PercentageChangeDetector implements Detector {
  readonly id = "percentage-change";

  constructor(private readonly minChangePercent: number = 0) {}

  detect(series: DataPoint[]): Signal[] {
    const sorted = [...series].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const signals: Signal[] = [];

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev.value === 0) continue;

      const changePercent = ((curr.value - prev.value) / Math.abs(prev.value)) * 100;
      if (Math.abs(changePercent) < this.minChangePercent) continue;

      signals.push({
        id: randomUUID(),
        metricId: curr.metricId,
        type: changePercent > 0 ? "increase" : "decrease",
        score: 0,
        direction: changePercent > 0 ? "up" : "down",
        timestamp: curr.timestamp,
        value: curr.value,
        changePercent,
      });
    }

    return signals;
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/analysis && npx vitest run`
Expected: PASS (5 tests)

- [ ] **Step 7: Commit**

```bash
git add packages/analysis
git commit -m "feat(analysis): add PercentageChangeDetector"
```

---

### Task 6: Threshold Detector

**Files:**
- Create: `packages/analysis/src/detectors/ThresholdDetector.ts`
- Test: `packages/analysis/tests/thresholdDetector.test.ts`

**Interfaces:**
- Consumes: `DataPoint`, `Detector`, `Signal` from `@signal-hub/types`.
- Produces: `class ThresholdDetector implements Detector` with `id = "threshold"`, constructor `(threshold: number)`, `detect(series: DataPoint[]): Signal[]` — fires a signal only on the point where the series crosses from below `threshold` to at-or-above it (or where the very first point is already at/above `threshold`). `changePercent` is set to the percentage by which `value` exceeds `threshold`, so `scoreSignals` (Task 7) can score it with the same formula as percentage-change signals.

- [ ] **Step 1: Write the failing test**

```typescript
// packages/analysis/tests/thresholdDetector.test.ts
import { describe, expect, it } from "vitest";
import { ThresholdDetector } from "../src/detectors/ThresholdDetector.js";
import type { DataPoint } from "@signal-hub/types";

describe("ThresholdDetector", () => {
  it("fires when the series crosses the threshold", () => {
    const detector = new ThresholdDetector(100);
    const series: DataPoint[] = [
      { metricId: "m1", timestamp: "t0", value: 90 },
      { metricId: "m1", timestamp: "t1", value: 105 },
    ];
    const signals = detector.detect(series);
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ type: "threshold", direction: "up", value: 105, timestamp: "t1" });
  });

  it("fires when the first point is exactly at the threshold", () => {
    const detector = new ThresholdDetector(100);
    const series: DataPoint[] = [{ metricId: "m1", timestamp: "t0", value: 100 }];
    expect(detector.detect(series)).toHaveLength(1);
  });

  it("does not fire again while the value stays above the threshold", () => {
    const detector = new ThresholdDetector(100);
    const series: DataPoint[] = [
      { metricId: "m1", timestamp: "t0", value: 105 },
      { metricId: "m1", timestamp: "t1", value: 110 },
    ];
    expect(detector.detect(series)).toHaveLength(1);
  });

  it("does not fire while the value stays below the threshold", () => {
    const detector = new ThresholdDetector(100);
    const series: DataPoint[] = [
      { metricId: "m1", timestamp: "t0", value: 10 },
      { metricId: "m1", timestamp: "t1", value: 20 },
    ];
    expect(detector.detect(series)).toHaveLength(0);
  });

  it("fires again after dropping below and re-crossing", () => {
    const detector = new ThresholdDetector(100);
    const series: DataPoint[] = [
      { metricId: "m1", timestamp: "t0", value: 105 },
      { metricId: "m1", timestamp: "t1", value: 95 },
      { metricId: "m1", timestamp: "t2", value: 101 },
    ];
    expect(detector.detect(series)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/analysis && npx vitest run tests/thresholdDetector.test.ts`
Expected: FAIL — `../src/detectors/ThresholdDetector.js` does not exist yet.

- [ ] **Step 3: Write the implementation**

```typescript
// packages/analysis/src/detectors/ThresholdDetector.ts
import { randomUUID } from "node:crypto";
import type { DataPoint, Detector, Signal } from "@signal-hub/types";

export class ThresholdDetector implements Detector {
  readonly id = "threshold";

  constructor(private readonly threshold: number) {}

  detect(series: DataPoint[]): Signal[] {
    const sorted = [...series].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const signals: Signal[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const curr = sorted[i];
      const prev = i > 0 ? sorted[i - 1] : undefined;
      const crossed = curr.value >= this.threshold && (!prev || prev.value < this.threshold);
      if (!crossed) continue;

      // Divisor guards against a zero threshold; percentage-over-threshold still needs a base to divide by.
      const changePercent = ((curr.value - this.threshold) / (Math.abs(this.threshold) || 1)) * 100;

      signals.push({
        id: randomUUID(),
        metricId: curr.metricId,
        type: "threshold",
        score: 0,
        direction: "up",
        timestamp: curr.timestamp,
        value: curr.value,
        changePercent,
      });
    }

    return signals;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/analysis && npx vitest run tests/thresholdDetector.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/analysis
git commit -m "feat(analysis): add ThresholdDetector"
```

---

### Task 7: Signal Scoring Engine

**Files:**
- Create: `packages/analysis/src/scoring.ts`
- Create: `packages/analysis/src/index.ts`
- Test: `packages/analysis/tests/scoring.test.ts`

**Interfaces:**
- Consumes: `Signal` from `@signal-hub/types`.
- Produces: `scoreSignals(signals: Signal[]): Signal[]` — returns new `Signal` objects with `score = clamp(round(abs(changePercent) * 2), 0, 100)`. Also finalizes `packages/analysis`'s public surface: `PercentageChangeDetector`, `ThresholdDetector`, `scoreSignals`.

- [ ] **Step 1: Write the failing test**

```typescript
// packages/analysis/tests/scoring.test.ts
import { describe, expect, it } from "vitest";
import { scoreSignals } from "../src/scoring.js";
import type { Signal } from "@signal-hub/types";

function makeSignal(changePercent: number): Signal {
  return {
    id: "s1",
    metricId: "m1",
    type: "increase",
    score: 0,
    direction: "up",
    timestamp: "t0",
    value: 1,
    changePercent,
  };
}

describe("scoreSignals", () => {
  it("scales score linearly with absolute changePercent", () => {
    const [scored] = scoreSignals([makeSignal(10)]);
    expect(scored.score).toBe(20);
  });

  it("scores negative changePercent by magnitude", () => {
    const [scored] = scoreSignals([makeSignal(-25)]);
    expect(scored.score).toBe(50);
  });

  it("clamps score at 100", () => {
    const [scored] = scoreSignals([makeSignal(200)]);
    expect(scored.score).toBe(100);
  });

  it("clamps score at 0 for a zero change", () => {
    const [scored] = scoreSignals([makeSignal(0)]);
    expect(scored.score).toBe(0);
  });

  it("preserves relative ranking between signals", () => {
    const scored = scoreSignals([makeSignal(5), makeSignal(40)]);
    expect(scored[0].score).toBeLessThan(scored[1].score);
  });

  it("does not mutate the input signals", () => {
    const input = makeSignal(10);
    scoreSignals([input]);
    expect(input.score).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/analysis && npx vitest run tests/scoring.test.ts`
Expected: FAIL — `../src/scoring.js` does not exist yet.

- [ ] **Step 3: Write the implementation**

```typescript
// packages/analysis/src/scoring.ts
import type { Signal } from "@signal-hub/types";

export function scoreSignals(signals: Signal[]): Signal[] {
  return signals.map((signal) => ({
    ...signal,
    score: Math.min(100, Math.max(0, Math.round(Math.abs(signal.changePercent) * 2))),
  }));
}
```

```typescript
// packages/analysis/src/index.ts
export { PercentageChangeDetector } from "./detectors/PercentageChangeDetector.js";
export { ThresholdDetector } from "./detectors/ThresholdDetector.js";
export { scoreSignals } from "./scoring.js";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/analysis && npx vitest run`
Expected: PASS (16 tests total across the three analysis test files)

- [ ] **Step 5: Verify compilation**

Run: `pnpm --filter @signal-hub/types --filter @signal-hub/analysis build`
Expected: exits 0

- [ ] **Step 6: Commit**

```bash
git add packages/analysis
git commit -m "feat(analysis): add scoreSignals and package entrypoint"
```

---

### Task 8: CSV Connector

**Files:**
- Create: `connectors/csv/package.json`
- Create: `connectors/csv/tsconfig.json`
- Create: `connectors/csv/src/CsvConnector.ts`
- Create: `connectors/csv/src/index.ts`
- Test: `connectors/csv/tests/CsvConnector.test.ts`

**Interfaces:**
- Consumes: `Connector`, `DataPoint` from `@signal-hub/connector-sdk`.
- Produces: `class CsvConnector implements Connector` with `id = "csv"`, constructor `(filePath: string)`, `async fetch(): Promise<DataPoint[]>`. Expects a header row exactly `metricId,timestamp,value` (case-insensitive); throws `Error` on a malformed header or any malformed row (message includes the 1-indexed line number).

- [ ] **Step 1: Create `connectors/csv/package.json`**

```json
{
  "name": "@signal-hub/connector-csv",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@signal-hub/connector-sdk": "workspace:*",
    "@signal-hub/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vite": "6.4.3",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Create `connectors/csv/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

- [ ] **Step 3: Write the failing test**

```typescript
// connectors/csv/tests/CsvConnector.test.ts
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CsvConnector } from "../src/CsvConnector.js";

describe("CsvConnector", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "signal-hub-csv-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function writeCsv(contents: string): string {
    const filePath = join(dir, "data.csv");
    writeFileSync(filePath, contents, "utf-8");
    return filePath;
  }

  it("parses valid rows into DataPoints with ISO timestamps", async () => {
    const filePath = writeCsv("metricId,timestamp,value\nm1,2026-07-27T00:00:00Z,42\nm2,2026-07-27T01:00:00Z,7\n");
    const connector = new CsvConnector(filePath);
    const points = await connector.fetch();
    expect(points).toEqual([
      { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 42 },
      { metricId: "m2", timestamp: "2026-07-27T01:00:00.000Z", value: 7 },
    ]);
  });

  it("throws on a malformed header", async () => {
    const filePath = writeCsv("id,time,val\nm1,2026-07-27T00:00:00Z,42\n");
    const connector = new CsvConnector(filePath);
    await expect(connector.fetch()).rejects.toThrow(/Invalid CSV header/);
  });

  it("throws on a row with the wrong number of columns", async () => {
    const filePath = writeCsv("metricId,timestamp,value\nm1,2026-07-27T00:00:00Z\n");
    const connector = new CsvConnector(filePath);
    await expect(connector.fetch()).rejects.toThrow(/line 2/);
  });

  it("throws on a row with an invalid timestamp", async () => {
    const filePath = writeCsv("metricId,timestamp,value\nm1,not-a-date,42\n");
    const connector = new CsvConnector(filePath);
    await expect(connector.fetch()).rejects.toThrow(/line 2/);
  });

  it("throws on a row with a non-numeric value", async () => {
    const filePath = writeCsv("metricId,timestamp,value\nm1,2026-07-27T00:00:00Z,not-a-number\n");
    const connector = new CsvConnector(filePath);
    await expect(connector.fetch()).rejects.toThrow(/line 2/);
  });

  it("throws on an empty file", async () => {
    const filePath = writeCsv("");
    const connector = new CsvConnector(filePath);
    await expect(connector.fetch()).rejects.toThrow(/empty/);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd connectors/csv && npx vitest run`
Expected: FAIL — `../src/CsvConnector.js` does not exist yet.

- [ ] **Step 5: Write the implementation**

```typescript
// connectors/csv/src/CsvConnector.ts
import { readFile } from "node:fs/promises";
import type { Connector, DataPoint } from "@signal-hub/connector-sdk";

const EXPECTED_HEADER = ["metricid", "timestamp", "value"];

export class CsvConnector implements Connector {
  readonly id = "csv";

  constructor(private readonly filePath: string) {}

  async fetch(): Promise<DataPoint[]> {
    const raw = await readFile(this.filePath, "utf-8");
    const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      throw new Error(`CSV file is empty: ${this.filePath}`);
    }

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    if (header.length !== 3 || !EXPECTED_HEADER.every((col, i) => header[i] === col)) {
      throw new Error(`Invalid CSV header. Expected "metricId,timestamp,value", got "${lines[0]}"`);
    }

    const points: DataPoint[] = [];
    for (let i = 1; i < lines.length; i++) {
      const lineNumber = i + 1;
      const cols = lines[i].split(",");
      if (cols.length !== 3) {
        throw new Error(`Invalid row at line ${lineNumber}: expected 3 columns, got ${cols.length}`);
      }

      const [metricId, timestamp, rawValue] = cols.map((c) => c.trim());
      if (!metricId) {
        throw new Error(`Invalid row at line ${lineNumber}: missing metricId`);
      }
      if (Number.isNaN(Date.parse(timestamp))) {
        throw new Error(`Invalid row at line ${lineNumber}: invalid timestamp "${timestamp}"`);
      }
      const value = Number(rawValue);
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid row at line ${lineNumber}: invalid value "${rawValue}"`);
      }

      points.push({ metricId, timestamp: new Date(timestamp).toISOString(), value });
    }

    return points;
  }
}
```

```typescript
// connectors/csv/src/index.ts
export { CsvConnector } from "./CsvConnector.js";
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd connectors/csv && npx vitest run`
Expected: PASS (6 tests)

- [ ] **Step 7: Verify compilation**

Run: `pnpm --filter @signal-hub/types --filter @signal-hub/connector-sdk --filter @signal-hub/connector-csv build`
Expected: exits 0

- [ ] **Step 8: Commit**

```bash
git add connectors/csv
git commit -m "feat(connector-csv): add CsvConnector"
```

---

### Task 9: Core Pipeline Engine + Output Formatter

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/pipeline.ts`
- Create: `packages/core/src/format.ts`
- Create: `packages/core/src/index.ts`
- Test: `packages/core/tests/pipeline.test.ts`
- Test: `packages/core/tests/format.test.ts`

**Interfaces:**
- Consumes: `Connector`, `Detector`, `Signal` from `@signal-hub/types`; `isValidDataPoint` from `@signal-hub/connector-sdk`; `SqliteStorage` from `@signal-hub/storage`; `scoreSignals` from `@signal-hub/analysis`.
- Produces: `interface PipelineOptions { detectors: Detector[]; minScore?: number }`, `async function runPipeline(connector: Connector, storage: SqliteStorage, options: PipelineOptions): Promise<Signal[]>` (validates + dedupes points into storage, runs each detector per metric, scores, filters by `minScore` (default 0), sorts descending by score, persists, returns), and `function formatSignals(signals: Signal[]): string` (pretty-printed JSON).

- [ ] **Step 1: Create `packages/core/package.json`**

```json
{
  "name": "@signal-hub/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@signal-hub/analysis": "workspace:*",
    "@signal-hub/connector-sdk": "workspace:*",
    "@signal-hub/storage": "workspace:*",
    "@signal-hub/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vite": "6.4.3",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Create `packages/core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

- [ ] **Step 3: Ensure workspace dependencies are built**

Run: `pnpm --filter @signal-hub/types --filter @signal-hub/connector-sdk --filter @signal-hub/storage --filter @signal-hub/analysis build`
Expected: exits 0 (so `packages/core`'s tests can resolve the built `dist/` of each dependency through the pnpm workspace symlinks)

- [ ] **Step 4: Write the failing tests**

```typescript
// packages/core/tests/pipeline.test.ts
import { describe, expect, it } from "vitest";
import { PercentageChangeDetector, ThresholdDetector } from "@signal-hub/analysis";
import { SqliteStorage } from "@signal-hub/storage";
import type { Connector, DataPoint } from "@signal-hub/types";
import { runPipeline } from "../src/pipeline.js";

function fakeConnector(points: DataPoint[]): Connector {
  return { id: "fake", fetch: async () => points };
}

describe("runPipeline", () => {
  it("produces scored signals sorted descending", async () => {
    const storage = new SqliteStorage(":memory:");
    const points: DataPoint[] = [
      { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 100 },
      { metricId: "m1", timestamp: "2026-07-27T01:00:00.000Z", value: 105 },
      { metricId: "m1", timestamp: "2026-07-27T02:00:00.000Z", value: 150 },
    ];
    const signals = await runPipeline(fakeConnector(points), storage, {
      detectors: [new PercentageChangeDetector()],
    });
    storage.close();

    expect(signals.length).toBeGreaterThan(0);
    for (let i = 1; i < signals.length; i++) {
      expect(signals[i - 1].score).toBeGreaterThanOrEqual(signals[i].score);
    }
  });

  it("filters signals below minScore", async () => {
    const storage = new SqliteStorage(":memory:");
    const points: DataPoint[] = [
      { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 100 },
      { metricId: "m1", timestamp: "2026-07-27T01:00:00.000Z", value: 101 },
    ];
    const signals = await runPipeline(fakeConnector(points), storage, {
      detectors: [new PercentageChangeDetector()],
      minScore: 90,
    });
    storage.close();

    expect(signals).toHaveLength(0);
  });

  it("runs multiple detectors and multiple metrics independently", async () => {
    const storage = new SqliteStorage(":memory:");
    const points: DataPoint[] = [
      { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 10 },
      { metricId: "m1", timestamp: "2026-07-27T01:00:00.000Z", value: 200 },
      { metricId: "m2", timestamp: "2026-07-27T00:00:00.000Z", value: 5 },
    ];
    const signals = await runPipeline(fakeConnector(points), storage, {
      detectors: [new PercentageChangeDetector(), new ThresholdDetector(100)],
    });
    storage.close();

    expect(signals.some((s) => s.metricId === "m1" && s.type === "threshold")).toBe(true);
    expect(signals.some((s) => s.metricId === "m1" && s.type === "increase")).toBe(true);
    expect(signals.every((s) => s.metricId !== "m2" || s.type !== "threshold")).toBe(true);
  });

  it("drops invalid points before storing", async () => {
    const storage = new SqliteStorage(":memory:");
    const points: DataPoint[] = [
      { metricId: "", timestamp: "2026-07-27T00:00:00.000Z", value: 10 },
      { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 10 },
    ];
    await runPipeline(fakeConnector(points), storage, { detectors: [new PercentageChangeDetector()] });
    const stored = storage.dataPoints.getByMetric("m1");
    storage.close();

    expect(stored).toHaveLength(1);
  });
});
```

```typescript
// packages/core/tests/format.test.ts
import { describe, expect, it } from "vitest";
import type { Signal } from "@signal-hub/types";
import { formatSignals } from "../src/format.js";

describe("formatSignals", () => {
  it("pretty-prints signals as JSON", () => {
    const signals: Signal[] = [
      { id: "s1", metricId: "m1", type: "increase", score: 80, direction: "up", timestamp: "t0", value: 10, changePercent: 40 },
    ];
    expect(formatSignals(signals)).toBe(JSON.stringify(signals, null, 2));
  });

  it("formats an empty list as an empty JSON array", () => {
    expect(formatSignals([])).toBe("[]");
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `cd packages/core && npx vitest run`
Expected: FAIL — `../src/pipeline.js` and `../src/format.js` do not exist yet.

- [ ] **Step 6: Write the implementation**

```typescript
// packages/core/src/pipeline.ts
import { isValidDataPoint } from "@signal-hub/connector-sdk";
import { scoreSignals } from "@signal-hub/analysis";
import type { SqliteStorage } from "@signal-hub/storage";
import type { Connector, Detector, Signal } from "@signal-hub/types";

export interface PipelineOptions {
  detectors: Detector[];
  minScore?: number;
}

export async function runPipeline(connector: Connector, storage: SqliteStorage, options: PipelineOptions): Promise<Signal[]> {
  const minScore = options.minScore ?? 0;
  const rawPoints = await connector.fetch();
  const validPoints = rawPoints.filter(isValidDataPoint);
  storage.dataPoints.insertMany(validPoints);

  const metricIds = [...new Set(validPoints.map((p) => p.metricId))];
  const rawSignals: Signal[] = [];
  for (const metricId of metricIds) {
    const series = storage.dataPoints.getByMetric(metricId);
    for (const detector of options.detectors) {
      rawSignals.push(...detector.detect(series));
    }
  }

  const scored = scoreSignals(rawSignals)
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score);

  storage.signals.insertMany(scored);
  return scored;
}
```

```typescript
// packages/core/src/format.ts
import type { Signal } from "@signal-hub/types";

export function formatSignals(signals: Signal[]): string {
  return JSON.stringify(signals, null, 2);
}
```

```typescript
// packages/core/src/index.ts
export { runPipeline } from "./pipeline.js";
export type { PipelineOptions } from "./pipeline.js";
export { formatSignals } from "./format.js";
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd packages/core && npx vitest run`
Expected: PASS (6 tests)

- [ ] **Step 8: Verify compilation**

Run: `pnpm --filter @signal-hub/core build`
Expected: exits 0

- [ ] **Step 9: Commit**

```bash
git add packages/core
git commit -m "feat(core): add runPipeline and formatSignals"
```

---

### Task 10: CLI Application (End-to-End)

**Files:**
- Create: `apps/cli/package.json`
- Create: `apps/cli/tsconfig.json`
- Create: `apps/cli/src/cli.ts`
- Create: `apps/cli/src/index.ts`
- Test: `apps/cli/tests/cli.test.ts`

**Interfaces:**
- Consumes: `runPipeline`, `formatSignals` from `@signal-hub/core`; `CsvConnector` from `@signal-hub/connector-csv`; `PercentageChangeDetector`, `ThresholdDetector` from `@signal-hub/analysis`; `SqliteStorage` from `@signal-hub/storage`.
- Produces: `async function runCli(args: string[]): Promise<string>` — parses `analyze <file> [--min-score <n>] [--threshold <n>]`, runs the full pipeline against a `data.db` SQLite file in the current working directory, returns `formatSignals(...)`. `src/index.ts` is the shebang entry point wired to `bin.signal-hub`.

- [ ] **Step 1: Create `apps/cli/package.json`**

```json
{
  "name": "signal-hub",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": { "signal-hub": "./dist/index.js" },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@signal-hub/analysis": "workspace:*",
    "@signal-hub/connector-csv": "workspace:*",
    "@signal-hub/core": "workspace:*",
    "@signal-hub/storage": "workspace:*",
    "@signal-hub/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vite": "6.4.3",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Create `apps/cli/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

- [ ] **Step 3: Ensure workspace dependencies are built**

Run: `pnpm -r build`
Expected: exits 0 (builds every package in dependency order so `apps/cli`'s tests can import the workspace packages)

- [ ] **Step 4: Write the failing test**

```typescript
// apps/cli/tests/cli.test.ts
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../src/cli.js";

describe("runCli", () => {
  let dir: string;
  let originalCwd: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "signal-hub-cli-"));
    originalCwd = process.cwd();
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(dir, { recursive: true, force: true });
  });

  it("analyzes a CSV file and prints ranked JSON signals", async () => {
    writeFileSync(
      join(dir, "data.csv"),
      "metricId,timestamp,value\nm1,2026-07-27T00:00:00Z,100\nm1,2026-07-27T01:00:00Z,150\nm1,2026-07-27T02:00:00Z,151\n",
      "utf-8"
    );

    const output = await runCli(["analyze", "data.csv"]);
    const signals = JSON.parse(output);

    expect(Array.isArray(signals)).toBe(true);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0]).toHaveProperty("score");
    expect(signals[0].metricId).toBe("m1");
  });

  it("applies --min-score to filter output", async () => {
    writeFileSync(
      join(dir, "data.csv"),
      "metricId,timestamp,value\nm1,2026-07-27T00:00:00Z,100\nm1,2026-07-27T01:00:00Z,101\n",
      "utf-8"
    );

    const output = await runCli(["analyze", "data.csv", "--min-score", "90"]);
    expect(JSON.parse(output)).toEqual([]);
  });

  it("includes threshold signals when --threshold is passed", async () => {
    writeFileSync(
      join(dir, "data.csv"),
      "metricId,timestamp,value\nm1,2026-07-27T00:00:00Z,10\nm1,2026-07-27T01:00:00Z,200\n",
      "utf-8"
    );

    const output = await runCli(["analyze", "data.csv", "--threshold", "100"]);
    const signals = JSON.parse(output);
    expect(signals.some((s: { type: string }) => s.type === "threshold")).toBe(true);
  });

  it("throws a usage error when the file argument is missing", async () => {
    await expect(runCli(["analyze"])).rejects.toThrow(/Usage/);
  });

  it("throws a usage error for an unknown command", async () => {
    await expect(runCli(["bogus", "data.csv"])).rejects.toThrow(/Usage/);
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd apps/cli && npx vitest run`
Expected: FAIL — `../src/cli.js` does not exist yet.

- [ ] **Step 6: Write the implementation**

```typescript
// apps/cli/src/cli.ts
import { resolve } from "node:path";
import { PercentageChangeDetector, ThresholdDetector } from "@signal-hub/analysis";
import { CsvConnector } from "@signal-hub/connector-csv";
import { formatSignals, runPipeline } from "@signal-hub/core";
import { SqliteStorage } from "@signal-hub/storage";
import type { Detector } from "@signal-hub/types";

const USAGE = "Usage: signal-hub analyze <file.csv> [--min-score <n>] [--threshold <n>]";

export async function runCli(args: string[]): Promise<string> {
  const [command, filePath, ...rest] = args;
  if (command !== "analyze" || !filePath) {
    throw new Error(USAGE);
  }

  let minScore: number | undefined;
  let threshold: number | undefined;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--min-score") minScore = Number(rest[++i]);
    if (rest[i] === "--threshold") threshold = Number(rest[++i]);
  }

  const storage = new SqliteStorage(resolve(process.cwd(), "data.db"));
  try {
    const connector = new CsvConnector(resolve(process.cwd(), filePath));
    const detectors: Detector[] = [new PercentageChangeDetector()];
    if (threshold !== undefined) detectors.push(new ThresholdDetector(threshold));

    const signals = await runPipeline(connector, storage, { detectors, minScore });
    return formatSignals(signals);
  } finally {
    storage.close();
  }
}
```

```typescript
// apps/cli/src/index.ts
#!/usr/bin/env node
import { runCli } from "./cli.js";

runCli(process.argv.slice(2))
  .then((output) => {
    console.log(output);
  })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  });
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd apps/cli && npx vitest run`
Expected: PASS (5 tests)

- [ ] **Step 8: Verify compilation and the real binary end-to-end**

```bash
pnpm -r build
cd /tmp && mkdir -p signal-hub-smoke && cd signal-hub-smoke
printf 'metricId,timestamp,value\nm1,2026-07-27T00:00:00Z,100\nm1,2026-07-27T01:00:00Z,150\n' > data.csv
node <path-to-repo>/apps/cli/dist/index.js analyze data.csv
```

Expected: prints a JSON array with one `increase` signal for `m1` and creates `data.db` in the smoke-test directory.

- [ ] **Step 9: Commit**

```bash
git add apps/cli
git commit -m "feat(cli): add signal-hub analyze command"
```

---

## Self-Review Notes

- **Spec coverage:** Monorepo setup (Task 1), shared types (Task 2), connector-sdk (Task 3), SQLite storage (Task 4), percentage-change + threshold detectors (Tasks 5–6), scoring (Task 7), CSV connector (Task 8), core pipeline + formatter (Task 9), CLI (Task 10) — covers every item in the design doc's MVP "MUST" list except the REST API and GitHub connector, which the design review explicitly marks optional/deferred; those get their own follow-up plan.
- **Placeholder scan:** every step has real, runnable code and exact commands — no TBDs.
- **Type consistency:** `Detector`, `Connector`, `DataPoint`, `Signal` are defined once in Task 2 and imported verbatim everywhere else; `PipelineOptions`, `runPipeline`, `formatSignals`, `scoreSignals`, `isValidDataPoint`, `SqliteStorage.dataPoints/.signals` names and signatures match between the task that produces them and every task that consumes them.

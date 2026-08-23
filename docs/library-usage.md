# Library usage

The GitHub and CoinGecko connectors can be composed directly as private workspace libraries and
are also available through the repository-built `csv-to-signal github` and
`csv-to-signal coingecko` commands. The published npm `0.4.0` artifact predates these commands.
`WindowedChangeDetector` is available in the CLI through `--window-hours` and can also be composed
directly in TypeScript or JavaScript.

Build the workspace before using the generated packages:

```bash
pnpm build
```

The examples below use package names as they would appear in a workspace consumer. That consumer
must declare the packages it imports with `workspace:*`; the packages are private and have not
been published to npm.

## GitHub commit connector

`GitHubConnector` reads a repository's commits serially, follows GitHub pagination links, and
returns one commit-count point per UTC day in ascending order.

```typescript
import { GitHubConnector } from "@signal-hub/connector-github";

const connector = new GitHubConnector({
  owner: "octocat",
  repo: "Hello-World",
  token: process.env.GITHUB_TOKEN,
});

const points = await connector.fetch();
console.log(points);
console.log(connector.diagnostics);
```

The token is optional for public repositories. Pass it explicitly for private repositories; the
connector never reads an environment variable itself. Malformed individual records are skipped
and reported through the read-only `diagnostics` accessor. Request, pagination, and response-body
failures reject the entire fetch.

Each point uses the metric ID `github:<owner>/<repo>:commits` and a midnight UTC timestamp.

## CoinGecko price connector

`CoinGeckoConnector` reads market-chart prices from the CoinGecko Demo API and returns normalized
points ordered by timestamp.

```typescript
import { CoinGeckoConnector } from "@signal-hub/connector-coingecko";

const connector = new CoinGeckoConnector({
  coinId: "bitcoin",
  vsCurrency: "usd",
  historyDays: 7,
  apiKey: process.env.COINGECKO_DEMO_API_KEY,
});

const points = await connector.fetch();
console.log(points);
console.log(connector.diagnostics);
```

`coinId` and `vsCurrency` must be nonempty, and `historyDays` must be a positive integer. The
connector applies a 15-second timeout and a 5 MiB response limit. Invalid observations are
skipped with diagnostics; when timestamps repeat, the last observation wins deterministically.
API keys are passed by the caller and are never included in connector errors.

Each point uses the metric ID `coingecko:<coinId>:price:<vsCurrency>`.

## Windowed change detector

`WindowedChangeDetector` compares the latest point with the newest point at or before the window
boundary. This gives deterministic 24-hour, 7-day, or custom-window changes even when observations
are irregularly spaced.

```typescript
import { WindowedChangeDetector, scoreSignals } from "@signal-hub/analysis";
import type { DataPoint } from "@signal-hub/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const points: DataPoint[] = [
  { metricId: "demo.price", timestamp: "2026-08-01T00:00:00.000Z", value: 100 },
  { metricId: "demo.price", timestamp: "2026-08-02T06:00:00.000Z", value: 110 },
  { metricId: "demo.price", timestamp: "2026-08-03T00:00:00.000Z", value: 125 },
];

const detector = new WindowedChangeDetector(DAY_MS, 5);
const signals = scoreSignals(detector.detect(points));
console.log(signals);
```

The second constructor argument is the optional minimum absolute percentage change and defaults
to zero. The detector returns at most one signal. It returns none when history is insufficient,
the reference value is zero, the values are unchanged, or the change is below the minimum.

The CLI selects the detector when `--window-hours <n>` is supplied; its library constructor also
supports a minimum absolute percentage change that the CLI does not expose. To persist and rank
signals from a library connector, compose the connector, `SqliteStorage`, the desired detectors,
and `runPipeline` in a workspace application.

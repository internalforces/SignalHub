# Signal Hub M3 — CoinGecko Connector

## Status

Approved by the project owner on 2026-08-04. This approval covers only TASK-017 and does not
authorize the deferred Polymarket, generic REST, YAML configuration, CLI, Core, Storage, schema,
deployment, or npm-publish work.

## Goal

Add one deterministic external price-series connector without changing the existing pipeline:

~~~text
CoinGecko prices -> CoinGeckoConnector -> DataPoint[]
~~~

The package remains a library. M3 does not add a CLI command or persistence behavior.

## Package contract

Create `@signal-hub/connector-coingecko` with dependencies only on `connector-sdk` and `types`.

`CoinGeckoConnector` accepts:

- `coinId`: nonempty CoinGecko coin ID;
- `vsCurrency`: nonempty quote currency;
- `historyDays`: positive integer;
- optional CoinGecko Demo API key; and
- optional injected `fetch` implementation for deterministic tests.

The connector calls the Demo API `GET /api/v3/coins/{id}/market_chart` endpoint with
`vs_currency` and `days`, and reads only the response's `prices` array. It does not perform a
live request during the normal test suite.

For every valid `[unixMilliseconds, price]` observation it returns:

~~~ts
{
  metricId: `coingecko:${coinId}:price:${vsCurrency}`,
  timestamp: new Date(unixMilliseconds).toISOString(),
  value: price,
}
~~~

Rules:

1. timestamps and values must be finite numbers and timestamps must be representable as ISO UTC;
2. malformed observations are skipped with immutable in-memory diagnostics;
3. output is sorted by timestamp, and the last valid response entry wins for duplicate timestamps;
4. non-2xx responses, invalid JSON, a missing `prices` array, timeouts, and responses above 5 MiB
   fail visibly without exposing the API key; and
5. no timestamp bucketing is added because the provider controls observation granularity.

## Deliverables

- `connectors/coingecko` package, exports, and focused unit tests;
- root build, test, and typecheck remain green;
- roadmap, backlog, architecture, decision, and session records reflect the reduced M3 scope.

## Not in M3

- Polymarket and generic REST connectors;
- YAML configuration or environment interpolation;
- a new CLI command or output format;
- Core, detector, Storage, or database-schema changes;
- source namespaces, historical reconciliation, scheduling, deployment, or npm publishing.

Each excluded item needs a separate plan and human approval before implementation.

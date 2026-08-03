# Signal Hub M3 (v1.0) Design and M4+ Roadmap

## Status and approval gate

**Status: proposed planning artifact. This document does not authorize implementation.**

The M3 items are on the architecture DEFER list. A human must approve this design, or an explicitly revised version, before implementation begins. Separate approval is also required for:

1. adding a YAML parser or other external dependency;
2. the new public CLI command, flags, and JSON output contract;
3. any database-schema change proposed for persistence; and
4. publishing the package to npm.

Normal development uses mocked HTTP responses. A live smoke test may use only an approved free public endpoint. API keys are passed only as caller-supplied environment variables; agents must not read .env files, and expanded values must be redacted from output, errors, and diagnostics.

## Baseline and invariants

The current deterministic pipeline remains the foundation:

~~~
connector.fetch() -> DataPoint[] -> Core -> Detector -> Signal -> CLI JSON
~~~

M3 keeps the shared DataPoint, Signal, Detector, and Connector contracts unchanged. Connectors normalize timestamps to ISO 8601 UTC before returning data. Because SQLite deduplicates with metricId::timestamp, every configured source must have a unique metricId and every connector must emit one point per timestamp or aggregate collisions deterministically.

The package boundaries remain binding:

~~~
connectors/* -> connector-sdk, types
storage      -> types
analysis     -> types
core         -> types, storage, analysis, connector-sdk
apps/cli     -> composition dependencies only; execution stays in core
~~~

## M3 objective

M3 adds a local, configuration-driven multi-source CLI while preserving the existing CSV command unchanged.

| Source | M3 behavior |
| --- | --- |
| CoinGecko | Fetch a configured asset/currency price series, validate values, normalize and bucket time, and report invalid records. |
| Polymarket | Fetch an approved market/outcome series, apply market and outcome eligibility rules, normalize the selected numeric value, and report invalid records. |
| Generic REST | Fetch a read-only JSON response and map configured records, timestamp, and numeric value fields safely. |
| Config | Parse YAML, interpolate approved environment placeholders, and validate source definitions before any request. |

M3 is an ingestion and composition milestone. It does not introduce new detectors, scoring changes, a scheduler, web service, dashboard, alerting, or LLM behavior.

## Target architecture

~~~
config.yml
  -> @signal-hub/config: parse, interpolate, validate
  -> CLI composition root: create a connector for each source
  -> connector-{coingecko,polymarket,rest}: fetch, normalize, aggregate, diagnostics
  -> core.runPipeline(): validate, persist, detect, score, format
  -> deterministic grouped CLI JSON
~~~

The config package owns only schema and validation; it must not import Core or concrete connectors. The CLI remains the composition root. This prevents config from becoming a dependency hub and leaves connectors usable as libraries.

### Proposed packages

| Package | Allowed dependencies | Responsibility |
| --- | --- | --- |
| @signal-hub/config | an approved YAML parser; optionally types | Parse one file, interpolate environment placeholders, validate an immutable discriminated source schema. |
| @signal-hub/connector-coingecko | connector-sdk, types | Provider request, UTC normalization/bucketing, and transient diagnostics. |
| @signal-hub/connector-polymarket | connector-sdk, types | Gamma API pagination, market/outcome filtering, normalization, and diagnostics. |
| @signal-hub/connector-rest | connector-sdk, types | Safe generic JSON request and constrained field mapping. |

The YAML dependency is intentionally not preselected. The implementation proposal must compare ESM/Node 20 compatibility, parser safety, maintenance, and package size before asking for approval.

## Proposed configuration contract

This is the proposed public surface and must be approved without silent drift before code is written.

~~~yaml
version: 1
sources:
  - id: bitcoin-usd
    type: coingecko
    metricId: crypto:bitcoin:usd
    coinId: bitcoin
    vsCurrency: usd
    interval: daily

  - id: custom-price
    type: rest
    metricId: example:price
    request:
      url: https://example.invalid/prices
      headers:
        Authorization: ${EXAMPLE_API_AUTHORIZATION}
    mapping:
      recordsPointer: /data
      timestampPointer: /timestamp
      valuePointer: /price
      bucket: day
      aggregate: last
~~~

Every source id and metricId must be non-empty and unique across the full sources list. Source types are coingecko, polymarket, and rest.

Environment interpolation accepts only a full-value placeholder such as ${NAME}. A missing or empty variable is a configuration error. For example, EXAMPLE_API_AUTHORIZATION must contain the complete Authorization value (such as a Bearer credential); configuration must not compose a prefix with an interpolated secret. The implementation must not support partial-string templates or read .env files; this makes validation and secret redaction predictable.

The REST mapping language uses RFC 6901 JSON Pointer only:

- recordsPointer selects an array from the response.
- timestampPointer and valuePointer are evaluated relative to each record.
- bucket is none, hour, or day, always in UTC.
- aggregate is last, sum, or average.

With bucket: none, duplicate metricId/timestamp pairs in a response are request-data errors. Hour/day buckets are reduced after a stable sort by normalized timestamp and original record position, and their timestamps represent the UTC start of the bucket. Connectors must emit only closed buckets: a bucket whose end is at or after the connector's injected current time is omitted. Thus last has a documented deterministic meaning, a rerun cannot freeze an accumulating bucket, and SQLite data is never silently overwritten.

M3 deliberately does not yet propose a Polymarket source schema. TASK-M3-0 must first record the schema and obtain human approval before the general M3 design or connector implementation is approved. That contract must unambiguously identify one market and one outcome, state whether value means probability or price, and document history/timestamp semantics. Missing outcome data must never be fabricated.

## Connector rules

Every M3 connector must:

1. use Node 20 built-in fetch unless a separately approved exception is made;
2. traverse provider pagination serially and with an explicit bound;
3. return points in ascending timestamp order with deterministic tie-breaking;
4. expose read-only in-memory diagnostics for malformed individual records;
5. fail visibly for request-level errors, invalid top-level JSON, unsupported configuration, and unrecoverable pagination; and
6. redact all request-header values and interpolated values.

Malformed individual records are skipped with stable reason codes such as invalid_timestamp, invalid_value, missing_field, unsupported_market, and duplicate_timestamp. This applies the skip-and-audit normalization pattern documented in memory/reuse-candidates.md. A failed request is not silently treated as partial success.

### CoinGecko

The connector accepts the validated asset identifier, quote currency, and interval. The exact provider endpoint and historical-data limitations must be recorded during TASK-M3-3, before a live smoke test. Fixtures must include unordered, duplicate, malformed, and empty observations.

M3 assumes no paid plan. If a key or a paid endpoint becomes necessary, stop and request separate approval.

### Polymarket

Use Future-Signal as a behavioral reference, not copy-pasted code. Reimplement its proven handling for binary-outcome selection, inactive/closed-market exclusion, missing fields, pagination, and provider field-name fallbacks. Extra market metadata is not added to DataPoint in M3.

### Generic REST

The REST connector is JSON and GET only. It does not support scripts, arbitrary expressions, JSONPath filters, HTML scraping, OAuth flows, writes, or retries. URLs must use HTTPS except explicit test-only local endpoints.

## Proposed CLI contract

Existing usage remains compatible:

~~~
signal-hub analyze <csv-file> [--min-score <n>] [--threshold <n>]
~~~

The proposed M3 command is:

~~~
signal-hub run <config-file> [--source <source-id>] [--min-score <n>] [--threshold <n>]
~~~

Configured sources execute sequentially in file order. The output is deterministic grouped JSON and never echoes configuration headers or expanded environment values:

~~~json
{
  "status": "complete",
  "sources": [
    {
      "sourceId": "bitcoin-usd",
      "metricId": "crypto:bitcoin:usd",
      "signals": [
        {
          "id": "percentage-change:crypto:bitcoin:usd:...",
          "metricId": "crypto:bitcoin:usd",
          "type": "increase",
          "score": 42,
          "direction": "up",
          "timestamp": "2026-08-03T00:00:00.000Z",
          "value": 100,
          "changePercent": 21
        }
      ],
      "diagnostics": [{ "code": "invalid_value", "count": 2 }]
    }
  ],
  "failure": null
}
~~~

- status is complete when every selected source finishes, or partial when execution stops at the first failed source.
- sources contains only successfully processed source groups, in selected configuration-file order. Each group has exactly sourceId, metricId, signals, and diagnostics. signals use the existing Signal contract and retain its deterministic order. diagnostics contains zero or more `{ code: string, count: positive integer }` entries, ordered by code.
- failure is null for complete output. For partial output it is `{ "sourceId": string, "stage": "fetch" | "pipeline", "code": string }`; code is a stable, redacted failure classification, never a provider response or error text.

M3 intentionally uses this explicit partial-completion contract rather than a run-wide transaction. Successfully processed source groups may already be persisted when a later source fails, no rollback is attempted, and the nonzero command exit status accompanies the partial JSON. Retrying follows the existing idempotent storage behavior.

This CLI contract is proposed only. It needs public-API approval before implementation.

## Work breakdown

| ID | Work | Size | Depends on | Completion criteria |
| --- | --- | --- | --- | --- |
| TASK-M3-0 | Define and approve the Polymarket public contract | S | — | The source schema, market/outcome selection, value meaning, timestamp/history semantics, and human approval are recorded. |
| TASK-M3-1 | Approve M3 design, dependency, config, and CLI contract | S | M3-0 | Approvals record the YAML dependency, the grouped JSON and partial-failure contract, and confirm no schema change. |
| TASK-M3-2 | Build config package | M | M3-1 | Parsing, interpolation, schema validation, duplicate-ID rejection, and redaction tests pass. |
| TASK-M3-3 | Build CoinGecko connector | M | M3-1 | Fixture tests cover request construction, normalization, UTC buckets, duplicates, diagnostics, and failures. |
| TASK-M3-4 | Build Polymarket connector | L | M3-1 | Approved API contract and fixtures cover pagination, eligibility filtering, normalization, diagnostics, and failures. |
| TASK-M3-5 | Build generic REST connector | L | M3-1 | JSON Pointer mapping, aggregation, HTTPS validation, redaction, malformed records, and errors are covered. |
| TASK-M3-6 | Add approved CLI composition and docs | M | M3-2 through M3-5 | Existing analyze tests stay green; config-run tests cover selection, order, stable output, and redaction. |
| TASK-M3-7 | Release readiness | M | M3-6 | Build, tests, typecheck, API/package-boundary review, and approved public smoke tests pass. |

M3-3 through M3-5 can proceed in parallel after approval. No task may change SQLite or shared contracts; if that becomes necessary, implementation stops for a focused proposal.

## Test strategy and v1.0 release gate

- Inject named test environment values; do not load a real environment file.
- Mock fetch and use recorded, redacted JSON fixtures. Network calls are not part of the normal suite.
- Assert byte-for-byte-equivalent output for the same config and mocked responses.
- Verify malformed records retain valid points with stable reason codes.
- Verify request failures are visible and never include header values.
- Verify a later-source failure returns the exact partial JSON shape, uses a nonzero exit status, and leaves prior successful source groups explicitly represented.
- Verify open hour/day buckets are omitted and become eligible only after their UTC end time.
- Retain M1/M2 regression coverage, especially deterministic IDs and UTC normalization.

M3 can be labeled v1.0 only after every acceptance criterion passes and public contracts are reviewed. npm publishing remains a separate manual action requiring human approval.

## M4 — local operations and reliability (rough proposal)

M4 is not a committed implementation plan. Its purpose is safe repeated local execution without turning Signal Hub into a distributed system.

1. Checkpoints and provider cache metadata: ETags/cursors, last successful run, and per-source failure state. This needs an approved SQLite schema design.
2. An opt-in single-process scheduler: no queues, workers, webhooks, or multi-node coordination.
3. Reliability policy: bounded retries, rate-limit-aware delay, cancellation, and explicit partial-run status.
4. Time-aware analysis: windowed change detection and, if repeated ingestion justifies it, detector cooldowns. Any detector-option change needs API review.
5. Local operational visibility: structured summaries and recovery documentation, without a dashboard or alert system by default.

M4 starts only with an Architect proposal that settles the persistence model.

## M5 — consumption and explanation (rough proposal)

After M4 proves repeated operation, M5 may add a minimal read-only local REST API for saved signals and an opt-in alert design. Both need separate plans because they add a public product boundary, external side effects, and credential handling.

Explanation, if added, begins with deterministic templates derived from signal inputs. LLM adapters, multi-provider abstractions, and autonomous research remain out of scope pending a distinct product and security proposal.

## Later / not planned

Dashboard, marketplace, MCP server, distributed scheduling, and ML-like spike, anomaly, trend, or change-point detectors are not implied by M3 through M5. Each requires a fresh architecture proposal and human sign-off.

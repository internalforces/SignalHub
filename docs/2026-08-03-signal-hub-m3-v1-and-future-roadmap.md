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

M3 keeps the shared DataPoint, Signal, Detector, and Connector contracts unchanged. Connectors normalize timestamps to ISO 8601 UTC before returning data. The existing `analyze` command continues to use `data.db`; the M3 `run` command uses the separate, fixed local `signal-hub-m3.db` file in the command's current working directory, with the existing SQLite schema unchanged. CSV input therefore never shares storage with M3 and cannot forge an M3 namespace. Inside that M3-only database, a configured `metricId` is the public identity only: before it enters Core or SQLite, the CLI derives the opaque storage metric ID `m3:${encodeURIComponent(source.id)}:${encodeURIComponent(source.metricId)}:${source.identityDigest}`. `identityDigest` is the lowercase SHA-256 hex digest of the source's canonical provider-identity value, defined below. This namespaces a source's persisted points from other M3 sources and from a later configuration that retargets the same source ID or display metric ID. The CLI maps that private value back to the configured `metricId` only in the `run` JSON view; it never treats an existing un-namespaced series as M3 history. Before calling Core, every connector must emit at most one point for each storage metric ID/timestamp pair under the source-specific duplicate policy defined below.

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
    historyDays: 30

  - id: custom-price
    type: rest
    metricId: example:price
    historyDays: 30
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

Every source `id` must be non-empty and unique across the full sources list. A display `metricId` must be non-empty but may be shared by distinct sources because the persistent storage namespace includes the unique source ID. Every source has a required positive-integer `historyDays` analysis horizon. Given the connector's injected UTC `now`, its inclusive bounds are `start = now - historyDays * 86,400,000 ms` and `end = now`; both connector output and Core's storage read retain only normalized timestamps in `[start, end]`. Core never reads the unbounded metric history; older rows may remain stored but cannot affect detection or output. TASK-M3-0b fixes the approved CoinGecko maximum and endpoint semantics, while TASK-M3-0 does the same for Polymarket. Source types are coingecko, polymarket, and rest.

The CLI derives `identityDigest`; it is not a YAML field. It hashes the UTF-8 canonical JSON with recursively lexicographically sorted object keys and no insignificant whitespace. The identity value includes `type` and every source-specific field that selects or transforms provider data, but excludes `id`, `metricId`, `historyDays`, and request-header values so display renames, horizon changes, and credential rotation retain history. For REST, the exact identity value is `{ type, url, recordsPointer, timestampPointer, valuePointer, bucket, aggregate }`; changing any of those fields creates an independent persisted series automatically. TASK-M3-0b and TASK-M3-0 must respectively record the complete CoinGecko and Polymarket identity-field lists before M3-1 approval. A source `id` remains stable for its intended logical source; changing it intentionally creates an independent history.

Environment interpolation is permitted only for request-header values and accepts only a full-value placeholder such as ${NAME}. It is rejected in `id`, `metricId`, and every other configuration field, so no expanded value can flow into output-visible identifiers or request behavior outside headers. A missing or empty variable is a configuration error. For example, EXAMPLE_API_AUTHORIZATION must contain the complete Authorization value (such as a Bearer credential); configuration must not compose a prefix with an interpolated secret. The implementation must not support partial-string templates or read .env files; this makes validation and secret redaction predictable. Duplicate YAML mapping keys at any depth are a `config_invalid` failure; the selected parser must detect and reject them rather than retaining either occurrence.

The REST mapping language uses RFC 6901 JSON Pointer only:

- recordsPointer selects an array from the response.
- timestampPointer and valuePointer are evaluated relative to each record.
- bucket is none, hour, or day, always in UTC.
- aggregate is last, sum, or average.

`timestampPointer` must resolve to a valid RFC 3339 date-time string with an explicit `Z` or numeric UTC offset. Numeric Unix timestamps, date-only values, and timezone-less strings are invalid records with the stable `invalid_timestamp` diagnostic; accepted timestamps normalize to ISO 8601 UTC before bucketing.

With bucket: none, duplicate metricId/timestamp pairs in a response fail that source with the stable `duplicate_timestamp` request-data code; they are not skipped as malformed records. Hour/day buckets are reduced after a stable sort by normalized timestamp and original record position, and their timestamps represent the UTC start of the bucket. Connectors must emit only closed buckets: a bucket whose end is strictly after the connector's injected current time is omitted, so a bucket ending exactly at that time is included. Before writing a source's points, its transaction must compare every existing namespaced metric/timestamp value: an equal value is an idempotent no-op, while a different value fails the source with `historical_conflict` and rolls back that source's transaction. M3 never silently ignores or replaces a revised historical observation.

After a source first persists successfully, M3 accepts only append-only new timestamps. Existing timestamps must have equal values; any missing fetched timestamp at or before the source's latest persisted timestamp fails with the stable `late_backfill` code before points or signals are written. This deliberately rejects late observations instead of retaining stale signals that would no longer match recomputed percentage-change adjacency or threshold crossings. The source transaction rolls back fully on either `historical_conflict` or `late_backfill`.

This REST rule does not leave provider connectors to rely on SQLite's deduplication. Each provider contract must define how raw observations that normalize to the same output timestamp are handled before Core: either a documented deterministic reducer after the same stable sort, or a `duplicate_timestamp` source failure. The connector must return no duplicate output timestamps in either case. TASK-M3-0b and TASK-M3-0 record that rule for CoinGecko and Polymarket respectively before their connectors can be implemented.

M3 deliberately does not yet propose a Polymarket source schema. TASK-M3-0 must first record the schema and obtain human approval before the general M3 design or connector implementation is approved. That contract must unambiguously identify one market and one outcome, state whether value means probability or price, and document history/timestamp semantics. Missing outcome data must never be fabricated.

## Connector rules

Every M3 connector must:

1. use Node 20 built-in fetch unless a separately approved exception is made;
2. traverse documented provider pagination serially and with an explicit bound when that provider contract supports pagination;
3. return points in ascending timestamp order with deterministic tie-breaking;
4. expose read-only in-memory diagnostics for malformed individual records;
5. fail visibly for request-level errors, invalid top-level JSON, unsupported configuration, and unrecoverable pagination; and
6. redact all request-header values and interpolated values; and
7. apply its approved normalized-timestamp collision policy before returning points, never relying on storage's `INSERT OR IGNORE` behavior.

Malformed individual records are skipped with stable reason codes such as invalid_timestamp, invalid_value, missing_field, and unsupported_market. This applies the skip-and-audit normalization pattern documented in memory/reuse-candidates.md. A duplicate timestamp for an unbucketed REST response is instead the request-data failure defined above. A failed request is not silently treated as partial success.

### CoinGecko

The connector accepts the validated asset identifier, quote currency, interval, and an explicit history horizon. TASK-M3-0b must select and document the exact provider endpoint, request parameters, maximum supported horizon, observation-count expectation, UTC timestamp interpretation, provider limitations, and normalized-timestamp collision reducer or failure policy, then obtain human approval before the general M3 design is approved. TASK-M3-3 implements only that approved contract. Fixtures must include unordered, duplicate, malformed, and empty observations.

M3 assumes no paid plan. If a key or a paid endpoint becomes necessary, stop and request separate approval.

### Polymarket

Use Future-Signal as a behavioral reference, not copy-pasted code. Reimplement its proven handling for binary-outcome selection, inactive/closed-market exclusion, missing fields, pagination, and provider field-name fallbacks. Extra market metadata is not added to DataPoint in M3.

### Generic REST

The REST connector is JSON and GET only. It does not support scripts, arbitrary expressions, JSONPath filters, HTML scraping, OAuth flows, writes, retries, or pagination. It makes one request to the configured URL (plus only the approved same-origin redirect hops), does not inspect or follow pagination headers or response fields, and maps only that single response. URLs must use HTTPS except explicit test-only local endpoints. Redirect handling is manual and limited to three hops: each redirect target must have the same origin (scheme, host, and port) as the configured URL and is revalidated against this HTTPS/local-test rule before any request. A cross-origin, malformed, or over-bound redirect chain fails the source without following it, so configured headers never leave their original origin.

The connector reads the decoded response body as a stream and fails with the stable redacted `response_too_large` code before parsing when it exceeds 5 MiB (5,242,880 bytes). After parsing, `recordsPointer` must select no more than 10,000 records; a larger array fails with the same code. These limits are fixed rather than configuration-controlled, so a configuration cannot increase process memory use.

## Proposed CLI contract

Existing usage remains compatible:

~~~
signal-hub analyze <csv-file> [--min-score <n>] [--threshold <n>]
~~~

The proposed M3 command is:

~~~
signal-hub run <config-file> [--source <source-id>] [--min-score <n>] [--threshold <n>]
~~~

Configured sources execute sequentially in file order. Every invocation writes exactly one deterministic JSON document to stdout. It never echoes configuration headers or expanded environment values:

~~~json
{
  "status": "complete",
  "sources": [
    {
      "sourceId": "bitcoin-usd",
      "metricId": "crypto:bitcoin:usd",
      "signals": [
        {
          "id": "[\"bitcoin-usd\",\"percentage-change\",\"crypto:bitcoin:usd\",\"2026-08-03T00:00:00.000Z\",100,21]",
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

- status is `complete` when every selected source finishes, `partial` when execution stops at the first failed source after one or more source groups complete, or `failed` when configuration, argument parsing, source selection, or the first selected source fails before a source group completes.
- sources contains only successfully processed source groups, in selected configuration-file order. Each group has exactly sourceId, metricId, signals, and diagnostics. signals retain the existing Signal fields and deterministic order. Before formatting, the CLI replaces the private storage metric ID with the configured public metricId in `metricId`. It publishes an M3-specific serialized signal-ID tuple by prepending the unique `sourceId` and replacing only the private metric tuple item: a percentage-change ID is `[sourceId, detectorId, publicMetricId, timestamp, value, changePercent]`, while a threshold ID is `[sourceId, detectorId, threshold, publicMetricId, timestamp, value, changePercent]`. This preserves every detector-configuration tuple item and prevents public IDs from colliding when distinct source groups share a display metric ID and timestamp. Persisted signal IDs remain internal. diagnostics contains zero or more `{ code: string, count: positive integer }` entries, ordered by code.
- failure is null only for complete output. For partial output it is `{ "sourceId": string, "stage": "fetch" | "pipeline", "code": string }`. For failed output, sources is `[]` and failure is either `{ "sourceId": null, "stage": "usage" | "config" | "selection", "code": string }` or `{ "sourceId": string, "stage": "fetch" | "pipeline", "code": string }`. `usage` covers a missing config path, unknown flag, missing flag value, or nonnumeric option; `config` covers unreadable or invalid YAML, duplicate mapping keys, missing environment values, duplicate IDs, and invalid source definitions; `selection` covers an unknown `--source` ID. Codes are stable redacted classifications—`usage_invalid`, `config_unreadable`, `config_invalid`, `environment_missing`, `source_not_found`, `duplicate_timestamp`, `historical_conflict`, `late_backfill`, `response_too_large`, `fetch_failed`, or `pipeline_failed`—never provider response, parser, header, or error text.

M3 intentionally uses this explicit partial-completion contract rather than a run-wide transaction. Each individual source pipeline is atomic: Core must persist that source's points and signals in one SQLite transaction, rolling both back if detection or signal persistence fails. Successfully completed source groups may already be committed when a later source fails, no cross-source rollback is attempted, and the nonzero command exit status accompanies partial or failed JSON. Retrying follows the existing idempotent storage behavior. Configuration and selection failures occur before connector or pipeline construction and therefore persist nothing.

This CLI contract is proposed only. It needs public-API approval before implementation.

## Work breakdown

| ID | Work | Size | Depends on | Completion criteria |
| --- | --- | --- | --- | --- |
| TASK-M3-0 | Define and approve the Polymarket public contract | S | — | The source schema, market/outcome selection, value meaning, timestamp/history semantics and horizon, normalized-timestamp collision and identity-field policies, and human approval are recorded. |
| TASK-M3-0b | Define and approve CoinGecko history semantics | S | — | The endpoint, request parameters, horizon, observation-count expectation, timestamp semantics, provider limitations, normalized-timestamp collision and identity-field policies, and human approval are recorded. |
| TASK-M3-1 | Approve M3 design, dependency, config, and CLI contract | S | M3-0, M3-0b | Approvals record the YAML dependency, duplicate-key rejection, dedicated M3 database path, canonical identity digest and persistent metric namespace, horizon-bounded analysis, exact grouped JSON contract including usage/config/selection/first-source failures, per-source atomicity, partial-failure contract, and confirm no schema change. |
| TASK-M3-2 | Build config package | M | M3-1 | Parsing, duplicate-mapping-key rejection, header-only interpolation, schema validation, duplicate-source-ID rejection, output-visible placeholder rejection, canonical identity digest derivation, and redaction tests pass. |
| TASK-M3-3 | Build CoinGecko connector | M | M3-1 | Fixture tests cover the approved request/horizon semantics, normalization, UTC buckets, duplicate policy, diagnostics, and failures. |
| TASK-M3-4 | Build Polymarket connector | L | M3-1 | Approved API contract and fixtures cover pagination, eligibility filtering, normalization, duplicate policy, diagnostics, and failures. |
| TASK-M3-5 | Build generic REST connector | L | M3-1 | Single-response-only JSON Pointer mapping, RFC 3339 timestamp validation, 5 MiB/10,000-record limits, same-origin per-hop redirect validation, HTTPS validation, redaction, malformed records, and errors are covered. |
| TASK-M3-6 | Add approved CLI composition and docs | M | M3-2 through M3-5 | Existing analyze tests stay green; config-run tests cover namespaced persistence and identity changes, horizon-bounded reads, historical conflicts, late-backfill rejection, selection, order, source-atomic rollback, stable complete/partial/failed JSON, source-scoped public ID projection, usage errors, and redaction. |
| TASK-M3-7 | Release readiness | M | M3-6 | Build, tests, typecheck, API/package-boundary review, and approved public smoke tests pass. |

M3-3 through M3-5 can proceed in parallel after approval. No task may change the SQLite schema or shared `DataPoint`, `Signal`, `Detector`, or `Connector` contracts. TASK-M3-6 may add the storage-internal transaction boundary needed for Core's approved per-source atomicity, but it must not change that schema or the approved CLI contract; any broader API change stops for a focused proposal.

## Test strategy and v1.0 release gate

- Inject named test environment values; do not load a real environment file.
- Mock fetch and use recorded, redacted JSON fixtures. Network calls are not part of the normal suite.
- Assert byte-for-byte-equivalent output for the same config and mocked responses.
- Verify duplicate YAML mapping keys fail as `config_invalid` before interpolation or any request.
- Verify malformed records retain valid points with stable reason codes.
- Verify REST accepts only explicit-offset RFC 3339 timestamps, makes only its configured single request, and rejects a streamed body over 5 MiB or a records array over 10,000 with `response_too_large`.
- Verify request failures are visible and never include header values.
- Verify a later-source failure returns the exact partial JSON shape, uses a nonzero exit status, and leaves prior successful source groups explicitly represented.
- Verify a first-source fetch or pipeline failure returns the exact failed JSON shape with a nonzero exit status, no source groups, and no persisted points or signals for that source.
- Verify unreadable/invalid configuration, invalid command arguments, and unknown source selection return the exact failed JSON shape with a nonzero exit status, no source groups, and no persistence.
- Verify placeholders in output-visible fields are rejected before any output can expose an expanded environment value.
- Verify hour/day buckets whose UTC end is strictly after the injected current time are omitted; a bucket ending exactly at that time is included.
- Verify the dedicated M3 database keeps M3 sources independent of CSV data, while storage metric namespaces isolate previous configurations and overlapping configured display metric IDs within M3.
- Verify retargeting a REST URL or mapping (and every approved provider identity field) derives an independent persistence namespace even when `sourceId` and display `metricId` stay unchanged.
- Verify that two sources sharing a display metric ID and timestamp still publish distinct source-scoped signal IDs.
- Verify repeated runs read only each source's configured `historyDays` window from storage, so older rows cannot affect detection or output.
- Verify a revised persisted metric/timestamp value fails with `historical_conflict`, replaces neither the point nor signals, and rolls back only that source.
- Verify a newly discovered timestamp at or before an existing source's latest timestamp fails with `late_backfill`, preserves prior points and signals, and emits no contradictory recomputed signals.
- Verify each provider connector applies its approved normalized-timestamp collision policy before Core and never relies on SQLite to discard a duplicate output point.
- Verify only same-origin validated redirects are followed and configured headers are never sent to a different origin.
- Verify projected percentage-change and threshold signal IDs preserve their detector configuration, replace the private metric ID, and include the source ID.
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

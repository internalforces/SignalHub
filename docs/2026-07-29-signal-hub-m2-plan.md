# Signal Hub M2 (Beta) — GitHub Connector Plan

## Approval Gate

`connectors/github` is explicitly deferred by `memory/architecture.md`. This plan is a
preparation artifact only; implementation requires explicit human approval. TASK-012 (CI) is
independent and complete on this branch.

## Goal

Validate the deterministic pipeline against a live GitHub repository without changing the
canonical `DataPoint`, `Signal`, `Detector`, or CLI interfaces, adding a dependency, changing the
SQLite schema, or introducing a scheduler.

## Proposed Scope

- Add `@signal-hub/connector-github` under `connectors/github`.
- Use Node 20's built-in `fetch`; do not add an HTTP client dependency.
- Fetch the GitHub REST `GET /repos/{owner}/{repo}/commits` endpoint sequentially, following the
  endpoint's `Link` header for pagination. Request up to 100 records per page.
- Convert each valid `commit.committer.date` timestamp to a UTC day bucket and emit one data point per day,
  ordered by UTC day ascending:
  `{ metricId: "github:<owner>/<repo>:commits", timestamp: "<day>T00:00:00.000Z", value: <count> }`.
  Daily aggregation prevents multiple commits with the same timestamp from colliding with the
  existing `${metricId}::${timestamp}` storage key.
- Permit public-repository use without credentials. Accept an optional token supplied directly to
  the connector constructor for private repositories; never read, write, print, or commit a token.
- Skip malformed individual records and expose their ID/reason through an in-memory,
  read-only diagnostics accessor after `fetch()`. A failed HTTP request, invalid response body,
  or pagination failure remains a fetch error and must not be silently skipped.

GitHub documents the list-commits endpoint, its optional authentication for public resources,
the `Contents: read` permission for fine-grained tokens, and pagination parameters at
<https://docs.github.com/en/rest/commits/commits?apiVersion=2026-03-10>. GitHub also recommends
serial requests and consuming pagination links rather than hand-building page URLs at
<https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2026-03-10>.

## Explicit Non-Goals

- No new CLI command or flags. Wiring GitHub analysis into `signal-hub` changes the public CLI
  surface and needs a separate approval.
- No scheduled polling, webhooks, ETag persistence, rate-limit retries, or cooldown detector.
- No schema change or audit-file persistence. M2 diagnostics are transient so the MVP's SQLite
  storage boundary remains intact.
- No windowed detector or scoring-model change. These remain separately planned M2/M3 candidates.

## Implementation Steps After Approval

1. Create the package manifest and TypeScript configuration with dependencies limited to
   `@signal-hub/connector-sdk` and `@signal-hub/types`.
2. Write failing tests with a mocked `fetch` for: public requests, bearer-token requests,
   UTC daily aggregation, ISO normalization, multi-page `Link` traversal, malformed-record
   diagnostics, non-OK responses, and invalid JSON.
3. Implement the minimal connector and its exported types. Use a serial loop, the returned
   `Link` URL for the next page, `Accept: application/vnd.github+json`, and the current GitHub
   API version header.
4. Run the connector tests, root build, root tests, and root typecheck. Perform one manual public
   repository smoke test only after approval, without tokens.
5. Review package dependencies against the architecture constraint, record the chosen
   aggregation/diagnostic design in `memory/decisions.md`, move TASK-011 to completed only when
   all checks pass, and request review before merge.

## Acceptance Criteria

- A public repository can produce deterministic, daily GitHub commit-count data points.
- The same mocked API sequence yields the same UTC-day-ascending points and diagnostics on every run.
- Pagination is serial and driven by response `Link` values.
- A bad record does not discard valid records; a request-level failure is visible to the caller.
- No secret reaches source control, output, errors, or project memory.
- No package imports `core`, and no existing public contract or database schema changes.

## Follow-up Decisions Needed

1. Approve the deferred GitHub connector implementation described above.
2. Decide whether a future CLI integration should be a new command or additional `analyze` flags;
   either choice requires its own public-API approval.
3. Decide whether repeated GitHub ingestion merits persisted ETag/cooldown state. This would
   require a schema design and separate approval.

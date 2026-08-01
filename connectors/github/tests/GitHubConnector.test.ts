import { describe, expect, it, vi } from "vitest";
import { GitHubConnector } from "../src/index.js";
import type { GitHubConnectorDiagnostic } from "../src/index.js";

function commit(sha: string, date: string): unknown {
  return { sha, commit: { committer: { date } } };
}

function jsonResponse(body: unknown, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), { status: 200, headers });
}

describe("GitHubConnector", () => {
  it("fetches public repository commits with the documented API headers", async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse([commit("abc", "2026-07-29T12:00:00Z")]));
    const connector = new GitHubConnector({ owner: "octocat", repo: "Hello-World", fetch });

    await expect(connector.fetch()).resolves.toEqual([
      {
        metricId: "github:octocat/Hello-World:commits",
        timestamp: "2026-07-29T00:00:00.000Z",
        value: 1,
      },
    ]);

    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/octocat/Hello-World/commits?per_page=100",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2026-03-10",
        }),
      }),
    );
    expect(fetch.mock.calls[0][1]?.headers).not.toHaveProperty("Authorization");
  });

  it("sends a bearer token only when one is supplied", async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse([]));
    const connector = new GitHubConnector({ owner: "octocat", repo: "private-repo", token: "test-token", fetch });

    await connector.fetch();

    expect(fetch.mock.calls[0][1]?.headers).toMatchObject({ Authorization: "Bearer test-token" });
  });

  it("normalizes to UTC days, aggregates commits, and returns ascending days", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse([
        commit("latest", "2026-07-30T23:30:00-02:00"),
        commit("earlier", "2026-07-29T01:00:00Z"),
        commit("same-day", "2026-07-31T09:00:00Z"),
      ]),
    );
    const connector = new GitHubConnector({ owner: "octocat", repo: "Hello-World", fetch });

    await expect(connector.fetch()).resolves.toEqual([
      {
        metricId: "github:octocat/Hello-World:commits",
        timestamp: "2026-07-29T00:00:00.000Z",
        value: 1,
      },
      {
        metricId: "github:octocat/Hello-World:commits",
        timestamp: "2026-07-31T00:00:00.000Z",
        value: 2,
      },
    ]);
  });

  it("follows Link next pages serially", async () => {
    const nextPage = "https://api.github.com/repos/octocat/Hello-World/commits?per_page=100&page=2";
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([commit("first", "2026-07-29T00:00:00Z")], {
          Link: `<${nextPage}>; rel="next"`,
        }),
      )
      .mockResolvedValueOnce(jsonResponse([commit("second", "2026-07-30T00:00:00Z")]));
    const connector = new GitHubConnector({ owner: "octocat", repo: "Hello-World", fetch });

    await connector.fetch();

    expect(fetch).toHaveBeenNthCalledWith(2, nextPage, expect.any(Object));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("retains valid records and reports malformed records without exposing mutable state", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse([
        commit("valid", "2026-07-29T00:00:00Z"),
        { sha: "missing-date", commit: { committer: {} } },
        { commit: { committer: { date: "not-a-date" } } },
        null,
      ]),
    );
    const connector = new GitHubConnector({ owner: "octocat", repo: "Hello-World", fetch });

    await expect(connector.fetch()).resolves.toHaveLength(1);
    expect(connector.diagnostics).toEqual([
      { id: "missing-date", reason: "missing or invalid committer timestamp" },
      { id: "record:1:3", reason: "missing or invalid committer timestamp" },
      { id: "record:1:4", reason: "record was not an object" },
    ]);
    expect(() => (connector.diagnostics as GitHubConnectorDiagnostic[]).push({ id: "x", reason: "x" })).not.toThrow();
    expect(connector.diagnostics).toHaveLength(3);
  });

  it("surfaces request errors without including the supplied token", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("forbidden", { status: 403 }));
    const connector = new GitHubConnector({ owner: "octocat", repo: "private-repo", token: "secret-token", fetch });

    await expect(connector.fetch()).rejects.toThrow("status 403");
    await expect(connector.fetch()).rejects.not.toThrow("secret-token");
  });

  it("surfaces invalid JSON", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("not json", { status: 200 }));
    const connector = new GitHubConnector({ owner: "octocat", repo: "Hello-World", fetch });

    await expect(connector.fetch()).rejects.toThrow("not valid JSON");
  });

  it("surfaces a response body that is not an array", async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ message: "unexpected response" }));
    const connector = new GitHubConnector({ owner: "octocat", repo: "Hello-World", fetch });

    await expect(connector.fetch()).rejects.toThrow("was not an array");
  });
});

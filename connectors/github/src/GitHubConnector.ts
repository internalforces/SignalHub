import type { Connector, DataPoint } from "@signal-hub/connector-sdk";

const API_BASE_URL = "https://api.github.com";
const API_VERSION = "2026-03-10";

type FetchImplementation = typeof fetch;

interface GitHubCommitRecord {
  sha?: unknown;
  commit?: {
    committer?: {
      date?: unknown;
    };
  };
}

export interface GitHubConnectorOptions {
  owner: string;
  repo: string;
  token?: string;
  fetch?: FetchImplementation;
}

export interface GitHubConnectorDiagnostic {
  id: string;
  reason: string;
}

export class GitHubConnector implements Connector {
  readonly id: string;
  private readonly owner: string;
  private readonly repo: string;
  private readonly token?: string;
  private readonly fetchImplementation: FetchImplementation;
  private lastDiagnostics: GitHubConnectorDiagnostic[] = [];

  constructor(options: GitHubConnectorOptions) {
    this.owner = options.owner.trim();
    this.repo = options.repo.trim();
    if (!this.owner || !this.repo) {
      throw new Error("GitHub connector requires non-empty owner and repo values");
    }

    this.id = `github:${this.owner}/${this.repo}:commits`;
    this.token = options.token;
    this.fetchImplementation = options.fetch ?? globalThis.fetch;
  }

  get diagnostics(): readonly GitHubConnectorDiagnostic[] {
    return this.lastDiagnostics.map((diagnostic) => ({ ...diagnostic }));
  }

  async fetch(): Promise<DataPoint[]> {
    this.lastDiagnostics = [];
    const dailyCounts = new Map<string, number>();
    let pageNumber = 1;
    let nextUrl: URL | undefined = new URL(
      `/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/commits`,
      API_BASE_URL,
    );
    nextUrl.searchParams.set("per_page", "100");

    while (nextUrl) {
      const response = await this.request(nextUrl.toString());
      const records = await this.readRecords(response);

      records.forEach((record, index) => {
        const normalized = this.normalizeRecord(record, pageNumber, index + 1);
        if ("diagnostic" in normalized) {
          this.lastDiagnostics.push(normalized.diagnostic);
          return;
        }

        dailyCounts.set(normalized.day, (dailyCounts.get(normalized.day) ?? 0) + 1);
      });

      nextUrl = this.nextPageUrl(response.headers.get("link"));
      pageNumber += 1;
    }

    return [...dailyCounts.entries()]
      .sort(([firstDay], [secondDay]) => firstDay.localeCompare(secondDay))
      .map(([day, value]) => ({
        metricId: this.id,
        timestamp: `${day}T00:00:00.000Z`,
        value,
      }));
  }

  private async request(url: string): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    let response: Response;
    try {
      response = await this.fetchImplementation(url, { headers });
    } catch {
      throw new Error("GitHub commits request failed");
    }

    if (!response.ok) {
      throw new Error(`GitHub commits request failed with status ${response.status}`);
    }

    return response;
  }

  private async readRecords(response: Response): Promise<unknown[]> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new Error("GitHub commits response was not valid JSON");
    }

    if (!Array.isArray(body)) {
      throw new Error("GitHub commits response was not an array");
    }

    return body as GitHubCommitRecord[];
  }

  private normalizeRecord(
    record: unknown,
    pageNumber: number,
    recordNumber: number,
  ): { day: string } | { diagnostic: GitHubConnectorDiagnostic } {
    if (!isGitHubCommitRecord(record)) {
      return {
        diagnostic: {
          id: `record:${pageNumber}:${recordNumber}`,
          reason: "record was not an object",
        },
      };
    }

    const id =
      typeof record.sha === "string" && record.sha.trim().length > 0
        ? record.sha
        : `record:${pageNumber}:${recordNumber}`;
    const timestamp = record.commit?.committer?.date;
    if (typeof timestamp !== "string" || Number.isNaN(Date.parse(timestamp))) {
      return { diagnostic: { id, reason: "missing or invalid committer timestamp" } };
    }

    return { day: new Date(timestamp).toISOString().slice(0, 10) };
  }

  private nextPageUrl(linkHeader: string | null): URL | undefined {
    if (!linkHeader) {
      return undefined;
    }

    const nextLink = linkHeader
      .split(",")
      .map((part) => part.trim().match(/^<([^>]+)>\s*;\s*rel="([^"]+)"$/))
      .find((match) => match?.[2].split(/\s+/).includes("next"));

    if (!nextLink) {
      return undefined;
    }

    try {
      return new URL(nextLink[1]);
    } catch {
      throw new Error("GitHub commits pagination link was invalid");
    }
  }
}

function isGitHubCommitRecord(value: unknown): value is GitHubCommitRecord {
  return typeof value === "object" && value !== null;
}

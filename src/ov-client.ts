import { requestUrl } from "obsidian";
import { DiscoveredRoot, RemoteEntry } from "./types";

type ApiEnvelope<T> = {
  status: "ok" | "error";
  result?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

type LsOptions = {
  recursive?: boolean;
  simple?: boolean;
};

type SystemStatus = {
  initialized?: boolean;
  user?: unknown;
};

export class OpenVikingClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeoutMs = 10000,
  ) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    if (this.apiKey) {
      headers.set("X-API-Key", this.apiKey);
    }
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const requestHeaders: Record<string, string> = {};
    headers.forEach((value, key) => {
      requestHeaders[key] = value;
    });

    const response = await requestUrl({
      url: `${this.baseUrl}${path}`,
      method: init.method,
      headers: requestHeaders,
      body: typeof init.body === "string" ? init.body : undefined,
      throw: false,
      contentType: headers.get("Content-Type") ?? undefined,
    });
    const payload = (response.json ?? {}) as ApiEnvelope<T>;
    if (response.status >= 400 || payload.status === "error") {
      throw new Error(payload.error?.message ?? `OV request failed with HTTP ${response.status}`);
    }
    return payload.result as T;
  }

  async healthCheck(): Promise<void> {
    await this.request<{ status: string }>("/health");
  }

  async ls(uri: string, options: LsOptions = {}): Promise<RemoteEntry[]> {
    const query = new URLSearchParams();
    query.set("uri", uri);
    if (options.recursive) {
      query.set("recursive", "true");
    }
    if (options.simple) {
      query.set("simple", "true");
    }
    return this.request<RemoteEntry[]>(`/api/v1/fs/ls?${query.toString()}`);
  }

  async stat(uri: string): Promise<RemoteEntry> {
    const query = new URLSearchParams({ uri });
    return this.request<RemoteEntry>(`/api/v1/fs/stat?${query.toString()}`);
  }

  async read(uri: string): Promise<string> {
    return this.request<string>(`/api/v1/content/read?${new URLSearchParams({ uri }).toString()}`);
  }

  async abstract(uri: string): Promise<string> {
    return this.request<string>(
      `/api/v1/content/abstract?${new URLSearchParams({ uri }).toString()}`,
    );
  }

  async overview(uri: string): Promise<string> {
    return this.request<string>(
      `/api/v1/content/overview?${new URLSearchParams({ uri }).toString()}`,
    );
  }

  async createSession(): Promise<string> {
    const response = await this.request<{ session_id: string }>("/api/v1/sessions", {
      method: "POST",
      body: JSON.stringify({}),
    });
    return response.session_id;
  }

  async getSession(sessionId: string): Promise<{ message_count?: number }> {
    return this.request<{ message_count?: number }>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}`,
    );
  }

  async addSessionMessage(sessionId: string, role: "user" | "assistant", content: string): Promise<void> {
    await this.request(`/api/v1/sessions/${encodeURIComponent(sessionId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ role, content }),
    });
  }

  async extractSession(sessionId: string): Promise<Array<Record<string, unknown>>> {
    return this.request<Array<Record<string, unknown>>>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/extract`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.request(`/api/v1/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
    });
  }

  async link(fromUri: string, toUri: string, reason: string): Promise<void> {
    await this.request("/api/v1/relations/link", {
      method: "POST",
      body: JSON.stringify({
        from_uri: fromUri,
        to_uris: toUri,
        reason,
      }),
    });
  }

  async deleteUri(uri: string): Promise<void> {
    await this.request(`/api/v1/fs?${new URLSearchParams({ uri, recursive: "false" }).toString()}`, {
      method: "DELETE",
    });
  }

  async discoverMemoryRoots(): Promise<DiscoveredRoot[]> {
    const status = await this.request<SystemStatus>("/api/v1/system/status");
    const currentUser =
      typeof status.user === "string" && status.user.trim().length > 0 ? status.user.trim() : "default";

    const userRoots = await this.discoverScopeRoots("user", currentUser);
    const agentRoots = await this.discoverScopeRoots("agent");
    return [...userRoots, ...agentRoots];
  }

  private async discoverScopeRoots(scope: "user" | "agent", preferredSpace?: string): Promise<DiscoveredRoot[]> {
    const entries = await this.ls(`viking://${scope}`);
    const spaces = entries
      .filter((entry) => entry.isDir)
      .map((entry) => ({
        space: entry.uri.split("/").pop() ?? "",
        uri: entry.uri,
      }))
      .filter((entry) => entry.space && !entry.space.startsWith("."));

    const ordered = preferredSpace
      ? [
          ...spaces.filter((entry) => entry.space === preferredSpace),
          ...spaces.filter((entry) => entry.space !== preferredSpace),
        ]
      : spaces;

    const roots: DiscoveredRoot[] = [];
    for (const spaceEntry of ordered) {
      const memoriesUri = `viking://${scope}/${spaceEntry.space}/memories`;
      try {
        const stat = await this.stat(memoriesUri);
        if (stat.isDir) {
          roots.push({
            uri: memoriesUri,
            scope,
            space: spaceEntry.space,
          });
        }
      } catch {
        // Skip non-memory spaces.
      }
    }

    if (scope === "user" && preferredSpace) {
      const preferred = roots.find((root) => root.space === preferredSpace);
      return preferred ? [preferred] : roots.slice(0, 1);
    }

    return roots;
  }
}

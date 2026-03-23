import { Notice } from "obsidian";
import { summarizeBody } from "./markdown";
import { makeProjectionKey } from "./ov-uri";
import { OpenVikingClient } from "./ov-client";
import { VaultProjector } from "./projector";
import { formatSyncSummary } from "./sync-summary";
import { ProjectionStore } from "./store";
import {
  DiscoveredRoot,
  FindResultItem,
  PluginSettings,
  ProjectionState,
  ProjectionStatus,
  RemoteEntry,
  RevisionEvent,
  SyncSummary,
} from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

function newRevision(ovUri: string, type: RevisionEvent["type"], summary: string, extra: Partial<RevisionEvent> = {}): RevisionEvent {
  return {
    id: crypto.randomUUID(),
    ovUri,
    timestamp: nowIso(),
    type,
    summary,
    ...extra,
  };
}

export class SyncEngine {
  private currentSync: Promise<SyncSummary> | null = null;
  private pollTimer: number | null = null;

  constructor(
    private readonly settings: () => PluginSettings,
    private readonly client: OpenVikingClient,
    private readonly store: ProjectionStore,
    private readonly projector: VaultProjector,
  ) {}

  async runFullSync(showNotice = false): Promise<SyncSummary> {
    if (this.currentSync) {
      return this.currentSync;
    }
    this.currentSync = this.doRunFullSync(showNotice).finally(() => {
      this.currentSync = null;
    });
    return this.currentSync;
  }

  startPolling(): void {
    this.stopPolling();
    const intervalMs = this.settings().pollIntervalSec * 1000;
    this.pollTimer = window.setInterval(() => {
      void this.runFullSync(false);
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollTimer !== null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async syncCurrentRoot(rootUri: string): Promise<void> {
    await this.syncRoots([{ uri: rootUri, scope: "custom", space: "custom" }]);
  }

  private async doRunFullSync(showNotice: boolean): Promise<SyncSummary> {
    const roots = await this.resolveRoots();
    const summary: SyncSummary = {
      roots: roots.map((root) => root.uri),
      created: 0,
      updated: 0,
      deleted: 0,
      failed: 0,
      errors: [],
    };

    try {
      await this.syncRoots(roots, summary);
      if (showNotice) {
        new Notice(formatSyncSummary(summary), 8000);
      }
      return summary;
    } catch (error) {
      summary.failed += 1;
      summary.errors.push(String(error));
      new Notice(`OpenViking sync failed: ${String(error)}`, 8000);
      return summary;
    }
  }

  private async resolveRoots(): Promise<DiscoveredRoot[]> {
    const settings = this.settings();
    if (!settings.autoDiscoverRoots && settings.projectionRoots.length > 0) {
      return settings.projectionRoots.map((uri) => ({
        uri,
        scope: uri.includes("viking://agent/") ? "agent" : uri.includes("viking://user/") ? "user" : "custom",
        space: "custom",
      }));
    }

    if (settings.projectionRoots.length > 0) {
      return settings.projectionRoots.map((uri) => ({
        uri,
        scope: uri.includes("viking://agent/") ? "agent" : uri.includes("viking://user/") ? "user" : "custom",
        space: "custom",
      }));
    }

    return this.client.discoverMemoryRoots();
  }

  private async syncRoots(roots: DiscoveredRoot[], summary?: SyncSummary): Promise<void> {
    const discovered = new Set<string>();

    for (const root of roots) {
      try {
        await this.syncRoot(root, discovered, summary);
      } catch (error) {
        if (summary) {
          summary.failed += 1;
          summary.errors.push(`Root ${root.uri}: ${String(error)}`);
        }
      }
    }

    await this.reconcileDeletes(roots.map((root) => root.uri), discovered, summary);
  }

  private async syncRoot(root: DiscoveredRoot, discovered: Set<string>, summary?: SyncSummary): Promise<void> {
    const rootStat = await this.client.stat(root.uri);
    await this.syncDirectory(root.uri, root.uri, rootStat, discovered, root.scope, root.space, summary);

    const entries = await this.client.ls(root.uri, { recursive: true });
    for (const entry of entries) {
      const stat = await this.client.stat(entry.uri);
      if (stat.isDir) {
        await this.syncDirectory(entry.uri, root.uri, stat, discovered, root.scope, root.space, summary);
      } else if (entry.uri.endsWith(".md")) {
        await this.syncMemoryFile(entry.uri, root.uri, stat, discovered, root.scope, root.space, summary);
      }
    }
  }

  private async syncDirectory(
    dirUri: string,
    rootUri: string,
    stat: RemoteEntry,
    discovered: Set<string>,
    scope: ProjectionState["scope"],
    space: string,
    summary?: SyncSummary,
  ): Promise<void> {
    discovered.add(dirUri);
    const abstractState = this.getOrCreateState(dirUri, rootUri, scope, space, "directory_abstract");
    const overviewState = this.getOrCreateState(dirUri, rootUri, scope, space, "directory_overview");
    const wasSeen = Boolean(abstractState.sync.lastSyncedAt || overviewState.sync.lastSyncedAt);

    const abstractText = await this.client.abstract(dirUri);
    const overviewText = await this.client.overview(dirUri);
    const changed =
      abstractState.remote.modTime !== stat.modTime ||
      overviewState.remote.modTime !== stat.modTime ||
      !abstractState.localPath ||
      !overviewState.localPath;

    await this.upsertState(abstractState, stat, "synced");
    await this.upsertState(overviewState, stat, "synced");

    if (changed) {
      await this.projector.writeProjection(abstractState, abstractText, stat, { targetUri: dirUri });
      await this.projector.writeProjection(overviewState, overviewText, stat, { targetUri: dirUri });
    }

    if (changed) {
      if (summary) {
        if (wasSeen) {
          summary.updated += 1;
        } else {
          summary.created += 1;
        }
      }
      await this.store.appendRevision(
        newRevision(dirUri, wasSeen ? "remote_updated" : "remote_created", "Directory summaries refreshed from OpenViking", {
          layer: "l1",
          remoteModTime: stat.modTime,
          diffSummary: summarizeBody(overviewText),
        }),
      );
    }
  }

  private async syncMemoryFile(
    fileUri: string,
    rootUri: string,
    stat: RemoteEntry,
    discovered: Set<string>,
    scope: ProjectionState["scope"],
    space: string,
    summary?: SyncSummary,
  ): Promise<void> {
    discovered.add(fileUri);
    const state = this.getOrCreateState(fileUri, rootUri, scope, space, "memory_file");
    const remoteChanged =
      state.remote.modTime !== stat.modTime ||
      !state.localPath ||
      state.remote.abstractSource === undefined;
    const currentStatus = state.sync.status;

    if (state.draft.hasLocalDraft) {
      await this.upsertState(state, stat, remoteChanged ? "stale_remote" : currentStatus);
      await this.projector.updateMetadataOnly(state, stat);
      if (remoteChanged) {
        if (summary) {
          summary.updated += 1;
        }
        await this.store.appendRevision(
          newRevision(fileUri, "remote_updated", "Remote memory changed while local draft exists", {
            layer: "detail",
            remoteModTime: stat.modTime,
            diffSummary: "Remote modTime advanced while local draft was preserved",
          }),
        );
      }
      return;
    }

    if (!remoteChanged) {
      state.sync.lastSeenAt = nowIso();
      await this.store.upsertProjection(state);
      return;
    }

    const body = await this.client.read(fileUri);
    const parentUri = fileUri.slice(0, fileUri.lastIndexOf("/"));
    const abstractInfo = await this.resolveLeafAbstract(fileUri, parentUri, body);
    const eventType = state.sync.lastSyncedAt ? "remote_updated" : "remote_created";
    await this.upsertState(state, stat, "synced", body, abstractInfo);
    await this.projector.writeProjection(state, body, stat);

    if (remoteChanged) {
      if (summary) {
        if (state.sync.lastSyncedAt) {
          summary.updated += 1;
        } else {
          summary.created += 1;
        }
      }
      await this.store.appendRevision(
        newRevision(fileUri, eventType, eventType === "remote_created" ? "Remote memory created" : "Remote memory updated from OpenViking", {
          layer: "detail",
          remoteModTime: stat.modTime,
          diffSummary: summarizeBody(body),
        }),
      );
    }
  }

  private async reconcileDeletes(rootUris: string[], discovered: Set<string>, summary?: SyncSummary): Promise<void> {
    const managed = this.store.listProjections().filter((projection) => rootUris.includes(projection.ovRoot));
    for (const projection of managed) {
      if (discovered.has(projection.ovUri)) {
        continue;
      }
      if (projection.sync.status === "deleted_remote") {
        continue;
      }
      projection.remote.exists = false;
      projection.sync.status = "deleted_remote";
      projection.sync.lastSeenAt = nowIso();
      await this.projector.moveToDeleted(projection);
      await this.store.upsertProjection(projection);
      await this.store.appendRevision(
        newRevision(projection.ovUri, "remote_deleted", "Remote memory deleted from OpenViking", {
          layer: projection.entryType === "memory_file" ? "detail" : projection.entryType === "directory_abstract" ? "l0" : "l1",
        }),
      );
      if (summary) {
        summary.deleted += 1;
      }
    }
  }

  private getOrCreateState(
    ovUri: string,
    ovRoot: string,
    scope: ProjectionState["scope"],
    space: string,
    entryType: ProjectionState["entryType"],
  ): ProjectionState {
    const key = makeProjectionKey(ovUri, entryType);
    const existing = this.store.getProjection(key);
    if (existing) {
      return existing;
    }
    return {
      projectionKey: key,
      ovUri,
      ovRoot,
      scope,
      space,
      entryType,
      localPath: this.projector.buildProjectionPaths(ovUri, entryType).filePath,
      remote: {
        exists: true,
        isDir: entryType !== "memory_file",
      },
      sync: {
        status: "synced",
      },
      draft: {
        hasLocalDraft: false,
      },
      runtime: {},
    };
  }

  private async upsertState(
    state: ProjectionState,
    stat: RemoteEntry,
    status: ProjectionStatus,
    body?: string,
    abstractInfo?: {
      abstract: string;
      updatedAt?: string;
      source: string;
    },
  ): Promise<void> {
    state.remote.exists = true;
    state.remote.isDir = stat.isDir;
    state.remote.modTime = stat.modTime;
    state.remote.size = stat.size;
    if (abstractInfo) {
      state.remote.abstract = abstractInfo.abstract;
      state.remote.abstractUpdatedAt = abstractInfo.updatedAt ?? stat.modTime;
      state.remote.abstractSource = abstractInfo.source;
    }
    state.sync.status = status;
    state.sync.lastSeenAt = nowIso();
    state.sync.lastSyncedAt = nowIso();
    if (body !== undefined) {
      state.draft.lastSyncedContent = body;
      state.draft.hasLocalDraft = false;
      state.draft.localDraftUpdatedAt = undefined;
      if (status === "synced") {
        state.draft.lastSubmitResult = state.draft.lastSubmitResult;
      }
    }
    await this.store.upsertProjection(state);
  }

  private async resolveLeafAbstract(
    fileUri: string,
    parentUri: string,
    body: string,
  ): Promise<{ abstract: string; updatedAt?: string; source: string }> {
    const query = summarizeBody(body, 120);
    if (!query) {
      return {
        abstract: "",
        updatedAt: undefined,
        source: "unavailable",
      };
    }

    try {
      const result = await this.client.find(query, parentUri, 10);
      const memories = result.memories ?? [];
      const matched = memories.find((item) => item.uri === fileUri);
      if (matched?.abstract?.trim()) {
        return {
          abstract: matched.abstract.trim(),
          updatedAt: undefined,
          source: "search.find",
        };
      }
    } catch {
      // Ignore and fall through.
    }

    return {
      abstract: "",
      updatedAt: undefined,
      source: "unavailable",
    };
  }
}

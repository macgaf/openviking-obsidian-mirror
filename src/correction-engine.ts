import { Notice, TFile } from "obsidian";
import { summarizeBody } from "./markdown";
import { getParentDirectoryUri } from "./ov-uri";
import { OpenVikingClient } from "./ov-client";
import { VaultProjector } from "./projector";
import { ProjectionStore } from "./store";
import { ProjectionState } from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

export class CorrectionEngine {
  constructor(
    private readonly client: OpenVikingClient,
    private readonly store: ProjectionStore,
    private readonly projector: VaultProjector,
    private readonly refreshAll: () => Promise<void>,
  ) {}

  async detectDraft(file: TFile): Promise<void> {
    const projection = this.store.findProjectionByPath(file.path);
    if (!projection || projection.entryType !== "memory_file") {
      return;
    }

    const body = await this.projector.readBody(file.path);
    const hasDraft = body !== (projection.draft.lastSyncedContent ?? "");
    const wasDraft = projection.draft.hasLocalDraft;
    if (!hasDraft && !projection.draft.hasLocalDraft) {
      return;
    }

    projection.draft.hasLocalDraft = hasDraft;
    projection.draft.localDraftUpdatedAt = hasDraft ? nowIso() : undefined;
    projection.sync.status = hasDraft ? "local_draft" : "synced";
    await this.store.upsertProjection(projection);
    if (hasDraft && !wasDraft) {
      await this.store.appendRevision({
        id: crypto.randomUUID(),
        ovUri: projection.ovUri,
        timestamp: nowIso(),
        type: "local_draft_created",
        layer: "detail",
        summary: "Local draft created from memory file edits",
        diffSummary: summarizeBody(body),
      });
    }
  }

  async submitCorrection(projection: ProjectionState): Promise<void> {
    if (projection.entryType !== "memory_file") {
      throw new Error("Correction can only be submitted for memory files.");
    }

    const body = await this.projector.readBody(projection.localPath);
    if (body === (projection.draft.lastSyncedContent ?? "")) {
      throw new Error("No local changes to submit.");
    }

    projection.sync.status = "submit_pending";
    projection.draft.lastSubmitAt = nowIso();
    await this.store.upsertProjection(projection);
    await this.store.appendRevision({
      id: crypto.randomUUID(),
      ovUri: projection.ovUri,
      timestamp: nowIso(),
      type: "submit_started",
      layer: "detail",
      summary: "Correction submission started",
    });

    let sessionId: string | null = null;
    try {
      const parentUri = getParentDirectoryUri(projection.ovUri);
      const bestSummary = await this.getBestAvailableSummary(parentUri, projection.draft.lastSyncedContent ?? "");
      const message = [
        "Memory correction request",
        "",
        "Target memory URI:",
        projection.ovUri,
        "",
        "Original remote summary:",
        bestSummary,
        "",
        "Original remote content:",
        projection.draft.lastSyncedContent ?? "",
        "",
        "Human-corrected content:",
        body,
        "",
        "Correction intent:",
        "This is a human correction for the target memory. Keep the meaning aligned with the corrected content. Prefer producing one corrected long-term memory entry rather than multiple fragmented memories.",
        "",
        "Source:",
        "obsidian-openviking-plugin",
      ].join("\n");

      sessionId = await this.client.createSession();
      await this.client.addSessionMessage(sessionId, "user", message);
      await this.client.getSession(sessionId);
      const extracted = await this.client.extractSession(sessionId);
      const candidateUris = extracted
        .map((item) => (typeof item.uri === "string" ? item.uri : ""))
        .filter((uri) => uri && uri !== projection.ovUri);

      if (candidateUris.length !== 1) {
        throw new Error(
          candidateUris.length === 0
            ? "Extraction did not produce a new correction URI."
            : "Extraction produced multiple correction candidates.",
        );
      }

      const correctionUri = candidateUris[0]!;
      await this.client.link(projection.ovUri, correctionUri, "Human correction from Obsidian");
      projection.sync.status = "synced";
      projection.draft.hasLocalDraft = false;
      projection.draft.localDraftUpdatedAt = undefined;
      projection.draft.lastSubmitResult = "success";
      projection.draft.lastCorrectionUri = correctionUri;
      projection.draft.lastSyncedContent = body;
      await this.store.upsertProjection(projection);
      await this.store.appendRevision({
        id: crypto.randomUUID(),
        ovUri: projection.ovUri,
        timestamp: nowIso(),
        type: "submit_succeeded",
        layer: "detail",
        summary: "Correction submitted successfully",
        correctionUri,
      });
      await this.refreshAll();
    } catch (error) {
      projection.sync.status = "submit_failed";
      projection.draft.lastSubmitResult = String(error);
      await this.store.upsertProjection(projection);
      await this.store.appendRevision({
        id: crypto.randomUUID(),
        ovUri: projection.ovUri,
        timestamp: nowIso(),
        type: "submit_failed",
        layer: "detail",
        summary: "Correction submission failed",
        errorMessage: String(error),
      });
      throw error;
    } finally {
      if (sessionId) {
        await this.client.deleteSession(sessionId).catch(() => undefined);
      }
    }
  }

  async resetDraft(projection: ProjectionState): Promise<void> {
    if (projection.entryType !== "memory_file") {
      throw new Error("Only memory files can reset drafts.");
    }
    await this.projector.writeProjection(
      projection,
      projection.draft.lastSyncedContent ?? "",
      {
        uri: projection.ovUri,
        name: projection.ovUri.split("/").pop() ?? projection.ovUri,
        size: projection.remote.size ?? 0,
        modTime: projection.remote.modTime ?? nowIso(),
        isDir: false,
      },
    );
    projection.draft.hasLocalDraft = false;
    projection.draft.localDraftUpdatedAt = undefined;
    projection.sync.status = "synced";
    await this.store.upsertProjection(projection);
    await this.store.appendRevision({
      id: crypto.randomUUID(),
      ovUri: projection.ovUri,
      timestamp: nowIso(),
      type: "local_draft_reset",
      layer: "detail",
      summary: "Local draft reset to latest OV content",
    });
  }

  async markDelete(projection: ProjectionState): Promise<void> {
    if (projection.entryType !== "memory_file") {
      throw new Error("Only memory files can be deleted.");
    }
    projection.sync.status = "delete_pending";
    await this.store.upsertProjection(projection);
    await this.store.appendRevision({
      id: crypto.randomUUID(),
      ovUri: projection.ovUri,
      timestamp: nowIso(),
      type: "delete_marked",
      layer: "detail",
      summary: "Memory marked for deletion",
    });
  }

  async confirmDelete(projection: ProjectionState): Promise<void> {
    if (projection.entryType !== "memory_file") {
      throw new Error("Only memory files can be deleted.");
    }
    if (projection.sync.status !== "delete_pending") {
      throw new Error("Memory is not marked for deletion.");
    }
    await this.client.deleteUri(projection.ovUri);
    projection.sync.status = "deleted_remote";
    projection.remote.exists = false;
    await this.projector.moveToDeleted(projection);
    await this.store.upsertProjection(projection);
    await this.store.appendRevision({
      id: crypto.randomUUID(),
      ovUri: projection.ovUri,
      timestamp: nowIso(),
      type: "delete_confirmed",
      layer: "detail",
      summary: "Memory deleted from OV",
    });
  }

  private async getBestAvailableSummary(parentUri: string, fallbackContent: string): Promise<string> {
    try {
      const overview = await this.client.overview(parentUri);
      if (overview.trim()) {
        return overview.trim();
      }
    } catch {
      // fall through
    }

    try {
      const abstract = await this.client.abstract(parentUri);
      if (abstract.trim()) {
        return abstract.trim();
      }
    } catch {
      // fall through
    }

    return summarizeBody(fallbackContent);
  }
}

import { App, Notice, TFile, getFrontMatterInfo, normalizePath } from "obsidian";
import { parseOvUri, getProjectionLayer, toDeletedPath } from "./ov-uri";
import {
  extractEditableBody,
  extractGeneratedAbstractSection,
  renderLeafAbstractSection,
  renderManagedBody,
  renderManagedMemoryBody,
} from "./markdown";
import {
  ManagedEntryType,
  ProjectionFrontmatter,
  ProjectionState,
  RemoteEntry,
} from "./types";

const MANAGED_BY = "obsidian-openviking-plugin";

type ProjectionPaths = {
  folderPath: string;
  filePath: string;
};

export class VaultProjector {
  private readonly selfWritePaths = new Set<string>();

  constructor(
    private readonly app: App,
    private readonly vaultFolder: string,
    private readonly getMemoryAbstractLabels: () => {
      title: string;
      note: string;
      updated: string;
      source: string;
      unavailable: string;
    },
  ) {}

  isSelfWrite(path: string): boolean {
    return this.selfWritePaths.has(normalizePath(path));
  }

  buildProjectionPaths(ovUri: string, entryType: ManagedEntryType): ProjectionPaths {
    const parsed = parseOvUri(ovUri);
    const relative = [this.vaultFolder, parsed.scope, parsed.space, ...parsed.parts];

    if (entryType === "memory_file") {
      const filePath = normalizePath(relative.join("/"));
      return {
        folderPath: normalizePath(relative.slice(0, -1).join("/")),
        filePath,
      };
    }

    const folderPath = normalizePath(relative.join("/"));
    const fileName = entryType === "directory_abstract" ? "_dir.abstract.md" : "_dir.overview.md";
    return {
      folderPath,
      filePath: normalizePath(`${folderPath}/${fileName}`),
    };
  }

  async ensureFolder(path: string): Promise<void> {
    const normalized = normalizePath(path);
    const parts = normalized.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) {
        await this.app.vault.createFolder(current);
      }
    }
  }

  async writeProjection(
    state: ProjectionState,
    body: string,
    stat: RemoteEntry | undefined,
    options: {
      targetUri?: string;
      overwriteBody?: boolean;
    } = {},
  ): Promise<TFile> {
    const { filePath, folderPath } = this.buildProjectionPaths(state.ovUri, state.entryType);
    await this.ensureFolder(folderPath);
    const frontmatter = this.buildFrontmatter(state, stat, options.targetUri);
    const file = this.app.vault.getAbstractFileByPath(filePath);
    const text =
      state.entryType === "memory_file"
        ? renderManagedMemoryBody(body, {
            abstract: state.remote.abstract ?? "",
            abstractUpdatedAt: state.remote.abstractUpdatedAt,
            abstractSource: state.remote.abstractSource,
            labels: this.getMemoryAbstractLabels(),
          })
        : renderManagedBody(body);

    this.selfWritePaths.add(filePath);
    try {
      if (file instanceof TFile) {
        await this.app.vault.process(file, (current) => this.replaceDocumentBody(current, text));
        await this.syncFrontmatter(file, frontmatter);
        state.localPath = file.path;
        return file;
      }

      const created = await this.app.vault.create(filePath, text);
      await this.syncFrontmatter(created, frontmatter);
      state.localPath = created.path;
      return created;
    } finally {
      this.selfWritePaths.delete(filePath);
    }
  }

  async updateMetadataOnly(state: ProjectionState, stat: RemoteEntry | undefined): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(state.localPath);
    if (!(file instanceof TFile)) {
      return;
    }
    const current = await this.app.vault.read(file);
    const body =
      state.entryType === "memory_file"
        ? extractEditableBody(this.extractDocumentBody(current))
        : this.extractDocumentBody(current);
    await this.writeProjection(state, body, stat);
  }

  async readBody(path: string): Promise<string> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      throw new Error(`Managed file missing: ${path}`);
    }
    const current = await this.app.vault.read(file);
    return extractEditableBody(this.extractDocumentBody(current));
  }

  async enforceGeneratedAbstract(state: ProjectionState): Promise<boolean> {
    if (state.entryType !== "memory_file") {
      return false;
    }

    const file = this.app.vault.getAbstractFileByPath(state.localPath);
    if (!(file instanceof TFile)) {
      return false;
    }

    const current = await this.app.vault.read(file);
    const currentSection = extractGeneratedAbstractSection(this.extractDocumentBody(current));
    const expectedSection = renderLeafAbstractSection(
      state.remote.abstract ?? "",
      state.remote.abstractUpdatedAt,
      state.remote.abstractSource,
      this.getMemoryAbstractLabels(),
    );

    if (currentSection === expectedSection) {
      return false;
    }

    await this.writeProjection(
      state,
      extractEditableBody(current),
      {
        uri: state.ovUri,
        name: state.ovUri.split("/").pop() ?? state.ovUri,
        size: state.remote.size ?? 0,
        modTime: state.remote.modTime ?? new Date().toISOString(),
        isDir: false,
      },
    );
    return true;
  }

  async moveToDeleted(state: ProjectionState): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(state.localPath);
    if (!(file instanceof TFile)) {
      return;
    }

    const relative = toDeletedPath(state.localPath.replace(new RegExp(`^${this.vaultFolder}/?`), ""));
    const targetPath = normalizePath(`${this.vaultFolder}/_deleted/${relative}`);
    const targetFolder = targetPath.split("/").slice(0, -1).join("/");
    await this.ensureFolder(targetFolder);
    this.selfWritePaths.add(file.path);
    try {
      await this.app.fileManager.renameFile(file, targetPath);
      state.localPath = targetPath;
    } finally {
      this.selfWritePaths.delete(file.path);
    }
  }

  async openFile(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(true).openFile(file);
    } else {
      new Notice(`Managed file not found: ${path}`);
    }
  }

  private buildFrontmatter(
    state: ProjectionState,
    stat: RemoteEntry | undefined,
    targetUri?: string,
  ): ProjectionFrontmatter {
    const parsed = parseOvUri(state.ovUri);
    const frontmatter: ProjectionFrontmatter = {
      ov_uri: state.ovUri,
      ov_root: state.ovRoot,
      ov_scope: state.scope,
      ov_space: state.space,
      ov_entry_type: state.entryType,
      ov_layer: getProjectionLayer(state.entryType),
      ov_name: parsed.basename,
      ov_projection_version: 1,
      ov_remote_mod_time: stat?.modTime ?? state.remote.modTime,
      ov_remote_size: stat?.size ?? state.remote.size,
      ov_remote_exists: state.remote.exists,
      ov_synced_at: state.sync.lastSyncedAt,
      ov_last_seen_at: state.sync.lastSeenAt,
      ov_status: state.sync.status,
      ov_deleted: state.sync.status === "deleted_remote",
      ov_readonly: state.entryType !== "memory_file",
      ov_managed_by: MANAGED_BY,
    };

    if (state.entryType === "memory_file") {
      frontmatter.ov_editable = true;
      frontmatter.ov_has_local_draft = state.draft.hasLocalDraft;
      frontmatter.ov_local_draft_updated_at = state.draft.localDraftUpdatedAt;
      frontmatter.ov_last_submit_at = state.draft.lastSubmitAt;
      frontmatter.ov_last_submit_result = state.draft.lastSubmitResult;
      frontmatter.ov_last_correction_uri = state.draft.lastCorrectionUri;
      frontmatter.ov_correction_target_uri = state.ovUri;
      frontmatter.ov_leaf_abstract_updated_at = state.remote.abstractUpdatedAt;
      frontmatter.ov_leaf_abstract_source = state.remote.abstractSource;
    } else {
      frontmatter.ov_editable = false;
      frontmatter.ov_generated_by = "ov";
      frontmatter.ov_target_uri = targetUri ?? state.ovUri;
    }

    return frontmatter;
  }

  private async syncFrontmatter(file: TFile, frontmatter: ProjectionFrontmatter): Promise<void> {
    const entries = Object.entries(frontmatter).filter(([, value]) => value !== undefined);
    const nextKeys = new Set(entries.map(([key]) => key));
    await this.app.fileManager.processFrontMatter(file, (current) => {
      for (const key of Object.keys(current)) {
        if (key.startsWith("ov_") && !nextKeys.has(key)) {
          delete current[key];
        }
      }
      for (const [key, value] of entries) {
        current[key] = value;
      }
    });
  }

  private extractDocumentBody(text: string): string {
    const info = getFrontMatterInfo(text);
    return (info.exists ? text.slice(info.contentStart) : text).replace(/^\n+/, "");
  }

  private replaceDocumentBody(text: string, body: string): string {
    const info = getFrontMatterInfo(text);
    return info.exists ? `${text.slice(0, info.contentStart)}${renderManagedBody(body)}` : renderManagedBody(body);
  }
}

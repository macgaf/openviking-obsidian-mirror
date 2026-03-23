import { Plugin } from "obsidian";
import { PersistedState, PluginSettings, ProjectionKey, ProjectionState, RevisionEvent } from "./types";

const STORE_VERSION = 1;
const MAX_REVISIONS_PER_URI = 200;

export class ProjectionStore {
  private state: PersistedState = {
    version: STORE_VERSION,
    projections: {},
    revisions: {},
  };

  constructor(private readonly plugin: Plugin) {}

  async load(initialSettings: PluginSettings): Promise<void> {
    const loaded = ((await this.plugin.loadData()) ?? {}) as Partial<PersistedState>;
    this.state = {
      version: STORE_VERSION,
      settings: loaded.settings ?? initialSettings,
      projections: loaded.projections ?? {},
      revisions: loaded.revisions ?? {},
    };
    await this.save();
  }

  async save(): Promise<void> {
    await this.plugin.saveData(this.state);
  }

  getSettings(): Partial<PluginSettings> | undefined {
    return this.state.settings;
  }

  async setSettings(settings: PluginSettings): Promise<void> {
    this.state.settings = settings;
    await this.save();
  }

  getProjection(key: ProjectionKey): ProjectionState | undefined {
    return this.state.projections[key];
  }

  getProjectionByUriAndType(ovUri: string, entryType: ProjectionState["entryType"]): ProjectionState | undefined {
    return Object.values(this.state.projections).find(
      (projection) => projection.ovUri === ovUri && projection.entryType === entryType,
    );
  }

  listProjections(): ProjectionState[] {
    return Object.values(this.state.projections);
  }

  findProjectionByPath(path: string): ProjectionState | undefined {
    return Object.values(this.state.projections).find((projection) => projection.localPath === path);
  }

  async upsertProjection(state: ProjectionState): Promise<void> {
    this.state.projections[state.projectionKey] = state;
    await this.save();
  }

  async removeProjection(key: ProjectionKey): Promise<void> {
    delete this.state.projections[key];
    await this.save();
  }

  listRevisions(ovUri: string): RevisionEvent[] {
    return this.state.revisions[ovUri] ?? [];
  }

  async appendRevision(event: RevisionEvent): Promise<void> {
    const current = this.state.revisions[event.ovUri] ?? [];
    current.unshift(event);
    this.state.revisions[event.ovUri] = current.slice(0, MAX_REVISIONS_PER_URI);
    await this.save();
  }
}

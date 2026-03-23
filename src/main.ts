import {
  Notice,
  Plugin,
  TFile,
} from "obsidian";
import { registerCommands } from "./commands";
import { CorrectionEngine } from "./correction-engine";
import { RevisionHistoryModal } from "./history-view";
import { TranslationKey, formatSyncSummaryI18n, t as translate } from "./i18n";
import { OpenVikingClient } from "./ov-client";
import { VaultProjector } from "./projector";
import { DEFAULT_SETTINGS, OpenVikingSettingTab, normalizeSettings } from "./settings";
import { SyncEngine } from "./sync-engine";
import { ProjectionStore } from "./store";
import { PluginSettings } from "./types";

export default class OpenVikingSyncPlugin extends Plugin {
  settings!: PluginSettings;
  client!: OpenVikingClient;
  store!: ProjectionStore;
  projector!: VaultProjector;
  syncEngine!: SyncEngine;
  correctionEngine!: CorrectionEngine;

  async onload(): Promise<void> {
    this.store = new ProjectionStore(this);
    await this.store.load(DEFAULT_SETTINGS);
    this.settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      ...this.store.getSettings(),
    });
    await this.store.setSettings(this.settings);

    this.initializeServices();

    this.addSettingTab(new OpenVikingSettingTab(this.app, this));
    registerCommands(this);

    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile) {
          void this.handleVaultModify(file);
        }
      }),
    );

    try {
      await this.syncEngine.runFullSync(false);
    } catch (error) {
      new Notice(this.t("notice.initialSyncFailed", { error: String(error) }));
    }
    this.syncEngine.startPolling();
  }

  onunload(): void {
    this.syncEngine.stopPolling();
  }

  async updateSettings(patch: Partial<PluginSettings>): Promise<void> {
    this.settings = normalizeSettings({
      ...this.settings,
      ...patch,
    });
    await this.store.setSettings(this.settings);
    this.initializeServices();
    this.syncEngine.startPolling();
  }

  openRevisionHistory(ovUri: string): void {
    new RevisionHistoryModal(this.app, this, this.store, ovUri).open();
  }

  t(key: TranslationKey, vars: Record<string, string | number> = {}): string {
    return translate(this.settings.uiLanguage, key, vars);
  }

  formatSyncSummary(summary: import("./types").SyncSummary): string {
    return formatSyncSummaryI18n(summary, this.settings.uiLanguage);
  }

  private initializeServices(): void {
    this.client = new OpenVikingClient(this.settings.baseUrl, this.settings.apiKey);
    this.projector = new VaultProjector(this.app, this.settings.vaultFolder, () => ({
      title: this.t("memory.abstract.title"),
      note: this.t("memory.abstract.note"),
      updated: this.t("memory.abstract.updated"),
      source: this.t("memory.abstract.source"),
      unavailable: this.t("memory.abstract.unavailable"),
    }));
    this.syncEngine = new SyncEngine(
      () => this.settings,
      this.client,
      this.store,
      this.projector,
    );
    this.correctionEngine = new CorrectionEngine(
      this.client,
      this.store,
      this.projector,
      async () => {
        await this.syncEngine.runFullSync(false);
      },
    );
  }

  private async handleVaultModify(file: TFile): Promise<void> {
    if (this.projector.isSelfWrite(file.path)) {
      return;
    }

    const projection = this.store.findProjectionByPath(file.path);
    if (!projection) {
      return;
    }

    if (projection.entryType !== "memory_file") {
      try {
        await this.syncEngine.runFullSync(false);
        new Notice(this.t("notice.directoryRefreshed"));
      } catch (error) {
        new Notice(this.t("notice.directoryRestoreFailed", { error: String(error) }));
      }
      return;
    }

    const restored = await this.projector.enforceGeneratedAbstract(projection);
    if (restored) {
      new Notice(this.t("notice.abstractRestored"));
    }

    await this.correctionEngine.detectDraft(file);
  }
}

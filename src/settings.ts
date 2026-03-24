import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { LANGUAGE_LABELS } from "./i18n";
import type OpenVikingSyncPlugin from "./main";
import { PluginSettings } from "./types";

export const DEFAULT_SETTINGS: PluginSettings = {
  baseUrl: "http://127.0.0.1:1933",
  apiKey: "",
  uiLanguage: "en",
  autoDiscoverRoots: true,
  projectionRoots: [],
  vaultFolder: "OpenViking",
  pollIntervalSec: 60,
};

export function normalizeSettings(input: Partial<PluginSettings> | undefined): PluginSettings {
  return {
    baseUrl: (input?.baseUrl ?? DEFAULT_SETTINGS.baseUrl).trim().replace(/\/+$/, ""),
    apiKey: (input?.apiKey ?? DEFAULT_SETTINGS.apiKey).trim(),
    uiLanguage: input?.uiLanguage ?? DEFAULT_SETTINGS.uiLanguage,
    autoDiscoverRoots: input?.autoDiscoverRoots ?? DEFAULT_SETTINGS.autoDiscoverRoots,
    projectionRoots: (input?.projectionRoots ?? DEFAULT_SETTINGS.projectionRoots)
      .map((root) => root.trim().replace(/\/+$/, ""))
      .filter(Boolean),
    vaultFolder:
      (input?.vaultFolder ?? DEFAULT_SETTINGS.vaultFolder).trim().replace(/^\/+|\/+$/g, "") ||
      DEFAULT_SETTINGS.vaultFolder,
    pollIntervalSec: Math.max(15, Math.floor(input?.pollIntervalSec ?? DEFAULT_SETTINGS.pollIntervalSec)),
  };
}

export class OpenVikingSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: OpenVikingSyncPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const t = this.plugin.t.bind(this.plugin);

    new Setting(containerEl)
      .setName(t("settings.uiLanguage.name"))
      .setDesc(t("settings.uiLanguage.desc"))
      .addDropdown((dropdown) => {
        for (const [value, label] of Object.entries(LANGUAGE_LABELS)) {
          dropdown.addOption(value, label);
        }
        dropdown.setValue(this.plugin.settings.uiLanguage).onChange(async (value) => {
          await this.plugin.updateSettings({ uiLanguage: value as PluginSettings["uiLanguage"] });
          this.display();
          new Notice(t("settings.reloadNotice"));
        });
      });

    new Setting(containerEl)
      .setName(t("settings.baseUrl.name"))
      .setDesc(t("settings.baseUrl.desc"))
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.baseUrl)
          .setValue(this.plugin.settings.baseUrl)
          .onChange(async (value) => {
            await this.plugin.updateSettings({ baseUrl: value });
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.apiKey.name"))
      .setDesc(t("settings.apiKey.desc"))
      .addText((text) =>
        text
          .setPlaceholder("X-API-Key")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            await this.plugin.updateSettings({ apiKey: value });
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.autoDiscover.name"))
      .setDesc(t("settings.autoDiscover.desc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoDiscoverRoots).onChange(async (value) => {
          await this.plugin.updateSettings({ autoDiscoverRoots: value });
          this.display();
        }),
      );

    new Setting(containerEl)
      .setName(t("settings.projectionRoots.name"))
      .setDesc(t("settings.projectionRoots.desc"))
      .addTextArea((text) =>
        text
          .setPlaceholder("Example: viking://user/default/memories")
          .setValue(this.plugin.settings.projectionRoots.join("\n"))
          .onChange(async (value) => {
            await this.plugin.updateSettings({
              projectionRoots: value
                .split("\n")
                .map((root) => root.trim())
                .filter(Boolean),
            });
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.vaultFolder.name"))
      .setDesc(t("settings.vaultFolder.desc"))
      .addText((text) =>
        text.setValue(this.plugin.settings.vaultFolder).onChange(async (value) => {
          await this.plugin.updateSettings({ vaultFolder: value });
        }),
      );

    new Setting(containerEl)
      .setName(t("settings.pollInterval.name"))
      .setDesc(t("settings.pollInterval.desc"))
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.pollIntervalSec))
          .onChange(async (value) => {
            const next = Number.parseInt(value, 10);
            if (!Number.isNaN(next)) {
              await this.plugin.updateSettings({ pollIntervalSec: next });
            }
          }),
      );

    const syncSetting = new Setting(containerEl)
      .setName(t("settings.syncNow.name"))
      .setDesc(t("settings.syncNow.desc"));

    syncSetting.addButton((button) =>
      button.setButtonText(t("settings.syncNow.name")).onClick(async () => {
        button.setDisabled(true);
        syncSetting.setDesc(t("settings.syncNow.running"));
        try {
          const summary = await this.plugin.syncEngine.runFullSync(false);
          const message = this.plugin.formatSyncSummary(summary);
          syncSetting.setDesc(message);
          if (summary.errors.length > 0) {
            new Notice(message, 10000);
          }
        } catch (error) {
          const message = this.plugin.t("notice.initialSyncFailed", { error: String(error) });
          syncSetting.setDesc(message);
          new Notice(message, 10000);
        } finally {
          button.setDisabled(false);
        }
      }),
    );
  }
}

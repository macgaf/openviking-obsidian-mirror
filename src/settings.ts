import { App, PluginSettingTab, Setting } from "obsidian";
import type OpenVikingSyncPlugin from "./main";
import { PluginSettings } from "./types";

export const DEFAULT_SETTINGS: PluginSettings = {
  baseUrl: "http://127.0.0.1:1933",
  apiKey: "",
  autoDiscoverRoots: true,
  projectionRoots: [],
  vaultFolder: "OpenViking",
  pollIntervalSec: 60,
};

export function normalizeSettings(input: Partial<PluginSettings> | undefined): PluginSettings {
  return {
    baseUrl: (input?.baseUrl ?? DEFAULT_SETTINGS.baseUrl).trim().replace(/\/+$/, ""),
    apiKey: (input?.apiKey ?? DEFAULT_SETTINGS.apiKey).trim(),
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

    new Setting(containerEl)
      .setName("OV base URL")
      .setDesc("Base URL for the OpenViking HTTP service.")
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.baseUrl)
          .setValue(this.plugin.settings.baseUrl)
          .onChange(async (value) => {
            await this.plugin.updateSettings({ baseUrl: value });
          }),
      );

    new Setting(containerEl)
      .setName("API key")
      .setDesc("Optional OV API key. Leave blank only if the service allows anonymous reads.")
      .addText((text) =>
        text
          .setPlaceholder("X-API-Key")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            await this.plugin.updateSettings({ apiKey: value });
          }),
      );

    new Setting(containerEl)
      .setName("Auto-discover memory roots")
      .setDesc("Discover current user and agent memory roots from the OV instance at startup.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoDiscoverRoots).onChange(async (value) => {
          await this.plugin.updateSettings({ autoDiscoverRoots: value });
          this.display();
        }),
      );

    new Setting(containerEl)
      .setName("Projection roots")
      .setDesc("One OV memory root per line. Used when auto-discovery is disabled.")
      .addTextArea((text) =>
        text
          .setPlaceholder("viking://user/default/memories")
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
      .setName("Vault folder")
      .setDesc("Root folder inside the Obsidian vault that stores OV projections.")
      .addText((text) =>
        text.setValue(this.plugin.settings.vaultFolder).onChange(async (value) => {
          await this.plugin.updateSettings({ vaultFolder: value });
        }),
      );

    new Setting(containerEl)
      .setName("Polling interval (seconds)")
      .setDesc("How often the plugin polls OV for changes.")
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
  }
}

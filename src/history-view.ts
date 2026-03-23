import { App, Modal, Setting } from "obsidian";
import type OpenVikingSyncPlugin from "./main";
import { ProjectionStore } from "./store";

export class RevisionHistoryModal extends Modal {
  constructor(
    app: App,
    private readonly plugin: OpenVikingSyncPlugin,
    private readonly store: ProjectionStore,
    private readonly ovUri: string,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.plugin.t("history.title") });
    const revisions = this.store.listRevisions(this.ovUri);
    if (revisions.length === 0) {
      contentEl.createEl("p", { text: this.plugin.t("history.empty") });
      return;
    }

    for (const event of revisions.slice(0, 20)) {
      const setting = new Setting(contentEl)
        .setName(`${event.type} · ${new Date(event.timestamp).toLocaleString()}`)
        .setDesc(event.summary);

      if (event.correctionUri) {
        const correctionUri = event.correctionUri;
        setting.addExtraButton((button) =>
          button.setIcon("link").setTooltip(correctionUri).onClick(() => {
            void navigator.clipboard.writeText(correctionUri);
          }),
        );
      }
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

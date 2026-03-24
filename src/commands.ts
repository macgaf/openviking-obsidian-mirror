import { Notice } from "obsidian";
import type OpenVikingSyncPlugin from "./main";

export function registerCommands(plugin: OpenVikingSyncPlugin): void {
  const t = plugin.t.bind(plugin);
  plugin.addCommand({
    id: "sync-now",
    name: t("command.syncNow"),
    callback: async () => {
      await plugin.syncEngine.runFullSync(true);
    },
  });

  plugin.addCommand({
    id: "submit-correction",
    name: t("command.submitCorrection"),
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      const projection = file ? plugin.store.findProjectionByPath(file.path) : undefined;
      if (!projection || projection.entryType !== "memory_file") {
        return false;
      }
      if (!checking) {
        void plugin.correctionEngine
          .submitCorrection(projection)
          .then(() => new Notice(t("notice.correctionSubmitted")))
          .catch((error) => new Notice(String(error)));
      }
      return true;
    },
  });

  plugin.addCommand({
    id: "reset-local-draft",
    name: t("command.resetLocalDraft"),
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      const projection = file ? plugin.store.findProjectionByPath(file.path) : undefined;
      if (
        !projection ||
        projection.entryType !== "memory_file" ||
        !["local_draft", "submit_failed"].includes(projection.sync.status)
      ) {
        return false;
      }
      if (!checking) {
        void plugin.correctionEngine
          .resetDraft(projection)
          .then(() => new Notice(t("notice.draftReset")))
          .catch((error) => new Notice(String(error)));
      }
      return true;
    },
  });

  plugin.addCommand({
    id: "mark-delete",
    name: t("command.markDelete"),
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      const projection = file ? plugin.store.findProjectionByPath(file.path) : undefined;
      if (!projection || projection.entryType !== "memory_file") {
        return false;
      }
      if (!checking) {
        void plugin.correctionEngine
          .markDelete(projection)
          .then(() => new Notice(t("notice.markDelete")))
          .catch((error) => new Notice(String(error)));
      }
      return true;
    },
  });

  plugin.addCommand({
    id: "confirm-delete",
    name: t("command.confirmDelete"),
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      const projection = file ? plugin.store.findProjectionByPath(file.path) : undefined;
      if (!projection || projection.entryType !== "memory_file" || projection.sync.status !== "delete_pending") {
        return false;
      }
      if (!checking) {
        void plugin.correctionEngine
          .confirmDelete(projection)
          .then(() => new Notice(t("notice.confirmDelete")))
          .catch((error) => new Notice(String(error)));
      }
      return true;
    },
  });

  plugin.addCommand({
    id: "show-revision-history",
    name: t("command.showRevisionHistory"),
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      const projection = file ? plugin.store.findProjectionByPath(file.path) : undefined;
      if (!projection) {
        return false;
      }
      if (!checking) {
        plugin.openRevisionHistory(projection.ovUri);
      }
      return true;
    },
  });

  plugin.addCommand({
    id: "open-linked-correction",
    name: t("command.openLinkedCorrection"),
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      const projection = file ? plugin.store.findProjectionByPath(file.path) : undefined;
      const correctionUri = projection?.draft.lastCorrectionUri;
      if (!projection || !correctionUri) {
        return false;
      }
      if (!checking) {
        const target = plugin.store
          .listProjections()
          .find((item) => item.ovUri === correctionUri && item.entryType === "memory_file");
        if (target) {
          void plugin.projector.openFile(target.localPath);
        } else {
          new Notice(t("notice.correctionCopied", { uri: correctionUri }));
          void navigator.clipboard.writeText(correctionUri);
        }
      }
      return true;
    },
  });

  plugin.addCommand({
    id: "reveal-ov-uri",
    name: t("command.revealOvUri"),
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      const projection = file ? plugin.store.findProjectionByPath(file.path) : undefined;
      if (!projection) {
        return false;
      }
      if (!checking) {
        void navigator.clipboard.writeText(projection.ovUri);
        new Notice(t("notice.ovUriCopied", { uri: projection.ovUri }));
      }
      return true;
    },
  });
}

import { Notice, TFile } from "obsidian";
import type OpenVikingSyncPlugin from "./main";

export function registerCommands(plugin: OpenVikingSyncPlugin): void {
  plugin.addCommand({
    id: "sync-now",
    name: "OpenViking: Sync now",
    callback: async () => {
      await plugin.syncEngine.runFullSync(true);
    },
  });

  plugin.addCommand({
    id: "submit-correction",
    name: "OpenViking: Submit correction",
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      const projection = file ? plugin.store.findProjectionByPath(file.path) : undefined;
      if (!projection || projection.entryType !== "memory_file") {
        return false;
      }
      if (!checking) {
        void plugin.correctionEngine
          .submitCorrection(projection)
          .then(() => new Notice("Correction submitted to OpenViking."))
          .catch((error) => new Notice(String(error)));
      }
      return true;
    },
  });

  plugin.addCommand({
    id: "reset-local-draft",
    name: "OpenViking: Reset local draft",
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
          .then(() => new Notice("Local draft reset to OV content."))
          .catch((error) => new Notice(String(error)));
      }
      return true;
    },
  });

  plugin.addCommand({
    id: "mark-delete",
    name: "OpenViking: Mark delete",
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      const projection = file ? plugin.store.findProjectionByPath(file.path) : undefined;
      if (!projection || projection.entryType !== "memory_file") {
        return false;
      }
      if (!checking) {
        void plugin.correctionEngine
          .markDelete(projection)
          .then(() => new Notice("Memory marked for deletion. Run confirm delete to remove it from OV."))
          .catch((error) => new Notice(String(error)));
      }
      return true;
    },
  });

  plugin.addCommand({
    id: "confirm-delete",
    name: "OpenViking: Confirm delete",
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      const projection = file ? plugin.store.findProjectionByPath(file.path) : undefined;
      if (!projection || projection.entryType !== "memory_file" || projection.sync.status !== "delete_pending") {
        return false;
      }
      if (!checking) {
        void plugin.correctionEngine
          .confirmDelete(projection)
          .then(() => new Notice("Memory deleted from OV."))
          .catch((error) => new Notice(String(error)));
      }
      return true;
    },
  });

  plugin.addCommand({
    id: "show-revision-history",
    name: "OpenViking: Show revision history",
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
    name: "OpenViking: Open linked correction",
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
          new Notice(`Correction URI copied: ${correctionUri}`);
          void navigator.clipboard.writeText(correctionUri);
        }
      }
      return true;
    },
  });

  plugin.addCommand({
    id: "reveal-ov-uri",
    name: "OpenViking: Reveal in OpenViking path",
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      const projection = file ? plugin.store.findProjectionByPath(file.path) : undefined;
      if (!projection) {
        return false;
      }
      if (!checking) {
        void navigator.clipboard.writeText(projection.ovUri);
        new Notice(`OV URI copied: ${projection.ovUri}`);
      }
      return true;
    },
  });
}

import { SyncSummary } from "./types";

export function formatSyncSummary(summary: SyncSummary): string {
  const base = `OpenViking sync complete: ${summary.created} created, ${summary.updated} updated, ${summary.deleted} deleted, ${summary.failed} failed.`;
  if (summary.errors.length === 0) {
    return base;
  }
  const details = summary.errors.slice(0, 3).join(" | ");
  return `${base} Errors: ${details}`;
}

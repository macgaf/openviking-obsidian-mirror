import { describe, expect, it } from "vitest";
import { formatSyncSummary } from "../src/sync-summary";
import { SyncSummary } from "../src/types";

describe("formatSyncSummary", () => {
  it("formats a clean success summary", () => {
    const summary: SyncSummary = {
      roots: ["viking://user/default/memories"],
      created: 3,
      updated: 2,
      deleted: 1,
      failed: 0,
      errors: [],
    };

    expect(formatSyncSummary(summary)).toBe(
      "OpenViking sync complete: 3 created, 2 updated, 1 deleted, 0 failed.",
    );
  });

  it("includes root errors when present", () => {
    const summary: SyncSummary = {
      roots: ["viking://user/default/memories"],
      created: 0,
      updated: 0,
      deleted: 0,
      failed: 1,
      errors: ["Root viking://user/default/memories: Invalid API Key"],
    };

    expect(formatSyncSummary(summary)).toContain("Errors:");
    expect(formatSyncSummary(summary)).toContain("Invalid API Key");
  });
});

import { describe, expect, it } from "vitest";
import {
  extractEditableBody,
  extractGeneratedAbstractSection,
  renderLeafAbstractSection,
  renderManagedMarkdown,
  renderManagedMemoryMarkdown,
  stripManagedFrontmatter,
} from "../src/markdown";
import { ProjectionFrontmatter } from "../src/types";

describe("managed markdown helpers", () => {
  it("round-trips body content with frontmatter", () => {
    const frontmatter: ProjectionFrontmatter = {
      ov_uri: "viking://user/default/memories/preferences/mem_xxx.md",
      ov_root: "viking://user/default/memories",
      ov_scope: "user",
      ov_space: "default",
      ov_entry_type: "memory_file",
      ov_layer: "detail",
      ov_name: "mem_xxx.md",
      ov_projection_version: 1,
      ov_remote_exists: true,
      ov_status: "synced",
      ov_deleted: false,
      ov_readonly: false,
      ov_managed_by: "obsidian-openviking-plugin",
      ov_editable: true,
      ov_has_local_draft: false,
    };

    const rendered = renderManagedMarkdown(frontmatter, "hello world");
    const parsed = stripManagedFrontmatter(rendered);
    expect(parsed.body).toBe("hello world");
    expect(parsed.frontmatter.ov_uri).toBe(frontmatter.ov_uri);
  });

  it("keeps generated abstract section out of editable memory body", () => {
    const frontmatter: ProjectionFrontmatter = {
      ov_uri: "viking://user/default/memories/preferences/mem_xxx.md",
      ov_root: "viking://user/default/memories",
      ov_scope: "user",
      ov_space: "default",
      ov_entry_type: "memory_file",
      ov_layer: "detail",
      ov_name: "mem_xxx.md",
      ov_projection_version: 1,
      ov_remote_exists: true,
      ov_status: "synced",
      ov_deleted: false,
      ov_readonly: false,
      ov_managed_by: "obsidian-openviking-plugin",
      ov_editable: true,
      ov_has_local_draft: false,
    };

    const rendered = renderManagedMemoryMarkdown(frontmatter, "editable body", {
      abstract: "leaf abstract",
      abstractUpdatedAt: "2026-03-23T00:00:00Z",
      abstractSource: "search.find",
    });

    expect(extractEditableBody(rendered)).toBe("editable body");
    expect(rendered).toContain("## OpenViking Abstract");
    expect(rendered).toContain("leaf abstract");
  });

  it("can extract the generated abstract section verbatim", () => {
    const section = renderLeafAbstractSection("leaf abstract", "2026-03-23T00:00:00Z", "search.find");
    const doc = `${section}\n\neditable body`;
    expect(extractGeneratedAbstractSection(doc)).toBe(section);
  });
});

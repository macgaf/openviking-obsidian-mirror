import { describe, expect, it } from "vitest";
import {
  extractEditableBody,
  extractGeneratedAbstractSection,
  renderLeafAbstractSection,
  renderManagedBody,
  renderManagedMemoryBody,
} from "../src/markdown";

describe("managed markdown helpers", () => {
  it("normalizes managed body content", () => {
    expect(renderManagedBody("\n\nhello world")).toBe("hello world");
  });

  it("keeps generated abstract section out of editable memory body", () => {
    const body = renderManagedMemoryBody("editable body", {
      abstract: "leaf abstract",
      abstractUpdatedAt: "2026-03-23T00:00:00Z",
      abstractSource: "search.find",
    });

    expect(extractEditableBody(body)).toBe("editable body");
    expect(body).toContain("## OpenViking Abstract");
    expect(body).toContain("leaf abstract");
  });

  it("can extract the generated abstract section verbatim", () => {
    const section = renderLeafAbstractSection("leaf abstract", "2026-03-23T00:00:00Z", "search.find");
    const doc = `${section}\n\neditable body`;
    expect(extractGeneratedAbstractSection(doc)).toBe(section);
  });
});

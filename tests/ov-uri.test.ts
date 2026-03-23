import { describe, expect, it } from "vitest";
import { makeProjectionKey, parseOvUri } from "../src/ov-uri";

describe("parseOvUri", () => {
  it("parses scoped memory file URIs", () => {
    const parsed = parseOvUri("viking://user/default/memories/preferences/mem_123.md");
    expect(parsed.scope).toBe("user");
    expect(parsed.space).toBe("default");
    expect(parsed.basename).toBe("mem_123.md");
    expect(parsed.parentUri).toBe("viking://user/default/memories/preferences");
  });
});

describe("makeProjectionKey", () => {
  it("includes entry type to disambiguate directory summary projections", () => {
    const key = makeProjectionKey("viking://user/default/memories/preferences", "directory_abstract");
    expect(key).toBe("directory_abstract:viking://user/default/memories/preferences");
  });
});

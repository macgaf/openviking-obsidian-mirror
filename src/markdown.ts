import YAML from "yaml";
import { ProjectionFrontmatter } from "./types";

const FRONTMATTER_BOUNDARY = "---";

export function renderManagedMarkdown(frontmatter: ProjectionFrontmatter, body: string): string {
  const yaml = YAML.stringify(frontmatter).trimEnd();
  const normalizedBody = body.replace(/^\n+/, "");
  return `${FRONTMATTER_BOUNDARY}\n${yaml}\n${FRONTMATTER_BOUNDARY}\n\n${normalizedBody}`;
}

export function stripManagedFrontmatter(text: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  if (!text.startsWith(`${FRONTMATTER_BOUNDARY}\n`)) {
    return { frontmatter: {}, body: text };
  }

  const marker = `\n${FRONTMATTER_BOUNDARY}\n`;
  const end = text.indexOf(marker, FRONTMATTER_BOUNDARY.length + 1);
  if (end === -1) {
    return { frontmatter: {}, body: text };
  }

  const rawYaml = text.slice(FRONTMATTER_BOUNDARY.length + 1, end);
  const body = text.slice(end + marker.length).replace(/^\n/, "");
  const frontmatter = (YAML.parse(rawYaml) ?? {}) as Record<string, unknown>;

  return {
    frontmatter,
    body,
  };
}

export function summarizeBody(body: string, maxLength = 160): string {
  const normalized = body.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1)}…`;
}

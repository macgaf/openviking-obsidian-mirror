const GENERATED_ABSTRACT_START = "<!-- ov-generated-abstract:start -->";
const GENERATED_ABSTRACT_END = "<!-- ov-generated-abstract:end -->";

export function renderManagedBody(body: string): string {
  return body.replace(/^\n+/, "");
}

export function renderManagedMemoryBody(
  body: string,
  options: {
    abstract: string;
    abstractUpdatedAt?: string;
    abstractSource?: string;
    labels?: {
      title: string;
      note: string;
      updated: string;
      source: string;
      unavailable: string;
    };
  },
): string {
  const abstractBlock = renderLeafAbstractSection(
    options.abstract,
    options.abstractUpdatedAt,
    options.abstractSource,
    options.labels,
  );
  const normalizedBody = renderManagedBody(body);
  return normalizedBody ? `${abstractBlock}\n\n${normalizedBody}` : abstractBlock;
}

export function extractEditableBody(text: string): string {
  return stripGeneratedAbstractSection(text.replace(/^\n+/, ""));
}

export function stripGeneratedAbstractSection(body: string): string {
  const startIndex = body.indexOf(GENERATED_ABSTRACT_START);
  const endIndex = body.indexOf(GENERATED_ABSTRACT_END);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return body.replace(/^\n+/, "");
  }

  const stripped = body.slice(endIndex + GENERATED_ABSTRACT_END.length).replace(/^\s+/, "");
  return stripped;
}

export function extractGeneratedAbstractSection(body: string): string {
  const startIndex = body.indexOf(GENERATED_ABSTRACT_START);
  const endIndex = body.indexOf(GENERATED_ABSTRACT_END);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return "";
  }

  return body.slice(startIndex, endIndex + GENERATED_ABSTRACT_END.length);
}

export function summarizeBody(body: string, maxLength = 160): string {
  const normalized = body.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1)}…`;
}

export function renderLeafAbstractSection(
  abstract: string,
  abstractUpdatedAt?: string,
  abstractSource?: string,
  labels: {
    title: string;
    note: string;
    updated: string;
    source: string;
    unavailable: string;
  } = {
    title: "OpenViking Abstract",
    note: "This section is generated from OpenViking, is not editable, and will not be synced back.",
    updated: "Updated",
    source: "Source",
    unavailable: "Abstract unavailable.",
  },
): string {
  const lines = [
    GENERATED_ABSTRACT_START,
    `## ${labels.title}`,
    "",
    `_${labels.note}_`,
    "",
    `- ${labels.updated}: \`${abstractUpdatedAt ?? "unknown"}\``,
    `- ${labels.source}: \`${abstractSource ?? "unavailable"}\``,
    "",
    abstract.trim() || `_${labels.unavailable}_`,
    GENERATED_ABSTRACT_END,
  ];
  return lines.join("\n");
}

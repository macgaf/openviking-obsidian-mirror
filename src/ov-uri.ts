import { ManagedEntryType, OvScope, ProjectionKey } from "./types";

export type ParsedOvUri = {
  scope: OvScope;
  space: string;
  parts: string[];
  basename: string;
  parentUri?: string;
};

export function parseOvUri(uri: string): ParsedOvUri {
  const match = uri.match(/^viking:\/\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!match) {
    throw new Error(`Unsupported OV URI: ${uri}`);
  }

  const [, rawScope, space, rest] = match;
  const scope: OvScope =
    rawScope === "user" || rawScope === "agent" ? rawScope : "custom";
  const parts = rest.split("/").filter(Boolean);
  if (parts.length === 0) {
    throw new Error(`Invalid OV URI without path: ${uri}`);
  }
  const basename = parts[parts.length - 1];
  const parentUri =
    parts.length > 1 ? `viking://${rawScope}/${space}/${parts.slice(0, -1).join("/")}` : undefined;

  return {
    scope,
    space,
    parts,
    basename,
    parentUri,
  };
}

export function makeProjectionKey(ovUri: string, entryType: ManagedEntryType): ProjectionKey {
  return `${entryType}:${ovUri}`;
}

export function getDirectoryProjectionUris(dirUri: string): Record<ManagedEntryType, string> {
  return {
    directory_abstract: `${dirUri}/.abstract.md`,
    directory_overview: `${dirUri}/.overview.md`,
    memory_file: dirUri,
  };
}

export function getParentDirectoryUri(fileUri: string): string {
  const parsed = parseOvUri(fileUri);
  if (!parsed.parentUri) {
    throw new Error(`Cannot compute parent directory for URI: ${fileUri}`);
  }
  return parsed.parentUri;
}

export function getProjectionLayer(entryType: ManagedEntryType): "l0" | "l1" | "detail" {
  switch (entryType) {
    case "directory_abstract":
      return "l0";
    case "directory_overview":
      return "l1";
    case "memory_file":
      return "detail";
  }
}

export function toDeletedPath(basePath: string): string {
  const normalized = basePath.replace(/^\/+/, "");
  return normalized;
}

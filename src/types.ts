export type OvScope = "user" | "agent" | "custom";

export type ProjectionStatus =
  | "synced"
  | "stale_remote"
  | "local_draft"
  | "submit_pending"
  | "submit_failed"
  | "delete_pending"
  | "deleted_remote";

export type ManagedEntryType = "directory_abstract" | "directory_overview" | "memory_file";

export type ProjectionLayer = "l0" | "l1" | "detail";

export type ProjectionKey = string;

export type PluginSettings = {
  baseUrl: string;
  apiKey: string;
  uiLanguage:
    | "auto"
    | "en"
    | "zh-CN"
    | "zh-TW"
    | "ja"
    | "ko"
    | "es"
    | "fr"
    | "de"
    | "it"
    | "pt-BR"
    | "ru"
    | "ar"
    | "hi";
  autoDiscoverRoots: boolean;
  projectionRoots: string[];
  vaultFolder: string;
  pollIntervalSec: number;
};

export type DiscoveredRoot = {
  uri: string;
  scope: OvScope;
  space: string;
};

export type RemoteEntry = {
  uri: string;
  name: string;
  size: number;
  modTime: string;
  isDir: boolean;
};

export type FindResultItem = {
  context_type?: string;
  uri: string;
  level?: number;
  score?: number;
  abstract?: string | null;
  overview?: string | null;
};

export type FindResult = {
  memories?: FindResultItem[];
  resources?: FindResultItem[];
  skills?: FindResultItem[];
  total?: number;
};

export type ProjectionFrontmatter = {
  ov_uri: string;
  ov_root: string;
  ov_scope: OvScope;
  ov_space: string;
  ov_entry_type: ManagedEntryType;
  ov_layer: ProjectionLayer;
  ov_name: string;
  ov_projection_version: number;
  ov_remote_mod_time?: string;
  ov_remote_size?: number;
  ov_remote_exists: boolean;
  ov_synced_at?: string;
  ov_last_seen_at?: string;
  ov_status: ProjectionStatus;
  ov_deleted: boolean;
  ov_readonly: boolean;
  ov_managed_by: string;
  ov_target_uri?: string;
  ov_editable?: boolean;
  ov_generated_by?: string;
  ov_has_local_draft?: boolean;
  ov_local_draft_updated_at?: string;
  ov_last_submit_at?: string;
  ov_last_submit_result?: string;
  ov_last_correction_uri?: string;
  ov_correction_target_uri?: string;
  ov_leaf_abstract_updated_at?: string;
  ov_leaf_abstract_source?: string;
};

export type ProjectionState = {
  projectionKey: ProjectionKey;
  ovUri: string;
  ovRoot: string;
  scope: OvScope;
  space: string;
  entryType: ManagedEntryType;
  localPath: string;
  remote: {
    exists: boolean;
    isDir: boolean;
    modTime?: string;
    size?: number;
    abstract?: string;
    abstractUpdatedAt?: string;
    abstractSource?: string;
  };
  sync: {
    status: ProjectionStatus;
    lastSyncedAt?: string;
    lastSeenAt?: string;
  };
  draft: {
    hasLocalDraft: boolean;
    lastSyncedContent?: string;
    localDraftUpdatedAt?: string;
    lastSubmitAt?: string;
    lastSubmitResult?: string;
    lastCorrectionUri?: string;
  };
  runtime: {
    selfWriteToken?: string;
    lastRemoteHash?: string;
  };
};

export type RevisionEvent = {
  id: string;
  ovUri: string;
  timestamp: string;
  type:
    | "remote_created"
    | "remote_updated"
    | "remote_deleted"
    | "local_draft_created"
    | "local_draft_reset"
    | "submit_started"
    | "submit_succeeded"
    | "submit_failed"
    | "delete_marked"
    | "delete_confirmed";
  layer?: ProjectionLayer;
  summary: string;
  remoteModTime?: string;
  correctionUri?: string;
  diffSummary?: string;
  errorMessage?: string;
};

export type PersistedState = {
  version: number;
  settings?: Partial<PluginSettings>;
  projections: Record<ProjectionKey, ProjectionState>;
  revisions: Record<string, RevisionEvent[]>;
};

export type SyncSummary = {
  roots: string[];
  created: number;
  updated: number;
  deleted: number;
  failed: number;
  errors: string[];
};

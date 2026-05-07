import { AnalysisFileEventKind, Nullable } from "./analysis-core.type";

export interface AnalysisFileRow {
  id: number;
  full_path: string;
  filesystem_uuid: Nullable<string>;
  origin_process_version_id: Nullable<number>;
  last_status_at: Nullable<string>;
  tracking_started_at: string;
  initial_size_bytes: Nullable<number>;
  birth_time: Nullable<string>;
  raw_status: Nullable<number | string>;
  inode: Nullable<number>;
}

export interface AnalysisFileVersionRow {
  id: number;
  file_id: number;
  version_number: number;
  depth: number;
  created_at: string;
  origin_process_version_id: Nullable<number>;
  process_version_number: Nullable<number>;
  process_version_created_at: Nullable<string>;
  process_id: Nullable<number>;
  executable_path: Nullable<string>;
  pid: Nullable<number>;
  username: Nullable<string>;
  uid: Nullable<number>;
  origin_file_id: Nullable<number>;
  origin_file_path: Nullable<string>;
}

export interface AnalysisOperationRow {
  file_id: number;
  file_version_id: Nullable<number>;
  process_version_id: Nullable<number>;
  first_at: string;
  last_at: Nullable<string>;
  count: number;
  file_path: string;
  filesystem_uuid: Nullable<string>;
  process_version_number: Nullable<number>;
  process_version_created_at: Nullable<string>;
  process_id: Nullable<number>;
  executable_path: Nullable<string>;
  pid: Nullable<number>;
  username: Nullable<string>;
  uid: Nullable<number>;
  origin_file_id: Nullable<number>;
  origin_file_path: Nullable<string>;
  file_version_number: Nullable<number>;
  file_version_depth: Nullable<number>;
}

export interface AnalysisNormalizedFileEvent {
  id: number;
  fileId: number;
  kind: AnalysisFileEventKind;
  label: string;
  oldPath: Nullable<string>;
  newPath: Nullable<string>;
  outOfScope: boolean;
  details: Record<string, unknown>;
  createdAt: string;
  currentPath: string;
}

export interface AnalysisManualStatusEvent {
  id: number;
  fileId: number;
  statusHistoryId: Nullable<number>;
  action: string;
  previousStatus: number;
  newStatus: number;
  createdAt: string;
  details: Record<string, unknown>;
}

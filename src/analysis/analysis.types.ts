import { AnalysisFileItem } from "../files/types/file-item.type";
import { AnalysisSourceItem } from "../sources/types/source-item.type";

export type Nullable<T> = T | null;
export type TExportFormat = "csv" | "pdf";
export type TMonitoringStatus = 1 | 2 | 3 | 4;
export type SortableValue = string | number | boolean | null | undefined;
export type AnalysisTimelineType =
  | "TRACKING"
  | "SOURCE"
  | "DELETE"
  | "STATUS"
  | "MANUAL_STATUS_CHANGE"
  | "RENAME"
  | "MOVE"
  | "MOVE_RENAME"
  | "FILE_VERSION"
  | "READ"
  | "WRITE"
  | "PROCESS";
export type AnalysisOperationType = "READ" | "WRITE";
export type AnalysisFileEventKind = "RENAME" | "MOVE" | "MOVE_RENAME" | "DELETE";

export interface IExportTablePayload {
  title?: string;
  format?: TExportFormat;
  headers?: string[];
  rows?: Array<Array<string | number | boolean | null | undefined>>;
  rowKinds?: string[];
}

export interface IExportTableResult {
  filename: string;
  contentType: string;
  buffer: Buffer;
}

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

export interface AnalysisProcessVersionRow {
  id: number;
  process_id: Nullable<number>;
  version_number: Nullable<number>;
  created_at: Nullable<string>;
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

export interface AnalysisStatusRow {
  id: number;
  file_id: number;
  status: number;
  created_at: string;
}

export interface AnalysisManualStatusRow {
  id: number;
  file_id: number;
  status_history_id: Nullable<number>;
  action: string;
  previous_status: Nullable<number>;
  new_status: Nullable<number>;
  created_at: string;
  details: Nullable<string>;
}

export interface AnalysisFileEventRow {
  id: number;
  file_id: number;
  event: number | string;
  created_at: string;
  details: Nullable<string>;
}

export interface FileMonitoringLookupRow {
  id: number;
  full_path: string;
  last_status: number;
  last_status_at: Nullable<string>;
}

export interface AnalysisProcessContext {
  executable_path: Nullable<string>;
  pid?: Nullable<number>;
  process_version_number: Nullable<number>;
  username: Nullable<string>;
  uid: Nullable<number>;
  origin_process_version_id?: Nullable<number>;
}

export interface AnalysisFilePathRef {
  id: number;
  full_path: string;
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

export interface AnalysisReportSourceData {
  generatedAt: string;
  limit: number;
  page: number;
  offset: number;
  files: AnalysisFileRow[];
  fileVersions: AnalysisFileVersionRow[];
  processVersions: AnalysisProcessVersionRow[];
  reads: AnalysisOperationRow[];
  writes: AnalysisOperationRow[];
  statusRows: AnalysisStatusRow[];
  manualStatusRows: AnalysisManualStatusRow[];
  fileEventRows: AnalysisFileEventRow[];
}

export interface AnalysisFileLink {
  id: number;
  fileId: number;
  name: string;
  path: string;
}

// export interface AnalysisFileItem {
//   id: number;
//   fileId: number;
//   name: string;
//   path: string;
//   pathHistory: string[];
//   filesystem: Nullable<string>;
//   filesystemUuid: Nullable<string>;
//   sizeBytes: Nullable<number>;
//   versionCount: number;
//   depth: number;
//   parents: AnalysisFileLink[];
//   sourceIds: number[];
//   sourceLabels: AnalysisFileLink[];
//   originProcess: string;
//   user: string;
//   currentStatusCode: number;
//   currentStatus: string;
//   trackingStartedAt: string;
//   birthTime: Nullable<string>;
//   lastStatusAt: Nullable<string>;
//   inode: Nullable<number>;
// }

export interface AnalysisSourceReader {
  processVersionId: Nullable<number>;
  label: string;
  count: number;
  firstAt: string;
}

// export interface AnalysisSourceStats {
//   processes: number;
//   producedFiles: number;
//   maxDepth: number;
//   readOps: number;
// }

// export interface AnalysisSourceItem {
//   id: number;
//   fileId: number;
//   name: string;
//   path: string;
//   filesystemUuid: Nullable<string>;
//   trackingStartedAt: string;
//   sourceIds: number[];
//   stats: AnalysisSourceStats;
//   readers: AnalysisSourceReader[];
//   produced: AnalysisFileItem[];
// }



export interface AnalysisStatusHistoryItem {
  id: number;
  fileId: number;
  fileName: string;
  path: string;
  filesystemUuid: Nullable<string>;
  status: string;
  createdAt: string;
  isManual: boolean;
  changeSource: "MANUAL" | "SYSTEM";
  manualAction: Nullable<string>;
  previousStatus: Nullable<string>;
  nextStatus: string;
  sourceIds: number[];
}

export interface AnalysisRenameHistoryItem {
  id: number;
  fileId: number;
  fileName: string;
  eventType: Exclude<AnalysisFileEventKind, "DELETE">;
  eventLabel: string;
  oldPath: Nullable<string>;
  newPath: Nullable<string>;
  outOfScope: boolean;
  createdAt: string;
  sourceIds: number[];
  details: Record<string, unknown>;
}

export interface AnalysisProcessReadFile {
  fileId: number;
  fileName: string;
  path: string;
  filesystemUuid: Nullable<string>;
  versionNumber: Nullable<number>;
  count: number;
  firstAt: string;
  lastAt: Nullable<string>;
}

export interface AnalysisProcessReadGroup {
  processVersionId: Nullable<number>;
  label: string;
  executablePath: Nullable<string>;
  pid: Nullable<number>;
  user: Nullable<string>;
  uid: Nullable<number>;
  createdAt: string;
  sourceIds: number[];
  files: AnalysisProcessReadFile[];
}

export interface AnalysisTimelineItem {
  id: string;
  type: AnalysisTimelineType;
  timestamp: Nullable<string>;
  fileId: Nullable<number>;
  fileName: Nullable<string>;
  fileStatus: Nullable<string>;
  processVersionId: Nullable<number>;
  processLabel: Nullable<string>;
  details: string;
  sourceIds: number[];
}

export interface AnalysisTimelineEntry extends AnalysisTimelineItem {
  index: number;
}

export interface AnalysisOperationItem {
  id: string;
  type: AnalysisOperationType;
  timestamp: string;
  fileId: number;
  fileName: string;
  path: string;
  inode: Nullable<number>;
  fileVersionNumber: Nullable<number>;
  processName: string;
  processVersionId: Nullable<number>;
  processVersionNumber: Nullable<number>;
  processLabel: string;
  originFileName: string;
  originFilePath: Nullable<string>;
  fileStatus: Nullable<string>;
  depth: Nullable<number>;
  user: Nullable<string>;
  count: number;
  sizeBytes: Nullable<number>;
  trackingStartedAt: Nullable<string>;
  statusTime: Nullable<string>;
  sourceIds: number[];
}

export interface AnalysisChainProcessEvent {
  processVersionId: Nullable<number>;
  label: string;
  count: number;
  firstAt: string;
  lastAt: Nullable<string>;
}

export interface AnalysisChainVersion {
  id: number;
  versionNumber: number;
  depth: number;
  createdAt: string;
  processVersionId: Nullable<number>;
  createdBy: string;
  originFileId: Nullable<number>;
  originFileName: string;
}

export interface AnalysisChainEntry {
  fileId: number;
  name: string;
  path: string;
  sourceIds: number[];
  sourceLabels: AnalysisFileLink[];
  parents: AnalysisFileLink[];
  children: AnalysisFileLink[];
  readers: AnalysisChainProcessEvent[];
  writes: AnalysisChainProcessEvent[];
  versions: AnalysisChainVersion[];
}

export interface AnalysisDiagramFileVersion {
  id: number;
  fileVersionId: number;
  fileId: number;
  versionNumber: number;
  depth: number;
  createdAt: string;
  originProcessVersionId: Nullable<number>;
  processId: Nullable<number>;
  processVersionNumber: Nullable<number>;
  processVersionCreatedAt: Nullable<string>;
  executablePath: Nullable<string>;
  pid: Nullable<number>;
  username: Nullable<string>;
  uid: Nullable<number>;
  originFileId: Nullable<number>;
  originFilePath: Nullable<string>;
}

export interface AnalysisDiagramProcessVersion {
  id: number;
  processVersionId: number;
  processId: Nullable<number>;
  versionNumber: Nullable<number>;
  createdAt: Nullable<string>;
  executablePath: Nullable<string>;
  pid: Nullable<number>;
  username: Nullable<string>;
  uid: Nullable<number>;
  originFileId: Nullable<number>;
  originFilePath: Nullable<string>;
}

export interface AnalysisDiagramOperation {
  fileId: number;
  fileVersionId: Nullable<number>;
  processVersionId: Nullable<number>;
  processId: Nullable<number>;
  firstAt: string;
  lastAt: Nullable<string>;
  count: number;
}

export interface AnalysisDiagramData {
  fileVersions: AnalysisDiagramFileVersion[];
  processVersions: AnalysisDiagramProcessVersion[];
  reads: AnalysisDiagramOperation[];
  writes: AnalysisDiagramOperation[];
}

export interface AnalysisReportCapabilities {
  hasFileEvents: boolean;
  hasFileStatuses: boolean;
  hasDiagram: boolean;
}

export interface AnalysisReportOverview {
  files: number;
  fileVersions: number;
  sources: number;
  maxDepth: number;
  reads: number;
  writes: number;
}

export interface AnalysisReportResult {
  generatedAt: string;
  capabilities: AnalysisReportCapabilities;
  overview: AnalysisReportOverview;
  sources: AnalysisSourceItem[];
  timeline: AnalysisTimelineEntry[];
  files: AnalysisFileItem[];
  statusHistory: AnalysisStatusHistoryItem[];
  renameHistory: AnalysisRenameHistoryItem[];
  processReads: AnalysisProcessReadGroup[];
  operations: AnalysisOperationItem[];
  diagramData: AnalysisDiagramData;
  chains: Record<string, AnalysisChainEntry>;
  notices: string[];
}

export type AnalysisReportSectionKey = keyof Pick<
  AnalysisReportResult,
  | "capabilities"
  | "overview"
  | "sources"
  | "timeline"
  | "files"
  | "statusHistory"
  | "renameHistory"
  | "processReads"
  | "operations"
  | "diagramData"
  | "chains"
  | "notices"
>;

export type AnalysisReportSummary = Pick<
  AnalysisReportResult,
  "generatedAt" | "capabilities" | "overview" | "notices"
>;

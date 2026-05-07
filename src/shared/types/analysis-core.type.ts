export type Nullable<T> = T | null;

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

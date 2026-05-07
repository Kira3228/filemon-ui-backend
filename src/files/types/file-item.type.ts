import { Nullable } from "../../shared/types/nullable.type";
import { AnalysisFileLink } from "./file-link.type";

export interface AnalysisFileItem {
  id: number;
  fileId: number;
  name: string;
  path: string;
  pathHistory: string[];
  filesystem: Nullable<string>;
  filesystemUuid: Nullable<string>;
  sizeBytes: Nullable<number>;
  versionCount: number;
  depth: number;
  parents: AnalysisFileLink[];
  sourceIds: number[];
  sourceLabels: AnalysisFileLink[];
  originProcess: string;
  user: string;
  currentStatusCode: number;
  currentStatus: string;
  trackingStartedAt: string;
  birthTime: Nullable<string>;
  lastStatusAt: Nullable<string>;
  inode: Nullable<number>;
}

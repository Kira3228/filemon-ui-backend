import { AnalysisOperationType, Nullable } from "../../shared/types/analysis-core.type";

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

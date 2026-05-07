import { AnalysisFileItem } from "../../files/types/file-item.type";
import { Nullable } from "../../shared/types/nullable.type";

export interface AnalysisSourceItem {
  id: number;
  fileId: number;
  name: string;
  path: string;
  filesystemUuid: Nullable<string>;
  trackingStartedAt: string;
  sourceIds: number[];
  stats: AnalysisSourceStats;
  readers: AnalysisSourceReader[];
  produced: AnalysisFileItem[];
}

export interface AnalysisSourceStats {
  processes: number;
  producedFiles: number;
  maxDepth: number;
  readOps: number;
}

export interface AnalysisSourceReader {
  processVersionId: Nullable<number>;
  label: string;
  count: number;
  firstAt: string;
}

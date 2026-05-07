import { AnalysisFileEventKind, Nullable } from "../../shared/types/analysis-core.type";

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

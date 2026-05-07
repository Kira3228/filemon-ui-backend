import { AnalysisTimelineType, Nullable } from "../../shared/types/analysis-core.type";

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

import { AnalysisSourceItem } from "./source-item.type";

export interface SourceListResult {
  items: AnalysisSourceItem[];
  page: number;
  limit: number;
  total: number;
}

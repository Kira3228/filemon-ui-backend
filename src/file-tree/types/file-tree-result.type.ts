import { PaginatedResult } from "../../shared/types/pagination.type";
import { AnalysisFileItem } from "../../files/types/file-item.type";
import { AnalysisDiagramData } from "./diagram-data.type";

export interface FileTreeResult extends PaginatedResult<AnalysisFileItem> {
  diagramData: AnalysisDiagramData;
}

import { AnalysisFileItem } from "../../files/types/file-item.type";
import { AnalysisDiagramData } from "./diagram-data.type";

export interface FileTreeResult {
  files: AnalysisFileItem[];
  diagramData: AnalysisDiagramData;
}

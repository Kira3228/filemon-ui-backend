import { AnalysisFileLink, AnalysisFileRow } from "../../analysis/analysis.types";
import { splitLast } from "../utils/split-last";

export const toFileLink = (file?: AnalysisFileRow): AnalysisFileLink | null => {
  if (!file) {
    return null;
  }

  return {
    id: file.id,
    fileId: file.id,
    name: splitLast(file.full_path),
    path: file.full_path,
  };
};

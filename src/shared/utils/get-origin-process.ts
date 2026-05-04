import { AnalysisProcessContext, Nullable } from "../../analysis/analysis.types";
import { formatProcessDisplayName } from "./format-process-display-name";

export const getOriginProcess = (row?: Nullable<AnalysisProcessContext>) => {
  if (!row?.origin_process_version_id) return "SOURCE";
  return formatProcessDisplayName(row.executable_path, row.pid, "proc");
}
import { AnalysisProcessContext, Nullable } from "../../analysis/analysis.types";

export const getOriginUser = (row?: Nullable<AnalysisProcessContext>) => {
  if (!row?.origin_process_version_id) return "SOURCE";
  if (row.username) return row.username;
  if (row.uid !== null && row.uid !== undefined) return `uid:${row.uid}`;
  return "—";
}
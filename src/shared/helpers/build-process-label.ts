import { AnalysisProcessContext } from "../../analysis/analysis.types";
import { formatProcessDisplayName } from "./format-process-display-name";

export const buildProcessLabel = (row: AnalysisProcessContext) => {
  const executable = formatProcessDisplayName(row.executable_path, row.pid, "proc");
  const version = row.process_version_number ?? 1;
  if (row.username && row.uid !== null && row.uid !== undefined) {
    return `${executable} v${version} [${row.username}:${row.uid}]`;
  }
  if (row.username) return `${executable} v${version} [${row.username}]`;
  if (row.uid !== null && row.uid !== undefined) return `${executable} v${version} [uid:${row.uid}]`;
  return `${executable} v${version}`;
}
import { AnalysisFileItem, AnalysisOperationItem, AnalysisOperationRow } from "../analysis/analysis.types";
import { buildProcessLabel } from "../shared/helpers/build-process-label";
import { formatProcessDisplayName } from "../shared/helpers/format-process-display-name";
import { splitLast } from "../shared/utils/split-last";

export const buildOperationItem = (
  type: "READ" | "WRITE",
  row: AnalysisOperationRow,
  fileItemById: Map<number, AnalysisFileItem>,
  resolveRootSourceIds: (fileId: number) => number[]
): AnalysisOperationItem => {

  const fileItem = fileItemById.get(row.file_id)

  return {
    id: `${type.toLowerCase()}-${row.process_version_id}-${row.file_id}`,
    type: type,
    timestamp: row.first_at,
    fileId: row.file_id,
    fileName: splitLast(row.file_path),
    path: row.file_path,
    inode: fileItem?.inode ?? null,
    fileVersionNumber: row.file_version_number ?? null,
    processName: formatProcessDisplayName(row.executable_path, row.pid, "proc"),
    processVersionId: row.process_version_id,
    processVersionNumber: row.process_version_number ?? null,
    processLabel: buildProcessLabel(row),
    originFileName: splitLast(row.origin_file_path),
    originFilePath: row.origin_file_path || null,
    fileStatus: fileItem?.currentStatus || null,
    depth: row.file_version_depth ?? null,
    user: row.username || (row.uid !== null && row.uid !== undefined ? `uid:${row.uid}` : null),
    count: 1,
    sizeBytes: fileItem?.sizeBytes ?? null,
    trackingStartedAt: fileItem?.trackingStartedAt ?? null,
    statusTime: fileItem?.lastStatusAt ?? null,
    sourceIds: resolveRootSourceIds(row.file_id)
  }
}

import {
  AnalysisFileVersionRow,
  AnalysisOperationRow,
} from "../../shared/types/read-model-row.type";
import { AnalysisFileItem } from "../../files/types/file-item.type";
import { AnalysisFileRow } from "../../shared/types/read-model-row.type";
import { AnalysisSourceItem } from "../types/source-item.type";
import { buildProcessLabel } from "../../shared/utils/build-process-label";
import { splitLast } from "../../shared/utils/split-last";

export const buildSourceItem = (
  rootFile: AnalysisFileRow,
  readsByFile: Map<number, AnalysisOperationRow[]>,
  versionsByFile: Map<number, AnalysisFileVersionRow[]>,
  resolveDescendants: (fileId: number) => number[],
  fileItemsById: Map<number, AnalysisFileItem>,
): AnalysisSourceItem => {
  const readers = readsByFile.get(rootFile.id) || [];
  const processLabels = new Set<string>(readers.map((row) => buildProcessLabel(row)));
  const descendantIds = resolveDescendants(rootFile.id);
  const relatedFileIds = [rootFile.id, ...descendantIds];
  let maxDepth = 0;

  for (const fileId of relatedFileIds) {
    for (const version of versionsByFile.get(fileId) || []) {
      maxDepth = Math.max(maxDepth, Number(version.depth) || 0);
    }
  }

  return {
    id: rootFile.id,
    fileId: rootFile.id,
    name: splitLast(rootFile.full_path),
    path: rootFile.full_path,
    filesystemUuid: rootFile.filesystem_uuid,
    trackingStartedAt: String(rootFile.tracking_started_at || ""),
    sourceIds: [rootFile.id],
    stats: {
      processes: processLabels.size,
      producedFiles: descendantIds.length,
      maxDepth,
      readOps: readers.length,
    },
    readers: readers.slice(0, 8).map((row) => ({
      processVersionId: row.process_version_id,
      label: buildProcessLabel(row),
      count: Number(row.count) || 1,
      firstAt: row.first_at,
    })),
    produced: descendantIds
      .map((fileId) => fileItemsById.get(fileId))
      .filter((item): item is AnalysisFileItem => Boolean(item))
      .slice(0, 8),
  };
};

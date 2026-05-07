
import { AnalysisFileLink, AnalysisFileRow, AnalysisFileVersionRow, AnalysisNormalizedFileEvent } from "../../analysis/analysis.types";
import { AnalysisFileItem } from "../../files/types/file-item.type";
import { getOriginProcess } from "../utils/get-origin-process";
import { sortAsc } from "../utils/sort-asc";
import { splitLast } from "../utils/split-last";
import { buildPathHistory } from "./build-path-history";
import { formatStatus } from "./format-status";
import { getOriginUser } from "./get-origin-user";
import { toFileLink } from "./to-file-link";


export const buildFileItem = (
  file: AnalysisFileRow,
  filesById: Map<number, AnalysisFileRow>,
  versionsByFile: Map<number, AnalysisFileVersionRow[]>,
  parentsByFile: Map<number, Set<number>>,
  sourceIds: number[],
  renameRowsByFile: Map<number, AnalysisNormalizedFileEvent[]>,
): AnalysisFileItem => {
  const fileVersions = versionsByFile.get(file.id) || [];
  const primaryVersion = [...fileVersions].sort((a, b) =>
    sortAsc(a.created_at, b.created_at, a.version_number, b.version_number),
  )[0] || null;
  const parentIds = Array.from(parentsByFile.get(file.id) || []);

  return {
    id: file.id,
    fileId: file.id,
    name: splitLast(file.full_path),
    path: file.full_path,
    pathHistory: buildPathHistory(file.full_path, renameRowsByFile.get(file.id) || []),
    filesystem: file.filesystem_uuid,
    filesystemUuid: file.filesystem_uuid,
    sizeBytes: file.initial_size_bytes,
    versionCount: fileVersions.length,
    depth: fileVersions.reduce((max, row) => Math.max(max, Number(row.depth) || 0), 0),
    parents: parentIds
      .map((parentId) => toFileLink(filesById.get(parentId)))
      .filter((item): item is AnalysisFileLink => Boolean(item)),
    sourceIds,
    sourceLabels: sourceIds
      .map((sourceId) => toFileLink(filesById.get(sourceId)))
      .filter((item): item is AnalysisFileLink => Boolean(item)),
    originProcess: getOriginProcess(primaryVersion),
    user: getOriginUser(primaryVersion),
    currentStatusCode: Number(file.raw_status) || 1,
    currentStatus: formatStatus(file.raw_status),
    trackingStartedAt: file.tracking_started_at,
    birthTime: file.birth_time,
    lastStatusAt: file.last_status_at,
    inode: file.inode,
  };
};
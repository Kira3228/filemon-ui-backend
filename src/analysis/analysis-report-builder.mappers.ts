import { AnalysisFileItem } from "../files/types/file-item.type";
import { AnalysisNormalizerService } from "./analysis-normalizer.service";
import type {
  AnalysisChainProcessEvent,
  AnalysisChainVersion,
  AnalysisFileLink,
  AnalysisFilePathRef,
  AnalysisManualStatusEvent,
  AnalysisOperationItem,
  AnalysisOperationRow,
  AnalysisReportSourceData,
} from "./analysis.types";

export const parseManualStatusEvent = (
  row: AnalysisReportSourceData["manualStatusRows"][number],
): AnalysisManualStatusEvent => {
  let details: Record<string, unknown> = {};
  try {
    details = JSON.parse(row.details || "{}") as Record<string, unknown>;
  } catch {
    details = {};
  }

  return {
    id: row.id,
    fileId: row.file_id,
    statusHistoryId: row.status_history_id,
    action: row.action,
    previousStatus: Number(row.previous_status),
    newStatus: Number(row.new_status),
    createdAt: row.created_at,
    details,
  };
};

export const toOperationItem = (
  normalizer: AnalysisNormalizerService,
  type: "READ" | "WRITE",
  row: AnalysisOperationRow,
  fileItemsById: Map<number, AnalysisFileItem>,
  resolveRootSourceIds: (fileId: number) => number[],
): AnalysisOperationItem => {
  const fileItem = fileItemsById.get(row.file_id);

  return {
    id: `${type.toLowerCase()}-${row.process_version_id}-${row.file_id}`,
    type,
    timestamp: row.first_at,
    fileId: row.file_id,
    fileName: normalizer.getFileName(row.file_path),
    path: row.file_path,
    inode: fileItem?.inode ?? null,
    fileVersionNumber: row.file_version_number ?? null,
    processName: normalizer.formatProcessDisplayName(row.executable_path, row.pid, "proc"),
    processVersionId: row.process_version_id,
    processVersionNumber: row.process_version_number ?? null,
    processLabel: normalizer.buildProcessLabel(row),
    originFileName: normalizer.getFileName(row.origin_file_path),
    originFilePath: row.origin_file_path || null,
    fileStatus: fileItem?.currentStatus || null,
    depth: row.file_version_depth ?? null,
    user: row.username || (row.uid !== null && row.uid !== undefined ? `uid:${row.uid}` : null),
    count: 1,
    sizeBytes: fileItem?.sizeBytes ?? null,
    trackingStartedAt: fileItem?.trackingStartedAt ?? null,
    statusTime: fileItem?.lastStatusAt ?? null,
    sourceIds: resolveRootSourceIds(row.file_id),
  };
};

export const toChainProcessEvent = (
  normalizer: AnalysisNormalizerService,
  row: AnalysisOperationRow,
): AnalysisChainProcessEvent => ({
  processVersionId: row.process_version_id,
  label: normalizer.buildProcessLabel(row),
  count: 1,
  firstAt: row.first_at,
  lastAt: row.last_at,
});

export const toChainVersion = (
  normalizer: AnalysisNormalizerService,
  row: AnalysisReportSourceData["fileVersions"][number],
): AnalysisChainVersion => ({
  id: row.id,
  versionNumber: row.version_number,
  depth: row.depth,
  createdAt: row.created_at,
  processVersionId: row.origin_process_version_id,
  createdBy: row.origin_process_version_id ? normalizer.buildProcessLabel(row) : "SOURCE",
  originFileId: row.origin_file_id,
  originFileName: normalizer.getFileName(row.origin_file_path),
});

export const toFileLinks = (
  normalizer: AnalysisNormalizerService,
  ids: number[],
  filesById: Map<number, AnalysisFilePathRef>,
): AnalysisFileLink[] =>
  ids
    .map((id) => normalizer.fileLink(filesById.get(id)))
    .filter(isDefined);

export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

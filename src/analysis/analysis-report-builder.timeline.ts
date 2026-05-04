import { AnalysisNormalizerService } from "./analysis-normalizer.service";
import { toOperationItem } from "./analysis-report-builder.mappers";
import type {
  AnalysisDiagramProcessVersion,
  AnalysisFileItem,
  AnalysisFileRow,
  AnalysisFileVersionRow,
  AnalysisNormalizedFileEvent,
  AnalysisOperationItem,
  AnalysisOperationRow,
  AnalysisReportSourceData,
  AnalysisStatusHistoryItem,
  AnalysisTimelineEntry,
  AnalysisTimelineItem,
} from "./analysis.types";

interface BuildTimelineAndOperationsOptions {
  deletedStatus: number;
  fileItemsById: Map<number, AnalysisFileItem>;
  files: AnalysisReportSourceData["files"];
  filesById: Map<number, AnalysisFileRow>;
  fileVersions: AnalysisReportSourceData["fileVersions"];
  inputLimit: number;
  normalizer: AnalysisNormalizerService;
  normalizedRenameRows: AnalysisNormalizedFileEvent[];
  processVersionsIndex: Map<number, AnalysisDiagramProcessVersion>;
  reads: AnalysisReportSourceData["reads"];
  resolveRootSourceIds: (fileId: number) => number[];
  statusHistory: AnalysisStatusHistoryItem[];
  writes: AnalysisReportSourceData["writes"];
}

export const buildTimelineAndOperations = ({
  deletedStatus,
  fileItemsById,
  files,
  filesById,
  fileVersions,
  inputLimit,
  normalizer,
  normalizedRenameRows,
  reads,
  resolveRootSourceIds,
  statusHistory,
  writes,
}: BuildTimelineAndOperationsOptions): {
  operations: AnalysisOperationItem[];
  timelineEntries: AnalysisTimelineEntry[];
} => {
  const timeline: AnalysisTimelineItem[] = [];
  const processEvents = new Map<number, AnalysisTimelineItem>();
  const resolveTimelineStatus = (fileId: number | null | undefined, timestamp: string | null | undefined) =>
    normalizer.resolveTimelineFileStatus(timestamp || null, fileId ?? null, fileItemsById, statusHistory);

  const registerProcessEvent = (
    processVersionId: number | null | undefined,
    row: AnalysisFileVersionRow | AnalysisOperationRow,
    sourceIds: number[],
    ts: string | null | undefined,
  ) => {
    if (!processVersionId || processEvents.has(processVersionId)) return;
    processEvents.set(processVersionId, {
      id: `process-${processVersionId}`,
      type: "PROCESS",
      timestamp: ts || null,
      fileId: row.origin_file_id || null,
      fileName: row.origin_file_path ? normalizer.getFileName(row.origin_file_path) : null,
      fileStatus: resolveTimelineStatus(row.origin_file_id || null, ts || null),
      processVersionId,
      processLabel: normalizer.buildProcessLabel(row),
      details: normalizer.buildProcessLabel(row),
      sourceIds,
    });
  };

  for (const file of files) {
    const sourceIds = resolveRootSourceIds(file.id);
    timeline.push({
      id: `tracking-${file.id}`,
        type: "TRACKING",
        timestamp: file.tracking_started_at,
        fileId: file.id,
        fileName: normalizer.getFileName(file.full_path),
        fileStatus: resolveTimelineStatus(file.id, file.tracking_started_at),
        processVersionId: null,
        processLabel: null,
        details: `Начало мониторинга | FS ${file.filesystem_uuid || "-"}`,
      sourceIds,
    });
    if (sourceIds.length === 1 && sourceIds[0] === file.id) {
      timeline.push({
        id: `source-${file.id}`,
          type: "SOURCE",
          timestamp: file.tracking_started_at,
          fileId: file.id,
          fileName: normalizer.getFileName(file.full_path),
          fileStatus: resolveTimelineStatus(file.id, file.tracking_started_at),
          processVersionId: null,
          processLabel: null,
          details: `${normalizer.getFileName(file.full_path)} | исходный файл`,
        sourceIds,
      });
    }
    if (Number(file.raw_status) === deletedStatus && file.last_status_at) {
      timeline.push({
        id: `delete-${file.id}`,
          type: "DELETE",
          timestamp: file.last_status_at,
          fileId: file.id,
          fileName: normalizer.getFileName(file.full_path),
          fileStatus: resolveTimelineStatus(file.id, file.last_status_at),
          processVersionId: null,
          processLabel: null,
          details: "Файл удален",
        sourceIds,
      });
    }
  }

  for (const row of statusHistory) {
    timeline.push({
      id: `status-${row.id}`,
      type: row.isManual ? "MANUAL_STATUS_CHANGE" : "STATUS",
      timestamp: row.createdAt,
      fileId: row.fileId,
      fileName: row.fileName,
      fileStatus: row.nextStatus,
      processVersionId: null,
      processLabel: null,
      details: row.isManual
        ? `Ручная смена статуса: ${row.previousStatus} -> ${row.nextStatus} | ${row.path}`
        : `${row.status} | ${row.path}`,
      sourceIds: row.sourceIds,
    });
  }

  for (const row of normalizedRenameRows) {
    const file = filesById.get(row.fileId);
    timeline.push({
      id: `rename-${row.id}`,
      type: row.kind,
      timestamp: row.createdAt,
      fileId: row.fileId,
      fileName: normalizer.getFileName(file?.full_path || row.newPath || row.oldPath),
      fileStatus: resolveTimelineStatus(row.fileId, row.createdAt),
      processVersionId: null,
      processLabel: null,
      details: `${row.label} | ${normalizer.compactRenameText(row.oldPath, row.newPath, row.outOfScope)}`,
      sourceIds: file ? resolveRootSourceIds(file.id) : [],
    });
  }

  for (const row of fileVersions) {
    const file = filesById.get(row.file_id);
    const sourceIds = file ? resolveRootSourceIds(file.id) : [];
    timeline.push({
      id: `file-version-${row.id}`,
      type: "FILE_VERSION",
      timestamp: row.created_at,
      fileId: row.file_id,
      fileName: normalizer.getFileName(file?.full_path),
      fileStatus: resolveTimelineStatus(row.file_id, row.created_at),
      processVersionId: row.origin_process_version_id,
      processLabel: normalizer.buildProcessLabel(row),
      details: row.origin_process_version_id
        ? `${normalizer.getFileName(file?.full_path)} v${row.version_number} | создан ${normalizer.buildProcessLabel(row)}`
        : `${normalizer.getFileName(file?.full_path)} v${row.version_number} | исходная версия`,
      sourceIds,
    });
    registerProcessEvent(row.origin_process_version_id, row, sourceIds, row.process_version_created_at || row.created_at);
  }

  for (const row of reads) {
    const sourceIds = resolveRootSourceIds(row.file_id);
    timeline.push({
      id: `read-${row.process_version_id}-${row.file_id}`,
      type: "READ",
      timestamp: row.first_at,
      fileId: row.file_id,
      fileName: normalizer.getFileName(row.file_path),
      fileStatus: resolveTimelineStatus(row.file_id, row.first_at),
      processVersionId: row.process_version_id,
      processLabel: normalizer.buildProcessLabel(row),
      details: `${normalizer.buildProcessLabel(row)} -> READ`,
      sourceIds,
    });
    registerProcessEvent(row.process_version_id, row, sourceIds, row.process_version_created_at || row.first_at);
  }

  for (const row of writes) {
    const sourceIds = resolveRootSourceIds(row.file_id);
    timeline.push({
      id: `write-${row.process_version_id}-${row.file_id}`,
      type: "WRITE",
      timestamp: row.first_at,
      fileId: row.file_id,
      fileName: normalizer.getFileName(row.file_path),
      fileStatus: resolveTimelineStatus(row.file_id, row.first_at),
      processVersionId: row.process_version_id,
      processLabel: normalizer.buildProcessLabel(row),
      details: `${normalizer.buildProcessLabel(row)} -> WRITE`,
      sourceIds,
    });
    registerProcessEvent(row.process_version_id, row, sourceIds, row.process_version_created_at || row.first_at);
  }

  timeline.push(...Array.from(processEvents.values()));
  timeline.sort((a, b) => normalizer.sortDesc(a.timestamp, b.timestamp, a.id, b.id));

  const operations: AnalysisOperationItem[] = [
    ...reads.map((row) => toOperationItem(normalizer, "READ", row, fileItemsById, resolveRootSourceIds)),
    ...writes.map((row) => toOperationItem(normalizer, "WRITE", row, fileItemsById, resolveRootSourceIds)),
  ].sort((a, b) => normalizer.sortDesc(a.timestamp, b.timestamp, a.id, b.id)).slice(0, inputLimit);

  const timelineEntries: AnalysisTimelineEntry[] = timeline.map((item, index) => ({ ...item, index: index + 1 }));

  return {
    operations,
    timelineEntries,
  };
};

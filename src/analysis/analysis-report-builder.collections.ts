import { AnalysisNormalizerService } from "./analysis-normalizer.service";
import { isDefined } from "./analysis-report-builder.mappers";
import type {
  AnalysisFileItem,
  AnalysisFileRow,
  AnalysisFileVersionRow,
  AnalysisManualStatusEvent,
  AnalysisNormalizedFileEvent,
  AnalysisOperationRow,
  AnalysisProcessReadGroup,
  AnalysisRenameHistoryItem,
  AnalysisReportSourceData,
  AnalysisSourceItem,
  AnalysisStatusHistoryItem,
} from "./analysis.types";

interface BuildSourceRootsOptions {
  files: AnalysisReportSourceData["files"];
  fileItems: AnalysisFileItem[];
  fileItemsById: Map<number, AnalysisFileItem>;
  filesById: Map<number, AnalysisFileRow>;
  normalizer: AnalysisNormalizerService;
  versionsByFile: Map<number, AnalysisFileVersionRow[]>;
  readsByFile: Map<number, AnalysisOperationRow[]>;
  childrenByFile: Map<number, Set<number>>;
  resolveDescendants: (fileId: number) => number[];
}

interface BuildStatusHistoryOptions {
  statusRows: AnalysisReportSourceData["statusRows"];
  filesById: Map<number, AnalysisFileRow>;
  manualStatusByHistoryId: Map<number, AnalysisManualStatusEvent>;
  manualStatusByFileAndTime: Map<string, AnalysisManualStatusEvent>;
  normalizer: AnalysisNormalizerService;
  resolveRootSourceIds: (fileId: number) => number[];
}

export const buildSourceRoots = ({
  files,
  fileItems,
  fileItemsById,
  normalizer,
  versionsByFile,
  readsByFile,
  resolveDescendants,
}: BuildSourceRootsOptions): AnalysisSourceItem[] =>
  fileItems
    .filter((item) => item.sourceIds.length === 1 && item.sourceIds[0] === item.id)
    .map((item) => {
      const readers = readsByFile.get(item.id) || [];
      const descendantIds = resolveDescendants(item.id);
      const relatedFileIds = [item.id, ...descendantIds];
      const processLabels = new Set<string>();
      let maxDepth = 0;
      for (const fileId of relatedFileIds) {
        for (const version of versionsByFile.get(fileId) || []) {
          maxDepth = Math.max(maxDepth, Number(version.depth) || 0);
        }
      }
      for (const row of readers) {
        processLabels.add(normalizer.buildProcessLabel(row));
      }
      return {
        id: item.id,
        fileId: item.id,
        name: item.name,
        path: item.path,
        filesystemUuid: item.filesystemUuid,
        trackingStartedAt: item.trackingStartedAt,
        sourceIds: [item.id],
        stats: {
          processes: processLabels.size,
          producedFiles: descendantIds.length,
          maxDepth,
          readOps: readers.length,
        },
        readers: readers.slice(0, 8).map((row) => ({
          processVersionId: row.process_version_id,
          label: normalizer.buildProcessLabel(row),
          count: 1,
          firstAt: row.first_at,
        })),
        produced: descendantIds
          .map((fileId) => fileItemsById.get(fileId))
          .filter(isDefined)
          .slice(0, 8),
      };
    });

export const buildStatusHistory = ({
  statusRows,
  filesById,
  manualStatusByHistoryId,
  manualStatusByFileAndTime,
  normalizer,
  resolveRootSourceIds,
}: BuildStatusHistoryOptions): AnalysisStatusHistoryItem[] =>
  statusRows.map((row) => {
    const file = filesById.get(row.file_id);
    const manualEvent =
      manualStatusByHistoryId.get(row.id) ||
      manualStatusByFileAndTime.get(`${row.file_id}:${row.created_at}`) ||
      null;
    const nextStatus = manualEvent ? normalizer.formatStatus(manualEvent.newStatus) : normalizer.formatStatus(row.status);

    return {
      id: row.id,
      fileId: row.file_id,
      fileName: normalizer.getFileName(file?.full_path),
      path: file?.full_path || "",
      filesystemUuid: file?.filesystem_uuid || null,
      status: normalizer.formatStatus(row.status),
      createdAt: row.created_at,
      isManual: Boolean(manualEvent),
      changeSource: manualEvent ? "MANUAL" : "SYSTEM",
      manualAction: manualEvent?.action || null,
      previousStatus: manualEvent ? normalizer.formatStatus(manualEvent.previousStatus) : null,
      nextStatus,
      sourceIds: file ? resolveRootSourceIds(file.id) : [],
    };
  });

export const buildRenameHistory = (
  normalizedRenameRows: AnalysisNormalizedFileEvent[],
  filesById: Map<number, AnalysisFileRow>,
  normalizer: AnalysisNormalizerService,
  resolveRootSourceIds: (fileId: number) => number[],
): AnalysisRenameHistoryItem[] =>
  normalizedRenameRows
    .filter((row): row is AnalysisNormalizedFileEvent & { kind: Exclude<AnalysisNormalizedFileEvent["kind"], "DELETE"> } => row.kind !== "DELETE")
    .map((row) => {
      const file = filesById.get(row.fileId);
      return {
        id: row.id,
        fileId: row.fileId,
        fileName: normalizer.getFileName(file?.full_path),
        eventType: row.kind,
        eventLabel: row.label,
        oldPath: row.oldPath,
        newPath: row.newPath,
        outOfScope: row.outOfScope,
        createdAt: row.createdAt,
        sourceIds: file ? resolveRootSourceIds(file.id) : [],
        details: row.details,
      };
    });

export const buildProcessReads = (
  rows: AnalysisReportSourceData["reads"],
  normalizer: AnalysisNormalizerService,
  resolveProcessHistoryOriginFileIds: (context: {
    processVersionId?: number | null;
    processId?: number | null;
    processVersionNumber?: number | null;
    directOriginFileId?: number | null;
  }) => number[],
  resolveRootSourceIds: (fileId: number) => number[],
): AnalysisProcessReadGroup[] => {
  const processReadGroups = new Map<number, AnalysisProcessReadGroup>();

  for (const row of rows) {
    if (row.process_version_id === null) {
      continue;
    }

    const group = processReadGroups.get(row.process_version_id) || {
      processVersionId: row.process_version_id,
      label: normalizer.buildProcessLabel(row),
      executablePath: row.executable_path,
      pid: row.pid,
      user: row.username,
      uid: row.uid,
      createdAt: row.process_version_created_at || row.first_at,
      sourceIds: Array.from(
        new Set(
          resolveProcessHistoryOriginFileIds({
            processVersionId: row.process_version_id,
            processId: row.process_id,
            processVersionNumber: row.process_version_number,
            directOriginFileId: row.origin_file_id,
          }).reduce<number[]>((acc, originFileId) => {
            acc.push(...resolveRootSourceIds(originFileId));
            return acc;
          }, []),
        ),
      ).sort((a, b) => a - b),
      files: [],
    };
    group.files.push({
      fileId: row.file_id,
      fileName: normalizer.getFileName(row.file_path),
      path: row.file_path,
      filesystemUuid: row.filesystem_uuid,
      versionNumber: row.file_version_number,
      count: 1,
      firstAt: row.first_at,
      lastAt: row.last_at,
    });
    processReadGroups.set(row.process_version_id, group);
  }

  return Array.from(processReadGroups.values()).sort((a, b) =>
    normalizer.sortDesc(a.createdAt, b.createdAt, a.processVersionId, b.processVersionId),
  );
};

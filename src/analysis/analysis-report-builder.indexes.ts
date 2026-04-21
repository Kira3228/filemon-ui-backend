import { AnalysisNormalizerService } from "./analysis-normalizer.service";
import { parseManualStatusEvent } from "./analysis-report-builder.mappers";
import type {
  AnalysisDiagramProcessVersion,
  AnalysisFilePathRef,
  AnalysisFileRow,
  AnalysisFileVersionRow,
  AnalysisManualStatusEvent,
  AnalysisNormalizedFileEvent,
  AnalysisOperationRow,
  AnalysisProcessVersionRow,
  AnalysisReportSourceData,
  Nullable,
} from "./analysis.types";

interface ProcessVersionSeed {
  process_id?: Nullable<number>;
  processId?: Nullable<number>;
  version_number?: Nullable<number>;
  versionNumber?: Nullable<number>;
  created_at?: Nullable<string>;
  createdAt?: Nullable<string>;
  executable_path?: Nullable<string>;
  executablePath?: Nullable<string>;
  pid?: Nullable<number>;
  username?: Nullable<string>;
  uid?: Nullable<number>;
  origin_file_id?: Nullable<number>;
  originFileId?: Nullable<number>;
  origin_file_path?: Nullable<string>;
  originFilePath?: Nullable<string>;
}

export interface AnalysisReportIndexes {
  childrenByFile: Map<number, Set<number>>;
  filesById: Map<number, AnalysisFileRow>;
  manualStatusByFileAndTime: Map<string, AnalysisManualStatusEvent>;
  manualStatusByHistoryId: Map<number, AnalysisManualStatusEvent>;
  normalizedRenameRows: AnalysisNormalizedFileEvent[];
  parentsByFile: Map<number, Set<number>>;
  processVersionsIndex: Map<number, AnalysisDiagramProcessVersion>;
  readsByFile: Map<number, AnalysisOperationRow[]>;
  renameRowsByFile: Map<number, AnalysisNormalizedFileEvent[]>;
  resolveProcessHistoryOriginFileIds: (context: {
    processVersionId?: Nullable<number>;
    processId?: Nullable<number>;
    processVersionNumber?: Nullable<number>;
    directOriginFileId?: Nullable<number>;
  }) => number[];
  versionsByFile: Map<number, AnalysisFileVersionRow[]>;
  writesByFile: Map<number, AnalysisOperationRow[]>;
}

export const buildAnalysisReportIndexes = (
  input: AnalysisReportSourceData,
  normalizer: AnalysisNormalizerService,
): AnalysisReportIndexes => {
  const filesById = new Map<number, AnalysisFileRow>();
  const versionsByFile = new Map<number, AnalysisFileVersionRow[]>();
  const readsByFile = new Map<number, AnalysisOperationRow[]>();
  const writesByFile = new Map<number, AnalysisOperationRow[]>();
  const parentsByFile = new Map<number, Set<number>>();
  const childrenByFile = new Map<number, Set<number>>();
  const renameRowsByFile = new Map<number, AnalysisNormalizedFileEvent[]>();
  const processVersionsIndex = new Map<number, AnalysisDiagramProcessVersion>();
  const processVersionsByProcess = new Map<number, AnalysisProcessVersionRow[]>();
  const manualStatusByHistoryId = new Map<number, AnalysisManualStatusEvent>();
  const manualStatusByFileAndTime = new Map<string, AnalysisManualStatusEvent>();

  const registerProcessVersion = (
    processVersionId: Nullable<number>,
    row: ProcessVersionSeed,
  ) => {
    if (!processVersionId) {
      return;
    }

    const existing = processVersionsIndex.get(processVersionId);
    processVersionsIndex.set(processVersionId, {
      id: processVersionId,
      processVersionId,
      processId: row.process_id ?? row.processId ?? existing?.processId ?? null,
      versionNumber: row.version_number ?? row.versionNumber ?? existing?.versionNumber ?? null,
      createdAt: row.created_at ?? row.createdAt ?? existing?.createdAt ?? null,
      executablePath: row.executable_path ?? row.executablePath ?? existing?.executablePath ?? null,
      pid: row.pid ?? existing?.pid ?? null,
      username: row.username ?? existing?.username ?? null,
      uid: row.uid ?? existing?.uid ?? null,
      originFileId: row.origin_file_id ?? row.originFileId ?? existing?.originFileId ?? null,
      originFilePath: row.origin_file_path ?? row.originFilePath ?? existing?.originFilePath ?? null,
    });
  };

  for (const file of input.files) {
    filesById.set(file.id, file);
    versionsByFile.set(file.id, []);
    readsByFile.set(file.id, []);
    writesByFile.set(file.id, []);
    parentsByFile.set(file.id, new Set());
    childrenByFile.set(file.id, new Set());
    renameRowsByFile.set(file.id, []);
  }

  for (const processVersion of input.processVersions) {
    registerProcessVersion(processVersion.id, processVersion);
    if (processVersion.process_id !== null && processVersion.process_id !== undefined) {
      const items = processVersionsByProcess.get(processVersion.process_id) || [];
      items.push(processVersion);
      processVersionsByProcess.set(processVersion.process_id, items);
    }
  }

  for (const processVersions of processVersionsByProcess.values()) {
    processVersions.sort((a, b) =>
      normalizer.sortAsc(a.created_at, b.created_at, a.version_number, b.version_number),
    );
  }

  const processHistorySourceMemo = new Map<string, number[]>();
  const resolveProcessHistoryOriginFileIds = (context: {
    processVersionId?: Nullable<number>;
    processId?: Nullable<number>;
    processVersionNumber?: Nullable<number>;
    directOriginFileId?: Nullable<number>;
  }): number[] => {
    const {
      processVersionId = null,
      processId = null,
      processVersionNumber = null,
      directOriginFileId = null,
    } = context;
    const memoKey = [
      processVersionId ?? "null",
      processId ?? "null",
      processVersionNumber ?? "null",
      directOriginFileId ?? "null",
    ].join(":");
    if (processHistorySourceMemo.has(memoKey)) {
      return processHistorySourceMemo.get(memoKey)!;
    }

    const indexedProcessVersion = processVersionId
      ? processVersionsIndex.get(processVersionId)
      : null;
    const resolvedProcessId =
      processId ?? indexedProcessVersion?.processId ?? null;
    const resolvedVersionNumber =
      processVersionNumber ?? indexedProcessVersion?.versionNumber ?? null;
    const fallbackOriginFileId =
      directOriginFileId ?? indexedProcessVersion?.originFileId ?? null;

    const result = new Set<number>();
    if (resolvedProcessId !== null && resolvedProcessId !== undefined) {
      const processVersions = processVersionsByProcess.get(resolvedProcessId) || [];
      for (const processVersion of processVersions) {
        const candidateVersionNumber = Number(processVersion.version_number);
        if (!Number.isFinite(candidateVersionNumber)) {
          continue;
        }
        if (
          resolvedVersionNumber !== null
          && resolvedVersionNumber !== undefined
          && candidateVersionNumber > Number(resolvedVersionNumber)
        ) {
          continue;
        }
        if (processVersion.origin_file_id) {
          result.add(processVersion.origin_file_id);
        }
      }
    }

    if (!result.size && fallbackOriginFileId) {
      result.add(fallbackOriginFileId);
    }

    const value = Array.from(result).sort((a, b) => a - b);
    processHistorySourceMemo.set(memoKey, value);
    return value;
  };

  for (const version of input.fileVersions) {
    versionsByFile.get(version.file_id)?.push(version);
    registerProcessVersion(version.origin_process_version_id, {
      process_id: version.process_id,
      version_number: version.process_version_number,
      created_at: version.process_version_created_at,
      executable_path: version.executable_path,
      pid: version.pid,
      username: version.username,
      uid: version.uid,
      origin_file_id: version.origin_file_id,
      origin_file_path: version.origin_file_path,
    });

    const parentOriginFileIds = resolveProcessHistoryOriginFileIds({
      processVersionId: version.origin_process_version_id,
      processId: version.process_id,
      processVersionNumber: version.process_version_number,
      directOriginFileId: version.origin_file_id,
    });
    for (const originFileId of parentOriginFileIds) {
      if (originFileId === version.file_id) {
        continue;
      }
      parentsByFile.get(version.file_id)?.add(originFileId);
      if (!childrenByFile.has(originFileId)) {
        childrenByFile.set(originFileId, new Set());
      }
      childrenByFile.get(originFileId)?.add(version.file_id);
    }
  }

  for (const row of input.reads) {
    readsByFile.get(row.file_id)?.push(row);
    registerProcessVersion(row.process_version_id, {
      process_id: row.process_id,
      version_number: row.process_version_number,
      created_at: row.process_version_created_at,
      executable_path: row.executable_path,
      pid: row.pid,
      username: row.username,
      uid: row.uid,
      origin_file_id: row.origin_file_id,
      origin_file_path: row.origin_file_path,
    });
  }

  for (const row of input.writes) {
    writesByFile.get(row.file_id)?.push(row);
    registerProcessVersion(row.process_version_id, {
      process_id: row.process_id,
      version_number: row.process_version_number,
      created_at: row.process_version_created_at,
      executable_path: row.executable_path,
      pid: row.pid,
      username: row.username,
      uid: row.uid,
      origin_file_id: row.origin_file_id,
      origin_file_path: row.origin_file_path,
    });
  }

  const normalizedRenameRows: AnalysisNormalizedFileEvent[] = [];
  for (const row of input.fileEventRows) {
    const normalized = normalizer.normalizeFileEvent(row, filesById as Map<number, AnalysisFilePathRef>);
    if (normalized) {
      normalizedRenameRows.push(normalized);
    }
  }

  for (const row of normalizedRenameRows) {
    renameRowsByFile.get(row.fileId)?.push(row);
  }

  for (const row of input.manualStatusRows) {
    const normalized = parseManualStatusEvent(row);
    if (normalized.statusHistoryId) {
      manualStatusByHistoryId.set(normalized.statusHistoryId, normalized);
    }
    manualStatusByFileAndTime.set(`${normalized.fileId}:${normalized.createdAt}`, normalized);
  }

  return {
    childrenByFile,
    filesById,
    manualStatusByFileAndTime,
    manualStatusByHistoryId,
    normalizedRenameRows,
    parentsByFile,
    processVersionsIndex,
    readsByFile,
    renameRowsByFile,
    resolveProcessHistoryOriginFileIds,
    versionsByFile,
    writesByFile,
  };
};

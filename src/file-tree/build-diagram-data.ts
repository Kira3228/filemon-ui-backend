import {
  AnalysisDiagramData,
  AnalysisDiagramFileVersion,
  AnalysisDiagramOperation,
  AnalysisDiagramProcessVersion,
} from "./types/diagram-data.type";
import { AnalysisFileVersionRow } from "../shared/types/read-model-row.type";
import { sortAsc } from "../shared/utils/sort-asc";
import { DiagramDataObject } from "./file-tree.service";

export const buildDiagramData = (diagramData: DiagramDataObject): AnalysisDiagramData => {
  const processVersionsIndex = new Map<number, AnalysisDiagramProcessVersion>();

  const registerProcessVersion = (
    processVersionId: number | null | undefined,
    row: Pick<
      AnalysisFileVersionRow,
      | "process_id"
      | "process_version_number"
      | "process_version_created_at"
      | "executable_path"
      | "pid"
      | "username"
      | "uid"
      | "origin_file_id"
      | "origin_file_path"
    >,
  ) => {
    if (!processVersionId) {
      return;
    }

    const existing = processVersionsIndex.get(processVersionId);
    processVersionsIndex.set(processVersionId, {
      id: processVersionId,
      processVersionId,
      processId: row.process_id ?? existing?.processId ?? null,
      versionNumber: row.process_version_number ?? existing?.versionNumber ?? null,
      createdAt: row.process_version_created_at ?? existing?.createdAt ?? null,
      executablePath: row.executable_path ?? existing?.executablePath ?? null,
      pid: row.pid ?? existing?.pid ?? null,
      username: row.username ?? existing?.username ?? null,
      uid: row.uid ?? existing?.uid ?? null,
      originFileId: row.origin_file_id ?? existing?.originFileId ?? null,
      originFilePath: row.origin_file_path ?? existing?.originFilePath ?? null,
    });
  };

  for (const row of diagramData.fileVersions) {
    registerProcessVersion(row.origin_process_version_id, row);
  }

  for (const row of diagramData.reads) {
    registerProcessVersion(row.process_version_id, row);
  }

  for (const row of diagramData.writes) {
    registerProcessVersion(row.process_version_id, row);
  }

  return {
    fileVersions: diagramData.fileVersions.map((row): AnalysisDiagramFileVersion => ({
      id: row.id,
      fileVersionId: row.id,
      fileId: row.file_id,
      versionNumber: row.version_number,
      depth: row.depth,
      createdAt: row.created_at,
      originProcessVersionId: row.origin_process_version_id,
      processId: row.process_id,
      processVersionNumber: row.process_version_number,
      processVersionCreatedAt: row.process_version_created_at,
      executablePath: row.executable_path,
      pid: row.pid,
      username: row.username,
      uid: row.uid,
      originFileId: row.origin_file_id,
      originFilePath: row.origin_file_path,
    })),
    processVersions: Array.from(processVersionsIndex.values()).sort((a, b) =>
      sortAsc(a.createdAt, b.createdAt, a.processVersionId, b.processVersionId),
    ),
    reads: diagramData.reads.map((row): AnalysisDiagramOperation => ({
      fileId: row.file_id,
      fileVersionId: row.file_version_id,
      processVersionId: row.process_version_id,
      processId: row.process_id,
      firstAt: row.first_at,
      lastAt: row.last_at,
      count: Number(row.count) || 1,
    })),
    writes: diagramData.writes.map((row): AnalysisDiagramOperation => ({
      fileId: row.file_id,
      fileVersionId: row.file_version_id,
      processVersionId: row.process_version_id,
      processId: row.process_id,
      firstAt: row.first_at,
      lastAt: row.last_at,
      count: Number(row.count) || 1,
    })),
  };
};

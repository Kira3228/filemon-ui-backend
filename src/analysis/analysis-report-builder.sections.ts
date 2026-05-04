import { AnalysisNormalizerService } from "./analysis-normalizer.service";
import { toChainProcessEvent, toChainVersion, toFileLinks } from "./analysis-report-builder.mappers";
import type {
  AnalysisChainEntry,
  AnalysisDiagramData,
  AnalysisDiagramFileVersion,
  AnalysisDiagramOperation,
  AnalysisDiagramProcessVersion,
  AnalysisFilePathRef,
  AnalysisFileRow,
  AnalysisFileVersionRow,
  AnalysisOperationRow,
  AnalysisReportOverview,
  AnalysisReportSourceData,
} from "./analysis.types";

interface BuildChainsOptions {
  files: AnalysisReportSourceData["files"];
  filesById: Map<number, AnalysisFileRow>;
  normalizer: AnalysisNormalizerService;
  parentsByFile: Map<number, Set<number>>;
  childrenByFile: Map<number, Set<number>>;
  readsByFile: Map<number, AnalysisOperationRow[]>;
  writesByFile: Map<number, AnalysisOperationRow[]>;
  versionsByFile: Map<number, AnalysisFileVersionRow[]>;
  resolveRootSourceIds: (fileId: number) => number[];
}

export const buildOverview = (
  input: AnalysisReportSourceData,
  sourceCount: number,
): AnalysisReportOverview => ({
  files: input.files.length,
  fileVersions: input.fileVersions.length,
  sources: sourceCount,
  maxDepth: input.fileVersions.reduce((max, row) => Math.max(max, Number(row.depth) || 0), 0),
  reads: input.reads.length,
  writes: input.writes.length,
});

export const buildChains = ({
  files,
  filesById,
  normalizer,
  parentsByFile,
  childrenByFile,
  readsByFile,
  writesByFile,
  versionsByFile,
  resolveRootSourceIds,
}: BuildChainsOptions): Record<string, AnalysisChainEntry> => {
  const chains: Record<string, AnalysisChainEntry> = {};

  for (const file of files) {
    const sourceIds = resolveRootSourceIds(file.id);
    const readers = readsByFile.get(file.id) || [];
    const writes = writesByFile.get(file.id) || [];
    const versions = versionsByFile.get(file.id) || [];

    chains[String(file.id)] = {
      fileId: file.id,
      name: normalizer.getFileName(file.full_path),
      path: file.full_path,
      sourceIds,
      sourceLabels: toFileLinks(normalizer, sourceIds, filesById as Map<number, AnalysisFilePathRef>),
      parents: toFileLinks(normalizer, Array.from(parentsByFile.get(file.id) || []), filesById as Map<number, AnalysisFilePathRef>),
      children: toFileLinks(normalizer, Array.from(childrenByFile.get(file.id) || []), filesById as Map<number, AnalysisFilePathRef>),
      readers: readers.map((row) => toChainProcessEvent(normalizer, row)),
      writes: writes.map((row) => toChainProcessEvent(normalizer, row)),
      versions: versions.map((row) => toChainVersion(normalizer, row)),
    };
  }

  return chains;
};

export const buildDiagramData = (
  input: AnalysisReportSourceData,
  processVersionsIndex: Map<number, AnalysisDiagramProcessVersion>,
  normalizer: AnalysisNormalizerService,
): AnalysisDiagramData => ({
  fileVersions: input.fileVersions.map((row): AnalysisDiagramFileVersion => ({
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
    normalizer.sortAsc(a.createdAt, b.createdAt, a.processVersionId, b.processVersionId),
  ),
  reads: input.reads.map((row): AnalysisDiagramOperation => ({
    fileId: row.file_id,
    fileVersionId: row.file_version_id,
    processVersionId: row.process_version_id,
    processId: row.process_id,
    firstAt: row.first_at,
    lastAt: row.last_at,
    count: Number(row.count) || 1,
  })),
  writes: input.writes.map((row): AnalysisDiagramOperation => ({
    fileId: row.file_id,
    fileVersionId: row.file_version_id,
    processVersionId: row.process_version_id,
    processId: row.process_id,
    firstAt: row.first_at,
    lastAt: row.last_at,
    count: Number(row.count) || 1,
  })),
});

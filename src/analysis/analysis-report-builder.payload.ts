import { AnalysisNormalizerService } from "./analysis-normalizer.service";
import { buildProcessReads, buildRenameHistory, buildStatusHistory } from "./analysis-report-builder.collections";
import { buildFileItems, createDescendantsResolver, createRootSourceResolver } from "./analysis-report-builder.graph";
import { buildAnalysisReportResult } from "./analysis-report-builder.result";
import { buildChains, buildDiagramData, buildOverview } from "./analysis-report-builder.sections";
import { buildTimelineAndOperations } from "./analysis-report-builder.timeline";
import { AnalysisSourcesService } from "./analysis-sources.service";
import type { AnalysisReportIndexes } from "./analysis-report-builder.indexes";
import type {
  AnalysisFileItem,
  AnalysisReportResult,
  AnalysisReportSourceData,
} from "./analysis.types";

interface BuildAnalysisReportPayloadOptions {
  deletedStatus: number;
  indexes: AnalysisReportIndexes;
  input: AnalysisReportSourceData;
  normalizer: AnalysisNormalizerService;
  sourcesService: AnalysisSourcesService;
  trackingStatus: number;
}

export const buildAnalysisReportPayload = ({
  deletedStatus,
  indexes,
  input,
  normalizer,
  sourcesService,
  trackingStatus,
}: BuildAnalysisReportPayloadOptions): AnalysisReportResult => {
  const {
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
  } = indexes;

  const resolveRootSourceIds = createRootSourceResolver(parentsByFile);
  const resolveDescendants = createDescendantsResolver(childrenByFile);

  const fileItems = buildFileItems({
    files: input.files,
    filesById,
    normalizer,
    parentsByFile,
    childrenByFile,
    renameRowsByFile,
    resolveRootSourceIds,
    trackingStatus,
    versionsByFile,
  });
  const fileItemsById = new Map<number, AnalysisFileItem>(fileItems.map((item) => [item.fileId, item] as const));

  const sourceRoots = sourcesService.buildSourceRoots({
    fileItems,
    fileItemsById,
    limit: input.limit,
    normalizer,
    offset: input.offset,
    versionsByFile,
    readsByFile,
    resolveDescendants,
  });

  const statusHistory = buildStatusHistory({
    statusRows: input.statusRows,
    filesById,
    manualStatusByHistoryId,
    manualStatusByFileAndTime,
    normalizer,
    resolveRootSourceIds,
  });

  const renameHistory = buildRenameHistory(
    normalizedRenameRows,
    filesById,
    normalizer,
    resolveRootSourceIds,
  );

  const processReads = buildProcessReads(
    input.reads,
    normalizer,
    resolveProcessHistoryOriginFileIds,
    resolveRootSourceIds,
  );

  const {
    operations,
    timelineEntries,
  } = buildTimelineAndOperations({
    deletedStatus,
    fileItemsById,
    files: input.files,
    filesById,
    fileVersions: input.fileVersions,
    inputLimit: input.limit,
    normalizer,
    normalizedRenameRows,
    processVersionsIndex,
    reads: input.reads,
    resolveRootSourceIds,
    statusHistory,
    writes: input.writes,
  });

  const chains = buildChains({
    files: input.files,
    filesById,
    normalizer,
    parentsByFile,
    childrenByFile,
    readsByFile,
    writesByFile,
    versionsByFile,
    resolveRootSourceIds,
  });

  const diagramData = buildDiagramData(input, processVersionsIndex, normalizer);

  return buildAnalysisReportResult({
    generatedAt: input.generatedAt,
    overview: buildOverview(input, sourceRoots.length),
    sources: sourceRoots,
    timeline: timelineEntries,
    files: fileItems,
    statusHistory,
    renameHistory,
    processReads,
    operations,
    diagramData,
    chains,
  });
};

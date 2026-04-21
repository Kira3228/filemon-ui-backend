import { injectable } from "tsyringe";
import { AnalysisNormalizerService } from "./analysis-normalizer.service";
import { buildProcessReads, buildRenameHistory, buildStatusHistory } from "./analysis-report-builder.collections";
import { buildFileItems, createDescendantsResolver, createRootSourceResolver } from "./analysis-report-builder.graph";
import { buildAnalysisReportIndexes } from "./analysis-report-builder.indexes";
import { buildAnalysisReportPayload } from "./analysis-report-builder.payload";
import { buildChains, buildDiagramData, buildOverview } from "./analysis-report-builder.sections";
import { buildTimelineAndOperations } from "./analysis-report-builder.timeline";
import { AnalysisSourcesService } from "./analysis-sources.service";
import {
  AnalysisFileItem,
  AnalysisReportResult,
  AnalysisReportSectionKey,
  AnalysisReportSourceData,
  AnalysisReportSummary,
  TMonitoringStatus,
} from "./analysis.types";

@injectable()
export class AnalysisReportBuilderService {
  private readonly trackingStatus: TMonitoringStatus = 1;
  private readonly deletedStatus: TMonitoringStatus = 2;

  constructor(
    private readonly normalizer: AnalysisNormalizerService,
    private readonly sourcesService: AnalysisSourcesService = new AnalysisSourcesService(),
  ) { }

  buildReport(input: AnalysisReportSourceData): AnalysisReportResult {
    const indexes = buildAnalysisReportIndexes(input, this.normalizer);

    return buildAnalysisReportPayload({
      deletedStatus: this.deletedStatus,
      indexes,
      input,
      normalizer: this.normalizer,
      sourcesService: this.sourcesService,
      trackingStatus: this.trackingStatus,
    });
  }

  buildReportSummary(input: AnalysisReportSourceData): AnalysisReportSummary {
    const context = this.createBuildContext(input);

    return {
      generatedAt: input.generatedAt,
      capabilities: context.getCapabilities(),
      overview: context.getOverview(),
      notices: context.getNotices(),
    };
  }

  buildReportSection<K extends AnalysisReportSectionKey>(
    input: AnalysisReportSourceData,
    section: K,
  ): AnalysisReportResult[K] {
    const context = this.createBuildContext(input);

    switch (section) {
      case "capabilities":
        return context.getCapabilities() as AnalysisReportResult[K];
      case "overview":
        return context.getOverview() as AnalysisReportResult[K];
      case "sources":
        return context.getSources() as AnalysisReportResult[K];
      case "timeline":
        return context.getTimelineAndOperations().timelineEntries as AnalysisReportResult[K];
      case "files":
        return context.getFileItems() as AnalysisReportResult[K];
      case "statusHistory":
        return context.getStatusHistory() as AnalysisReportResult[K];
      case "renameHistory":
        return context.getRenameHistory() as AnalysisReportResult[K];
      case "processReads":
        return context.getProcessReads() as AnalysisReportResult[K];
      case "operations":
        return context.getTimelineAndOperations().operations as AnalysisReportResult[K];
      case "diagramData":
        return context.getDiagramData() as AnalysisReportResult[K];
      case "chains":
        return context.getChains() as AnalysisReportResult[K];
      case "notices":
        return context.getNotices() as AnalysisReportResult[K];
    }
  }

  private createBuildContext(input: AnalysisReportSourceData) {
    const indexes = buildAnalysisReportIndexes(input, this.normalizer);
    const resolveRootSourceIds = createRootSourceResolver(indexes.parentsByFile);
    const resolveDescendants = createDescendantsResolver(indexes.childrenByFile);

    let fileItems: AnalysisFileItem[] | null = null;
    let fileItemsById: Map<number, AnalysisFileItem> | null = null;
    let sources: ReturnType<AnalysisSourcesService["buildSourceRoots"]> | null = null;
    let statusHistory: AnalysisReportResult["statusHistory"] | null = null;
    let renameHistory: AnalysisReportResult["renameHistory"] | null = null;
    let processReads: AnalysisReportResult["processReads"] | null = null;
    let timelineAndOperations: ReturnType<typeof buildTimelineAndOperations> | null = null;
    let chains: AnalysisReportResult["chains"] | null = null;
    let diagramData: AnalysisReportResult["diagramData"] | null = null;

    const getFileItems = () => {
      if (!fileItems) {
        fileItems = buildFileItems({
          files: input.files,
          filesById: indexes.filesById,
          normalizer: this.normalizer,
          parentsByFile: indexes.parentsByFile,
          childrenByFile: indexes.childrenByFile,
          renameRowsByFile: indexes.renameRowsByFile,
          resolveRootSourceIds,
          trackingStatus: this.trackingStatus,
          versionsByFile: indexes.versionsByFile,
        });
      }
      return fileItems;
    };

    const getFileItemsById = () => {
      if (!fileItemsById) {
        fileItemsById = new Map<number, AnalysisFileItem>(
          getFileItems().map((item) => [item.fileId, item] as [number, AnalysisFileItem]),
        );
      }
      return fileItemsById;
    };

    const getSources = () => {
      if (!sources) {
        sources = this.sourcesService.buildSourceRoots({
          fileItems: getFileItems(),
          fileItemsById: getFileItemsById(),
          normalizer: this.normalizer,
          versionsByFile: indexes.versionsByFile,
          readsByFile: indexes.readsByFile,
          resolveDescendants,
        });
      }
      return sources;
    };

    const getStatusHistory = () => {
      if (!statusHistory) {
        statusHistory = buildStatusHistory({
          statusRows: input.statusRows,
          filesById: indexes.filesById,
          manualStatusByHistoryId: indexes.manualStatusByHistoryId,
          manualStatusByFileAndTime: indexes.manualStatusByFileAndTime,
          normalizer: this.normalizer,
          resolveRootSourceIds,
        });
      }
      return statusHistory;
    };

    const getRenameHistory = () => {
      if (!renameHistory) {
        renameHistory = buildRenameHistory(
          indexes.normalizedRenameRows,
          indexes.filesById,
          this.normalizer,
          resolveRootSourceIds,
        );
      }
      return renameHistory;
    };

    const getProcessReads = () => {
      if (!processReads) {
        processReads = buildProcessReads(
          input.reads,
          this.normalizer,
          indexes.resolveProcessHistoryOriginFileIds,
          resolveRootSourceIds,
        );
      }
      return processReads;
    };

    const getTimelineAndOperations = () => {
      if (!timelineAndOperations) {
        timelineAndOperations = buildTimelineAndOperations({
          deletedStatus: this.deletedStatus,
          fileItemsById: getFileItemsById(),
          files: input.files,
          filesById: indexes.filesById,
          fileVersions: input.fileVersions,
          inputLimit: input.limit,
          normalizer: this.normalizer,
          normalizedRenameRows: indexes.normalizedRenameRows,
          processVersionsIndex: indexes.processVersionsIndex,
          reads: input.reads,
          resolveRootSourceIds,
          statusHistory: getStatusHistory(),
          writes: input.writes,
        });
      }
      return timelineAndOperations;
    };

    const getChains = () => {
      if (!chains) {
        chains = buildChains({
          files: input.files,
          filesById: indexes.filesById,
          normalizer: this.normalizer,
          parentsByFile: indexes.parentsByFile,
          childrenByFile: indexes.childrenByFile,
          readsByFile: indexes.readsByFile,
          writesByFile: indexes.writesByFile,
          versionsByFile: indexes.versionsByFile,
          resolveRootSourceIds,
        });
      }
      return chains;
    };

    const getDiagramData = () => {
      if (!diagramData) {
        diagramData = buildDiagramData(input, indexes.processVersionsIndex, this.normalizer);
      }
      return diagramData;
    };

    return {
      getCapabilities: (): AnalysisReportResult["capabilities"] => ({
        hasFileEvents: true,
        hasFileStatuses: true,
        hasDiagram: false,
      }),
      getOverview: () => buildOverview(input, getSources().length),
      getSources,
      getTimelineAndOperations,
      getFileItems,
      getStatusHistory,
      getRenameHistory,
      getProcessReads,
      getDiagramData,
      getChains,
      getNotices: (): AnalysisReportResult["notices"] => [],
    };
  }

}

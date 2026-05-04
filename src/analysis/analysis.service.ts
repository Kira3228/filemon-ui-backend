import { injectable } from "tsyringe";
import { UpdateMonitoringStatusResult } from "../contracts/api-contracts";
import { AnalysisExportService } from "./analysis-export.service";
import { AnalysisQueryService } from "./analysis-query.service";
import { AnalysisReportBuilderService } from "./analysis-report-builder.service";
import {
  AnalysisReportResult,
  AnalysisReportSectionKey,
  AnalysisReportSummary,
  AnalysisSourceItem,
  IExportTablePayload,
} from "./analysis.types";
import { UpdateFileMonitoringStatusDto } from "./dto/update-file-monitoring-status.dto";

export { AnalysisReportSectionKey };

@injectable()
export class AnalysisService {
  constructor(
    private readonly queryService: AnalysisQueryService,
    private readonly reportBuilder: AnalysisReportBuilderService,
    private readonly exportService: AnalysisExportService,
  ) { }

  async getReport(filter: { limit?: number; page?: number } = {}): Promise<AnalysisReportResult> {
    const sourceData = await this.queryService.fetchReportSourceData(filter);
    return this.reportBuilder.buildReport(sourceData);
  }

  async getReportSummary(filter: { limit?: number; page?: number } = {}): Promise<AnalysisReportSummary> {
    const sourceData = await this.queryService.fetchReportSummarySourceData(filter);
    return this.reportBuilder.buildReportSummary(sourceData);
  }

  async getReportCapabilities(_filter: { limit?: number; page?: number } = {}) {
    return this.reportBuilder.getCapabilities();
  }

  async getReportOverview(filter: { limit?: number; page?: number } = {}) {
    return this.getReportSection("overview", filter);
  }

  async getReportSources(filter: { limit?: number; page?: number } = {}) {
    return this.getReportSection("sources", filter);
  }

  async getReportTimeline(filter: { limit?: number; page?: number } = {}) {
    return this.getReportSection("timeline", filter);
  }

  async getReportFiles(filter: { limit?: number; page?: number } = {}) {
    return this.getReportSection("files", filter);
  }

  async getReportStatusHistory(filter: { limit?: number; page?: number } = {}) {
    return this.getReportSection("statusHistory", filter);
  }

  async getReportRenameHistory(filter: { limit?: number; page?: number } = {}) {
    return this.getReportSection("renameHistory", filter);
  }

  async getReportProcessReads(filter: { limit?: number; page?: number } = {}) {
    return this.getReportSection("processReads", filter);
  }

  async getReportOperations(filter: { limit?: number; page?: number } = {}) {
    return this.getReportSection("operations", filter);
  }

  async getReportDiagram(filter: { limit?: number; page?: number } = {}) {
    return this.getReportSection("diagramData", filter);
  }

  async getReportChains(filter: { limit?: number; page?: number } = {}) {
    return this.getReportSection("chains", filter);
  }

  async getReportNotices(_filter: { limit?: number; page?: number } = {}) {
    return this.reportBuilder.getNotices();
  }

  private async getReportSection<K extends AnalysisReportSectionKey>(
    section: K,
    filter: { limit?: number; page?: number } = {},
  ): Promise<AnalysisReportResult[K]> {
    if (section === "capabilities") {
      return this.reportBuilder.getCapabilities() as AnalysisReportResult[K];
    }

    if (section === "notices") {
      return this.reportBuilder.getNotices() as AnalysisReportResult[K];
    }

    const sourceData = await this.queryService.fetchReportSectionSourceData(section, filter);

    return this.reportBuilder.buildReportSection(sourceData, section);
  }
  //===================
  async getTest<K extends AnalysisReportSectionKey>(
    section: K,
    filter: { limit?: number; page?: number } = {},
  ) {
    if (section === "capabilities") {
      return this.reportBuilder.getCapabilities() as AnalysisReportResult[K];
    }

    if (section === "notices") {
      return this.reportBuilder.getNotices() as AnalysisReportResult[K];
    }

    const sourceData = await this.queryService.fetchReportSectionSourceData(section, filter);

    return sourceData
    // return this.reportBuilder.buildReportSection(sourceData, section);
  }
  //===================
  async updateFileMonitoringStatus(
    fileId: number,
    payload: UpdateFileMonitoringStatusDto,
  ): Promise<UpdateMonitoringStatusResult> {
    return this.queryService.updateFileMonitoringStatus(fileId, payload);
  }

  async exportTable(payload: IExportTablePayload) {
    return this.exportService.exportTable(payload);
  }
  /*===================================================== */
}

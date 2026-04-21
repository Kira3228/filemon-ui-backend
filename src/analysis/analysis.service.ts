import { injectable } from "tsyringe";
import { UpdateMonitoringStatusResult } from "../contracts/api-contracts";
import { AnalysisExportService } from "./analysis-export.service";
import { AnalysisQueryService } from "./analysis-query.service";
import { AnalysisReportBuilderService } from "./analysis-report-builder.service";
import {
  AnalysisReportResult,
  AnalysisReportSectionKey,
  AnalysisReportSummary,
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

  async getReport(filter: { limit?: number } = {}): Promise<AnalysisReportResult> {
    const sourceData = await this.queryService.fetchReportSourceData(filter);
    return this.reportBuilder.buildReport(sourceData);
  }

  async getReportSummary(filter: { limit?: number } = {}): Promise<AnalysisReportSummary> {
    const sourceData = await this.queryService.fetchReportSourceData(filter);
    return this.reportBuilder.buildReportSummary(sourceData);
  }

  async getReportSection<K extends AnalysisReportSectionKey>(
    section: K,
    filter: { limit?: number } = {},
  ): Promise<AnalysisReportResult[K]> {
    const sourceData = await this.queryService.fetchReportSourceData(filter);
    return this.reportBuilder.buildReportSection(sourceData, section);
  }

  async updateFileMonitoringStatus(
    fileId: number,
    payload: UpdateFileMonitoringStatusDto,
  ): Promise<UpdateMonitoringStatusResult> {
    return this.queryService.updateFileMonitoringStatus(fileId, payload);
  }

  async exportTable(payload: IExportTablePayload) {
    return this.exportService.exportTable(payload);
  }
}

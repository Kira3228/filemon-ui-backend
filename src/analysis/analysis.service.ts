import { injectable } from "tsyringe";
import { UpdateMonitoringStatusResult } from "../contracts/api-contracts";
import { AnalysisExportService } from "./analysis-export.service";
import { AnalysisQueryService } from "./analysis-query.service";
import { AnalysisReportBuilderService } from "./analysis-report-builder.service";
import { AnalysisReportResult, IExportTablePayload } from "./analysis.types";
import { UpdateFileMonitoringStatusDto } from "./dto/update-file-monitoring-status.dto";

export type AnalysisReportSectionKey = keyof Pick<
  AnalysisReportResult,
  | "capabilities"
  | "overview"
  | "sources"
  | "timeline"
  | "files"
  | "statusHistory"
  | "renameHistory"
  | "processReads"
  | "operations"
  | "diagramData"
  | "chains"
  | "notices"
>;

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

  async getReportSection<K extends AnalysisReportSectionKey>(
    section: K,
    filter: { limit?: number } = {},
  ): Promise<AnalysisReportResult[K]> {
    const report = await this.getReport(filter);
    return report[section];
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

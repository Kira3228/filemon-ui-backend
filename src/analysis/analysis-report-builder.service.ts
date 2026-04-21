import { injectable } from "tsyringe";
import { AnalysisNormalizerService } from "./analysis-normalizer.service";
import { buildAnalysisReportIndexes } from "./analysis-report-builder.indexes";
import { buildAnalysisReportPayload } from "./analysis-report-builder.payload";
import { AnalysisReportResult, AnalysisReportSourceData, TMonitoringStatus } from "./analysis.types";

@injectable()
export class AnalysisReportBuilderService {
  private readonly trackingStatus: TMonitoringStatus = 1;
  private readonly deletedStatus: TMonitoringStatus = 2;

  constructor(private readonly normalizer: AnalysisNormalizerService) { }

  buildReport(input: AnalysisReportSourceData): AnalysisReportResult {
    const indexes = buildAnalysisReportIndexes(input, this.normalizer);

    return buildAnalysisReportPayload({
      deletedStatus: this.deletedStatus,
      indexes,
      input,
      normalizer: this.normalizer,
      trackingStatus: this.trackingStatus,
    });
  }

}

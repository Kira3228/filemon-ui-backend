import { injectable } from "tsyringe";
import { AnalysisNormalizerService } from "./analysis-normalizer.service";
import { buildAnalysisReportIndexes } from "./analysis-report-builder.indexes";
import { buildAnalysisReportPayload } from "./analysis-report-builder.payload";
import { AnalysisSourcesService } from "./analysis-sources.service";
import { AnalysisReportResult, AnalysisReportSourceData, TMonitoringStatus } from "./analysis.types";

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

}

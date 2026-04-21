import { AnalysisSourcesService } from "../src/analysis/analysis-sources.service";

describe("AnalysisSourcesService", () => {
  let sourceService: AnalysisSourcesService;

  beforeEach(() => {
    sourceService = new AnalysisSourcesService();
  });

  test("should be defined", () => {
    expect(sourceService).toBeDefined();
  });
});
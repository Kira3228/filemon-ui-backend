import { injectable } from "tsyringe";
import { FileVersionReadModel } from "../read-models/file-version.read-model";
import { FileOperationReadModel } from "../read-models/file-operation.read-model";
import { FileEventRowReadModel } from "../read-models/file-event-row.read-model";
import { AnalysisReportOverview } from "../analysis/analysis.types";
import { FilesReadModel } from "../read-models/files.read-model";
import { SourcesService } from "../sources/sources.service";

@injectable()
export class OverviewService {
  constructor(
    private readonly fileVersionReadModel: FileVersionReadModel,
    private readonly fileOperationReadModel: FileOperationReadModel,
    private readonly fileReadModel: FilesReadModel,
    private readonly sourcesService: SourcesService
  ) { }

  async getOverview(): Promise<AnalysisReportOverview> {
    const fileVersions = await this.fileVersionReadModel.findAllFileVersions()
    const files = await this.fileReadModel.findAllFiles()
    const sources = await this.sourcesService.getSources()
    const maxDepth = fileVersions.reduce((max, row) => Math.max(max, Number(row.depth) || 0), 0)
    const reads = await this.fileOperationReadModel.findFileOperation('read')
    const writes = await this.fileOperationReadModel.findFileOperation('write')

    return {
      files: files.length,
      fileVersions: fileVersions.length,
      sources: sources.items.length,
      maxDepth: maxDepth,
      reads: reads.length,
      writes: writes.length
    }
  }
}
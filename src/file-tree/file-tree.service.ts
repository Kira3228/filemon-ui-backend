import { injectable } from "tsyringe";
import { AnalysisService } from "../analysis/analysis.service";
import { FileVersionReadModel } from "../read-models/file-version.read-model";
import { FileOperationReadModel } from "../read-models/file-operation.read-model";
import { buildDiagramData } from "./build-diagram-data";
import { AnalysisFileVersionRow, AnalysisOperationRow } from "../shared/types/read-model-row.type";
import { FileTreeResult } from "./types/file-tree-result.type";

export interface DiagramDataObject {
  fileVersions: AnalysisFileVersionRow[];
  reads: AnalysisOperationRow[];
  writes: AnalysisOperationRow[];
}


@injectable()
export class DiagramDatasetService {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly fileVersionReadModel: FileVersionReadModel,
    private readonly fileOperationReadModel: FileOperationReadModel
  ) { }

  async getFileTree(): Promise<FileTreeResult> {
    const files = await this.analysisService.getReportFiles();

    const fileIds = files.map((file) => file.fileId);

    const [fileVersions, reads, writes] = await Promise.all([
      this.fileVersionReadModel.findFileVersionsByFileIds(fileIds),
      this.fileOperationReadModel.findFileOperationByFileIds("read", fileIds),
      this.fileOperationReadModel.findFileOperationByFileIds("write", fileIds),
    ]);

    const resultObject: DiagramDataObject = {
      fileVersions,
      reads,
      writes
    };

    return {
      files,
      diagramData: buildDiagramData(resultObject),
    };
  }
}

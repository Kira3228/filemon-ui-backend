import { injectable } from "tsyringe";
import { FileVersionReadModel } from "../read-models/file-version.read-model";
import { FileOperationReadModel } from "../read-models/file-operation.read-model";
import { buildDiagramData } from "./build-diagram-data";
import { AnalysisFileVersionRow, AnalysisOperationRow } from "../shared/types/read-model-row.type";
import { FileTreeResult } from "./types/file-tree-result.type";
import { PaginationQuery } from "../shared/types/pagination.type";
import { buildPaginatedResult, normalizePagination } from "../shared/utils/pagination";
import { FilesService } from "../files/files.service";

export interface DiagramDataObject {
  fileVersions: AnalysisFileVersionRow[];
  reads: AnalysisOperationRow[];
  writes: AnalysisOperationRow[];
}


@injectable()
export class DiagramDatasetService {
  constructor(
    private readonly filesService: FilesService,
    private readonly fileVersionReadModel: FileVersionReadModel,
    private readonly fileOperationReadModel: FileOperationReadModel
  ) { }

  async getFileTree(filters: PaginationQuery = {}): Promise<FileTreeResult> {
    const files = await this.filesService.getAllFiles();
    const total = files.length;
    const { page, limit, offset } = normalizePagination(filters, { defaultLimit: 250, maxLimit: 1000 });
    const items = files.slice(offset, offset + limit);
    const fileIds = items.map((file) => file.fileId);

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
      ...buildPaginatedResult(items, page, limit, total),
      diagramData: buildDiagramData(resultObject),
    };
  }
}

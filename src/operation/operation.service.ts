import { injectable } from "tsyringe";
import { FileOperationReadModel } from "../read-models/file-operation.read-model";
import { FileVersionReadModel } from "../read-models/file-version.read-model";
import { FileEventRowReadModel } from "../read-models/file-event-row.read-model";
import { FilesReadModel } from "../read-models/files.read-model";
import { AnalysisFileItem } from "../files/types/file-item.type";
import { AnalysisOperationItem } from "./types/operation-item.type";
import { AnalysisFileRow } from "../shared/types/read-model-row.type";
import { buildFileItem } from "../shared/helpers/build-file-item";
import { normalizeFileEvent } from "../shared/helpers/normalize-file-event";
import { PaginatedResult, PaginationQuery } from "../shared/types/pagination.type";
import { paginateItems } from "../shared/utils/pagination";
import {
  buildParentsByFile,
  createRootSourceResolver,
  groupFileEventsByFile,
  groupVersionsByFile,
} from "../sources/sources.graph";
import { buildOperationItem } from "./operation.helper";

@injectable()
export class OperationService {
  constructor(
    private readonly fileOperationReadModel: FileOperationReadModel,
    private readonly fileVersionReadModel: FileVersionReadModel,
    private readonly fileEventRowReadModel: FileEventRowReadModel,
    private readonly fileReadModel: FilesReadModel
  ) { }

  async getOperations(filters: PaginationQuery = {}): Promise<PaginatedResult<AnalysisOperationItem>> {
    const allFiles = await this.fileReadModel.findAllFiles();
    const allFileIds = allFiles.map((file) => file.id);

    const [versions, fileEvents, reads, writes] = await Promise.all([
      this.fileVersionReadModel.findFileVersionsByFileIds(allFileIds),
      this.fileEventRowReadModel.findFileEventsByFileIds(allFileIds),
      this.fileOperationReadModel.findFileOperation("read"),
      this.fileOperationReadModel.findFileOperation("write"),
    ]);

    const filesById = new Map<number, AnalysisFileRow>(allFiles.map((file) => [file.id, file] as const));
    const versionsByFile = groupVersionsByFile(versions, allFileIds);
    const parentsByFile = buildParentsByFile(versions, allFileIds);
    const resolveRootSourceIds = createRootSourceResolver(parentsByFile);
    const normalizedRenameRows = fileEvents
      .map((row) => normalizeFileEvent(row, filesById))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    const renameRowsByFile = groupFileEventsByFile(allFiles, normalizedRenameRows);

    const fileItemsById = new Map<number, AnalysisFileItem>(
      allFiles.map((file) => {
        const item = buildFileItem(
          file,
          filesById,
          versionsByFile,
          parentsByFile,
          resolveRootSourceIds(file.id),
          renameRowsByFile,
        );

        return [item.fileId, item] as const;
      }),
    );

    const operations: AnalysisOperationItem[] = [
      ...reads.map((row) => buildOperationItem("READ", row, fileItemsById, resolveRootSourceIds)),
      ...writes.map((row) => buildOperationItem("WRITE", row, fileItemsById, resolveRootSourceIds)),
    ];

    const items = operations.sort((a, b) => {
      const aDate = a.timestamp ? String(a.timestamp) : "";
      const bDate = b.timestamp ? String(b.timestamp) : "";
      if (aDate === bDate) return a.id > b.id ? -1 : 1;
      return aDate > bDate ? -1 : 1;
    });

    return paginateItems(items, filters, { defaultLimit: 250, maxLimit: 1000 });
  }
}

import { injectable } from "tsyringe";
import { FileEventRowReadModel } from "../read-models/file-event-row.read-model";
import { FileVersionReadModel } from "../read-models/file-version.read-model";
import { FilesReadModel } from "../read-models/files.read-model";
import { AnalysisFileItem } from "./types/file-item.type";
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

@injectable()
export class FilesService {
  constructor(
    private readonly fileVersionReadModel: FileVersionReadModel,
    private readonly fileEventRowReadModel: FileEventRowReadModel,
    private readonly filesReadModel: FilesReadModel
  ) { }


  async getAllFiles(): Promise<AnalysisFileItem[]> {
    const allFiles = await this.filesReadModel.findAllFiles();
    const allFilesIds = allFiles.map((file) => file.id);

    const [versions, fileEvents] = await Promise.all([
      this.fileVersionReadModel.findFileVersionsByFileIds(allFilesIds),
      this.fileEventRowReadModel.findFileEventsByFileIds(allFilesIds),
    ]);

    const filesById = new Map<number, AnalysisFileRow>(allFiles.map((file) => [file.id, file] as const));
    const versionsByFile = groupVersionsByFile(versions, allFilesIds);
    const parentsByFile = buildParentsByFile(versions, allFilesIds);
    const resolveRootSourceIds = createRootSourceResolver(parentsByFile);
    const normalizedRenameRows = fileEvents
      .map((row) => normalizeFileEvent(row, filesById))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    const renameRowsByFile = groupFileEventsByFile(allFiles, normalizedRenameRows);

    return allFiles
      .map((file) =>
        buildFileItem(
          file,
          filesById,
          versionsByFile,
          parentsByFile,
          resolveRootSourceIds(file.id),
          renameRowsByFile,
        ),
      )
      .sort((a, b) => {
        const aDate = a.trackingStartedAt ? String(a.trackingStartedAt) : "";
        const bDate = b.trackingStartedAt ? String(b.trackingStartedAt) : "";
        if (aDate === bDate) return b.id - a.id;
        return aDate > bDate ? -1 : 1;
      });
  }

  async getFiles(filters: PaginationQuery = {}): Promise<PaginatedResult<AnalysisFileItem>> {
    const items = await this.getAllFiles();
    return paginateItems(items, filters, { defaultLimit: 250, maxLimit: 1000 });
  }

}

import { injectable } from "tsyringe";
import {
  AnalysisNormalizedFileEvent,
} from "../shared/types/read-model-row.type";
import { AnalysisFileItem } from "../files/types/file-item.type";
import { AnalysisFileRow } from "../shared/types/read-model-row.type";
import { FilesReadModel } from "../read-models/files.read-model";
import { FileVersionReadModel } from "../read-models/file-version.read-model";
import { FileOperationReadModel } from "../read-models/file-operation.read-model";
import { buildChildrenByFile, buildParentsByFile, createDescendantsResolver, createRootSourceResolver, groupFileEventsByFile, groupReadsByFile, groupVersionsByFile } from "./sources.graph";
import { FileEventRowReadModel } from "../read-models/file-event-row.read-model";
import { normalizeFileEvent } from "../shared/helpers/normalize-file-event";
import { buildFileItem } from "../shared/helpers/build-file-item";
import { SourceDto } from "./dto/sources.dto";
import { buildSourceItem } from "./helpers/build-source-item";
import { SourceListResult } from "./types/source-list-result.type";
import { buildPaginatedResult, normalizePagination } from "../shared/utils/pagination";

@injectable()
export class SourcesService {
  constructor(
    private readonly filesReadModel: FilesReadModel,
    private readonly fileOperationModel: FileOperationReadModel,
    private readonly fileVersionReadModel: FileVersionReadModel,
    private readonly fileEventRowReadModel: FileEventRowReadModel
  ) { }

  async getSources(filters: SourceDto): Promise<SourceListResult> {
    const { page, limit } = normalizePagination(filters, { defaultLimit: 250, maxLimit: 1000 });

    const [rootFiles, total] = await Promise.all([
      this.filesReadModel.findRootFiles({ limit, page }),
      this.filesReadModel.countRootFiles(),
    ]);

    if (!rootFiles.length) {
      return buildPaginatedResult([], page, limit, total);
    }

    const allFiles = await this.filesReadModel.findAllFiles();
    const allFileIds = allFiles.map((file) => file.id);
    const rootFileIds = rootFiles.map((file) => file.id);

    const [versions, reads, fileEvents] = await Promise.all([
      this.fileVersionReadModel.findFileVersionsByFileIds(allFileIds),
      this.fileOperationModel.findFileOperationByFileIds("read", rootFileIds),
      this.fileEventRowReadModel.findFileEventsByFileIds(allFileIds)
    ]);

    const filesById = new Map<number, AnalysisFileRow>(allFiles.map((file) => [file.id, file] as const));
    const versionsByFile = groupVersionsByFile(versions, allFileIds);
    const readsByFile = groupReadsByFile(reads, rootFileIds);
    const parentsByFile = buildParentsByFile(versions, allFileIds);
    const childrenByFile = buildChildrenByFile(parentsByFile, allFileIds);
    const resolveRootSourceIds = createRootSourceResolver(parentsByFile);
    const resolveDescendants = createDescendantsResolver(childrenByFile);
    const normalizedRenameRows = fileEvents
      .map((row) => normalizeFileEvent(row, filesById))
      .filter((item): item is AnalysisNormalizedFileEvent => Boolean(item));
    const renameRowsByFile = groupFileEventsByFile(allFiles, normalizedRenameRows);
    const fileItemsById = new Map<number, AnalysisFileItem>();

    for (const file of allFiles) {
      fileItemsById.set(
        file.id,
        buildFileItem(
          file,
          filesById,
          versionsByFile,
          parentsByFile,
          resolveRootSourceIds(file.id),
          renameRowsByFile,
        ),
      );
    }
    const items = rootFiles.map((file) =>
      buildSourceItem(
        file,
        readsByFile,
        versionsByFile,
        resolveDescendants,
        fileItemsById,
      ),
    );

    return buildPaginatedResult(items, page, limit, total);
  }
}

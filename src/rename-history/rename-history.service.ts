import { injectable } from "tsyringe";
import { AnalysisNormalizerService } from "../analysis/analysis-normalizer.service";
import { buildRenameHistory } from "../analysis/analysis-report-builder.collections";
import { FileEventRowReadModel } from "../read-models/file-event-row.read-model";
import { FileVersionReadModel } from "../read-models/file-version.read-model";
import { FilesReadModel } from "../read-models/files.read-model";
import { normalizeFileEvent } from "../shared/helpers/normalize-file-event";
import { buildParentsByFile, createRootSourceResolver } from "../sources/sources.graph";
import { AnalysisRenameHistoryItem } from "./types/rename-history-item.type";
import { AnalysisFileRow } from "../shared/types/read-model-row.type";
import { PaginatedResult, PaginationQuery } from "../shared/types/pagination.type";
import { paginateItems } from "../shared/utils/pagination";



@injectable()
export class RenameHistoryService {
  constructor(
    private readonly filesReadModel: FilesReadModel,
    private readonly fileVersionReadModel: FileVersionReadModel,
    private readonly fileEventRowReadModel: FileEventRowReadModel,
    private readonly normalizer: AnalysisNormalizerService,
  ) { }

  async getRenameHistory(filters: PaginationQuery = {}): Promise<PaginatedResult<AnalysisRenameHistoryItem>> {
    const allFiles = await this.filesReadModel.findAllFiles();
    const allFileIds = allFiles.map((file) => file.id);

    const [versions, fileEvents] = await Promise.all([
      this.fileVersionReadModel.findFileVersionsByFileIds(allFileIds),
      this.fileEventRowReadModel.findFileEventsByFileIds(allFileIds),
    ]);

    const filesById = new Map<number, AnalysisFileRow>(allFiles.map((file) => [file.id, file] as const));
    const parentsByFile = buildParentsByFile(versions, allFileIds);
    const resolveRootSourceIds = createRootSourceResolver(parentsByFile);
    const normalizedRenameRows = fileEvents
      .map((row) => normalizeFileEvent(row, filesById))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const items = buildRenameHistory(
      normalizedRenameRows,
      filesById,
      this.normalizer,
      resolveRootSourceIds,
    );

    return paginateItems(items, filters, { defaultLimit: 250, maxLimit: 1000 });
  }
}

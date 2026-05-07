import { injectable } from "tsyringe";
import { FileVersionReadModel } from "../read-models/file-version.read-model";
import { FileStatusRowsReadMode } from "../read-models/file-status-rows.read-model";
import { ManualFileStatusEventReadModel } from "../read-models/manual-file-status.event.read-model";
import { FilesReadModel } from "../read-models/files.read-model";
import { AnalysisNormalizerService } from "../analysis/analysis-normalizer.service";
import { buildStatusHistory } from "../analysis/analysis-report-builder.collections";
import { parseManualStatusEvent } from "../analysis/analysis-report-builder.mappers";
import { buildParentsByFile, createRootSourceResolver } from "../sources/sources.graph";
import { AnalysisFileRow } from "../shared/types/read-model-row.type";
import { AnalysisManualStatusEvent, AnalysisStatusHistoryItem } from "./types/status-history-item.type";
import { PaginatedResult, PaginationQuery } from "../shared/types/pagination.type";
import { paginateItems } from "../shared/utils/pagination";

@injectable()
export class StatusHistoryService {
  constructor(
    private readonly fileVersionReadModel: FileVersionReadModel,
    private readonly fileStatusRows: FileStatusRowsReadMode,
    private readonly manualFileStatusEventReadModel: ManualFileStatusEventReadModel,
    private readonly filesReadModel: FilesReadModel,
    private readonly normalizer: AnalysisNormalizerService
  ) { }

  async getHistoryService(filters: PaginationQuery = {}): Promise<PaginatedResult<AnalysisStatusHistoryItem>> {
    const allFiles = await this.filesReadModel.findAllFiles();
    const allFileIds = allFiles.map((file) => file.id);

    const [versions, statusRows, manualStatusRows] = await Promise.all([
      this.fileVersionReadModel.findFileVersionsByFileIds(allFileIds),
      this.fileStatusRows.findStatusRowsByFileIds(allFileIds),
      this.manualFileStatusEventReadModel.findManualFileStatusEventByFileIds(allFileIds),
    ]);

    const filesById = new Map<number, AnalysisFileRow>(allFiles.map((file) => [file.id, file] as const));
    const parentsByFile = buildParentsByFile(versions, allFileIds);
    const resolveRootSourceIds = createRootSourceResolver(parentsByFile);
    const manualStatusByHistoryId = new Map<number, AnalysisManualStatusEvent>();
    const manualStatusByFileAndTime = new Map<string, AnalysisManualStatusEvent>();

    for (const row of manualStatusRows) {
      const manualStatus = parseManualStatusEvent(row);
      if (manualStatus.statusHistoryId) {
        manualStatusByHistoryId.set(manualStatus.statusHistoryId, manualStatus);
      }
      manualStatusByFileAndTime.set(`${manualStatus.fileId}:${manualStatus.createdAt}`, manualStatus);
    }

    const items = buildStatusHistory({
      statusRows,
      filesById,
      manualStatusByHistoryId,
      manualStatusByFileAndTime,
      normalizer: this.normalizer,
      resolveRootSourceIds,
    });

    return paginateItems(items, filters, { defaultLimit: 250, maxLimit: 1000 });
  }

}

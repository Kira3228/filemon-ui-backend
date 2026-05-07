import { injectable } from "tsyringe";
import { AnalysisNormalizerService } from "../analysis/analysis-normalizer.service";
import { buildStatusHistory } from "../analysis/analysis-report-builder.collections";
import { buildTimelineAndOperations } from "../analysis/analysis-report-builder.timeline";
import { parseManualStatusEvent } from "../analysis/analysis-report-builder.mappers";
import { FileEventRowReadModel } from "../read-models/file-event-row.read-model";
import { FileOperationReadModel } from "../read-models/file-operation.read-model";
import { FileStatusRowsReadMode } from "../read-models/file-status-rows.read-model";
import { FileVersionReadModel } from "../read-models/file-version.read-model";
import { FilesReadModel } from "../read-models/files.read-model";
import { ManualFileStatusEventReadModel } from "../read-models/manual-file-status.event.read-model";
import { buildFileItem } from "../shared/helpers/build-file-item";
import { normalizeFileEvent } from "../shared/helpers/normalize-file-event";
import {
  buildParentsByFile,
  createRootSourceResolver,
  groupFileEventsByFile,
  groupVersionsByFile,
} from "../sources/sources.graph";
import { AnalysisFileItem } from "../files/types/file-item.type";
import { AnalysisFileRow } from "../shared/types/read-model-row.type";
import { AnalysisTimelineEntry } from "./types/timeline-entry.type";

@injectable()
export class EventsService {
  private readonly deletedStatus = 2;

  constructor(
    private readonly filesReadModel: FilesReadModel,
    private readonly fileVersionReadModel: FileVersionReadModel,
    private readonly fileEventRowReadModel: FileEventRowReadModel,
    private readonly fileOperationReadModel: FileOperationReadModel,
    private readonly fileStatusRowsReadMode: FileStatusRowsReadMode,
    private readonly manualFileStatusEventReadModel: ManualFileStatusEventReadModel,
    private readonly normalizer: AnalysisNormalizerService,
  ) { }

  async getEvents(): Promise<AnalysisTimelineEntry[]> {
    const allFiles = await this.filesReadModel.findAllFiles();
    const allFileIds = allFiles.map((file) => file.id);

    const [versions, fileEvents, reads, writes, statusRows, manualStatusRows] = await Promise.all([
      this.fileVersionReadModel.findFileVersionsByFileIds(allFileIds),
      this.fileEventRowReadModel.findFileEventsByFileIds(allFileIds),
      this.fileOperationReadModel.findFileOperation("read"),
      this.fileOperationReadModel.findFileOperation("write"),
      this.fileStatusRowsReadMode.findStatusRowsByFileIds(allFileIds),
      this.manualFileStatusEventReadModel.findManualFileStatusEventByFileIds(allFileIds),
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

    const manualStatusByHistoryId = new Map();
    const manualStatusByFileAndTime = new Map();

    for (const row of manualStatusRows) {
      const manualStatus = parseManualStatusEvent(row);
      if (manualStatus.statusHistoryId) {
        manualStatusByHistoryId.set(manualStatus.statusHistoryId, manualStatus);
      }
      manualStatusByFileAndTime.set(`${manualStatus.fileId}:${manualStatus.createdAt}`, manualStatus);
    }

    const statusHistory = buildStatusHistory({
      statusRows,
      filesById,
      manualStatusByHistoryId,
      manualStatusByFileAndTime,
      normalizer: this.normalizer,
      resolveRootSourceIds,
    });

    return buildTimelineAndOperations({
      deletedStatus: this.deletedStatus,
      fileItemsById,
      files: allFiles,
      filesById,
      fileVersions: versions,
      inputLimit: 1000,
      normalizer: this.normalizer,
      normalizedRenameRows,
      processVersionsIndex: new Map(),
      reads,
      resolveRootSourceIds,
      statusHistory,
      writes,
    }).timelineEntries;
  }
}

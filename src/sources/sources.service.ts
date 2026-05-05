import { injectable } from "tsyringe";
import {
  AnalysisFileItem,
  AnalysisFileRow,
  AnalysisNormalizedFileEvent,
  AnalysisSourceItem,
} from "../analysis/analysis.types";
import { FilesReadModel } from "../read-models/files.read-model";
import { FileVersionReadModel } from "../read-models/file-version.read-model";
import { splitLast } from "../shared/utils/split-last";
import { FileOperationReadModel } from "../read-models/file-operation.read-model";
import { buildProcessLabel } from "../shared/utils/build-process-label";
import { buildChildrenByFile, buildParentsByFile, createDescendantsResolver, createRootSourceResolver, groupFileEventsByFile, groupReadsByFile, groupVersionsByFile } from "./sources.graph";
import { FileEventRowReadModel } from "../read-models/file-event-row.read-model";
import { normalizeFileEvent } from "../shared/helpers/normalize-file-event";
import { buildFileItem } from "../shared/helpers/build-file-item";

@injectable()
export class SourcesService {
  constructor(
    private readonly filesReadModel: FilesReadModel,
    private readonly fileOperationModel: FileOperationReadModel,
    private readonly fileVersionReadModel: FileVersionReadModel,
    private readonly fileEventRowReadModel: FileEventRowReadModel
  ) { }

  async getSources(): Promise<AnalysisSourceItem[]> {
    const rootFiles = await this.filesReadModel.findRootFiles();
    if (!rootFiles.length) {
      return [];
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


    return rootFiles.map((file): AnalysisSourceItem => {
      const readers = readsByFile.get(file.id) || [];
      const processLabels = new Set<string>(readers.map((row) => buildProcessLabel(row)));
      const descendantIds = resolveDescendants(file.id);
      const relatedFileIds = [file.id, ...descendantIds];
      let maxDepth = 0;

      for (const fileId of relatedFileIds) {
        for (const version of versionsByFile.get(fileId) || []) {
          maxDepth = Math.max(maxDepth, Number(version.depth) || 0);
        }
      }

      return {
        id: file.id,
        fileId: file.id,
        name: splitLast(file.full_path),
        path: file.full_path,
        filesystemUuid: file.filesystem_uuid,
        trackingStartedAt: String(file.tracking_started_at || ""),
        sourceIds: [file.id],
        stats: {
          processes: processLabels.size,
          producedFiles: descendantIds.length,
          maxDepth,
          readOps: readers.length,
        },
        readers: readers.slice(0, 8).map((row) => ({
          processVersionId: row.process_version_id,
          label: buildProcessLabel(row),
          count: Number(row.count) || 1,
          firstAt: row.first_at,
        })),
        produced: descendantIds
          .map((fileId) => fileItemsById.get(fileId))
          .filter((item): item is AnalysisFileItem => Boolean(item))
          .slice(0, 8),
      };
    });
  }
}

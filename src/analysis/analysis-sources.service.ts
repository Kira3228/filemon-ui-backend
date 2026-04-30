import { injectable } from "tsyringe";
import {
  AnalysisFileItem,
  AnalysisFileVersionRow,
  AnalysisOperationRow,
  AnalysisSourceItem,
} from "./analysis.types";
import { AnalysisNormalizerService } from "./analysis-normalizer.service";
import { isDefined } from "./analysis-report-builder.mappers";

export interface BuildSourceRootsOptions {
  fileItems: AnalysisFileItem[];
  fileItemsById: Map<number, AnalysisFileItem>;
  limit?: number;
  normalizer: AnalysisNormalizerService;
  offset?: number;
  versionsByFile: Map<number, AnalysisFileVersionRow[]>;
  readsByFile: Map<number, AnalysisOperationRow[]>;
  resolveDescendants: (fileId: number) => number[];
}

@injectable()
export class AnalysisSourcesService {
  buildSourceRoots({
    fileItems,
    fileItemsById,
    limit,
    normalizer,
    offset = 0,
    versionsByFile,
    readsByFile,
    resolveDescendants,
  }: BuildSourceRootsOptions): AnalysisSourceItem[] {
    return fileItems
      .filter((item) => item.sourceIds.length === 1 && item.sourceIds[0] === item.id)
      .map((item) => {
        const readers = readsByFile.get(item.id) || [];
        const descendantIds = resolveDescendants(item.id);
        const relatedFileIds = [item.id, ...descendantIds];
        const processLabels = new Set<string>();
        let maxDepth = 0;
        for (const fileId of relatedFileIds) {
          for (const version of versionsByFile.get(fileId) || []) {
            maxDepth = Math.max(maxDepth, Number(version.depth) || 0);
          }
        }
        for (const row of readers) {
          processLabels.add(normalizer.buildProcessLabel(row));
        }
        return {
          id: item.id,
          fileId: item.id,
          name: item.name,
          path: item.path,
          filesystemUuid: item.filesystemUuid,
          trackingStartedAt: item.trackingStartedAt,
          sourceIds: [item.id],
          stats: {
            processes: processLabels.size,
            producedFiles: descendantIds.length,
            maxDepth,
            readOps: readers.length,
          },
          readers: readers.slice(0, 8).map((row) => ({
            processVersionId: row.process_version_id,
            label: normalizer.buildProcessLabel(row),
            count: 1,
            firstAt: row.first_at,
          })),
          produced: descendantIds
            .map((fileId) => fileItemsById.get(fileId))
            .filter(isDefined)
            .slice(0, 8),
        };
      })
      .slice(offset, offset + (limit || 250));
  }
}

import { AnalysisFileItem } from "../files/types/file-item.type";
import { splitLast } from "../shared/utils/split-last";
import { AnalysisNormalizerService } from "./analysis-normalizer.service";
import { toFileLinks } from "./analysis-report-builder.mappers";
import type {
  AnalysisFilePathRef,
  AnalysisFileRow,
  AnalysisFileVersionRow,
  AnalysisNormalizedFileEvent,
} from "./analysis.types";

interface BuildFileGraphOptions {
  files: AnalysisFileRow[];
  filesById: Map<number, AnalysisFileRow>;
  normalizer: AnalysisNormalizerService;
  parentsByFile: Map<number, Set<number>>;
  childrenByFile: Map<number, Set<number>>;
  renameRowsByFile: Map<number, AnalysisNormalizedFileEvent[]>;
  trackingStatus: number;
  versionsByFile: Map<number, AnalysisFileVersionRow[]>;
}

export const createRootSourceResolver = (
  parentsByFile: Map<number, Set<number>>,
): (fileId: number, stack?: Set<number>) => number[] => {
  const rootMemo = new Map<number, number[]>();

  const resolveRootSourceIds = (fileId: number, stack = new Set<number>()): number[] => {
    const memoized = rootMemo.get(fileId);
    if (memoized !== undefined) {
      return memoized;
    }
    if (stack.has(fileId)) return [fileId];

    const parents = Array.from(parentsByFile.get(fileId) || []);
    if (!parents.length) {
      rootMemo.set(fileId, [fileId]);
      return [fileId];
    }

    stack.add(fileId);
    const roots = new Set<number>();
    for (const parentId of parents) {
      for (const rootId of resolveRootSourceIds(parentId, stack)) {
        roots.add(rootId);
      }
    }
    stack.delete(fileId);
    const value = Array.from(roots).sort((a, b) => a - b);
    rootMemo.set(fileId, value.length ? value : [fileId]);
    return value.length ? value : [fileId];
  };

  return resolveRootSourceIds;
};

export const createDescendantsResolver = (
  childrenByFile: Map<number, Set<number>>,
): ((fileId: number) => number[]) => {
  return (fileId: number): number[] => {
    const visited = new Set<number>();
    const queue = [...Array.from(childrenByFile.get(fileId) || [])];

    while (queue.length) {
      const current = queue.shift();
      if (current === undefined || visited.has(current)) continue;
      visited.add(current);
      for (const childId of Array.from(childrenByFile.get(current) || [])) {
        queue.push(childId);
      }
    }

    return Array.from(visited).sort((a, b) => a - b);
  };
};

export const buildFileItems = ({
  files,
  filesById,
  normalizer,
  parentsByFile,
  renameRowsByFile,
  resolveRootSourceIds,
  trackingStatus,
  versionsByFile,
}: BuildFileGraphOptions & {
  resolveRootSourceIds: (fileId: number) => number[];
}): AnalysisFileItem[] =>
  files.map((file) => {
    const fileVersions = [...(versionsByFile.get(file.id) || [])].sort((a, b) =>
      normalizer.sortDesc(a.created_at, b.created_at, a.version_number, b.version_number),
    );
    const primaryVersion = [...fileVersions].sort((a, b) =>
      normalizer.sortAsc(a.created_at, b.created_at, a.version_number, b.version_number),
    )[0] || null;
    const sourceIds = resolveRootSourceIds(file.id);
    const parentIds = Array.from(parentsByFile.get(file.id) || []);
    return {
      id: file.id,
      fileId: file.id,
      name: splitLast(file.full_path),
      path: file.full_path,
      pathHistory: normalizer.buildPathHistory(file.full_path, renameRowsByFile.get(file.id) || []),
      filesystem: file.filesystem_uuid,
      filesystemUuid: file.filesystem_uuid,
      sizeBytes: file.initial_size_bytes,
      versionCount: fileVersions.length,
      depth: fileVersions.reduce((max, row) => Math.max(max, Number(row.depth) || 0), 0),
      parents: toFileLinks(normalizer, parentIds, filesById as Map<number, AnalysisFilePathRef>),
      sourceIds,
      sourceLabels: toFileLinks(normalizer, sourceIds, filesById as Map<number, AnalysisFilePathRef>),
      originProcess: normalizer.getOriginProcess(primaryVersion),
      user: normalizer.getOriginUser(primaryVersion),
      currentStatusCode: Number(file.raw_status) || trackingStatus,
      currentStatus: normalizer.formatStatus(file.raw_status),
      trackingStartedAt: file.tracking_started_at,
      birthTime: file.birth_time,
      lastStatusAt: file.last_status_at,
      inode: file.inode,
    };
  }).sort((a, b) => normalizer.sortDesc(a.trackingStartedAt, b.trackingStartedAt, a.id, b.id));

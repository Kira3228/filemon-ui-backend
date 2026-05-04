import { AnalysisFileRow, AnalysisFileVersionRow, AnalysisNormalizedFileEvent, AnalysisOperationRow } from "../analysis/analysis.types";

export const groupVersionsByFile = (versions: AnalysisFileVersionRow[], fileIds: number[]) => {
  const result = new Map<number, AnalysisFileVersionRow[]>();

  for (const fileId of fileIds) {
    result.set(fileId, []);
  }

  for (const version of versions) {
    const bucket = result.get(Number(version.file_id));
    if (bucket) {
      bucket.push(version);
    }
  }

  return result;
}

export const groupFileEventsByFile = (allFiles: AnalysisFileRow[], normalizedRenameRows: AnalysisNormalizedFileEvent[]) => {
  const renameRowsByFile = new Map<number, AnalysisNormalizedFileEvent[]>();

  for (const file of allFiles) {
    renameRowsByFile.set(file.id, []);
  }

  for (const row of normalizedRenameRows) {
    renameRowsByFile.get(row.fileId)?.push(row);
  }

  return renameRowsByFile
}

export const buildChildrenByFile = (
  parentsByFile: Map<number, Set<number>>,
  fileIds: number[],
) => {
  const result = new Map<number, Set<number>>();

  for (const fileId of fileIds) {
    result.set(fileId, new Set());
  }

  for (const [fileId, parentIds] of parentsByFile.entries()) {
    for (const parentId of parentIds) {
      result.get(parentId)?.add(fileId);
    }
  }

  return result;
}

export const createRootSourceResolver = (parentsByFile: Map<number, Set<number>>) => {
  const memo = new Map<number, number[]>();

  const resolve = (fileId: number, stack = new Set<number>()): number[] => {
    if (memo.has(fileId)) {
      return memo.get(fileId)!;
    }

    if (stack.has(fileId)) {
      return [fileId];
    }

    const parents = Array.from(parentsByFile.get(fileId) || []);
    if (!parents.length) {
      memo.set(fileId, [fileId]);
      return [fileId];
    }

    stack.add(fileId);
    const roots = new Set<number>();
    for (const parentId of parents) {
      for (const rootId of resolve(parentId, stack)) {
        roots.add(rootId);
      }
    }
    stack.delete(fileId);

    const resolved = Array.from(roots).sort((a, b) => a - b);
    memo.set(fileId, resolved.length ? resolved : [fileId]);
    return resolved.length ? resolved : [fileId];
  };

  return resolve;
}

export const createDescendantsResolver = (childrenByFile: Map<number, Set<number>>) => {
  return (fileId: number) => {
    const visited = new Set<number>();
    const queue = Array.from(childrenByFile.get(fileId) || []);

    while (queue.length) {
      const current = queue.shift();
      if (current === undefined || visited.has(current)) {
        continue;
      }

      visited.add(current);
      for (const childId of Array.from(childrenByFile.get(current) || [])) {
        queue.push(childId);
      }
    }

    return Array.from(visited).sort((a, b) => a - b);
  };
}

export const groupReadsByFile = (reads: AnalysisOperationRow[], fileIds: number[]) => {
  const result = new Map<number, AnalysisOperationRow[]>();

  for (const fileId of fileIds) {
    result.set(fileId, []);
  }

  for (const row of reads) {
    const fileId = Number(row.file_id);
    const bucket = result.get(fileId);
    if (bucket) {
      bucket.push(row);
    }
  }

  return result;
}

export const buildParentsByFile = (versions: AnalysisFileVersionRow[], fileIds: number[]) => {
  const result = new Map<number, Set<number>>();

  for (const fileId of fileIds) {
    result.set(fileId, new Set());
  }

  for (const version of versions) {
    const fileId = Number(version.file_id);
    const originFileId = Number(version.origin_file_id);

    if (!originFileId || fileId === originFileId) {
      continue;
    }

    result.get(fileId)?.add(originFileId);
  }

  return result;
}


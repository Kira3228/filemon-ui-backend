export const createRootSourceResolver = (
  parentsByFile: Map<number, Set<number>>,
): (fileId: number, stack?: Set<number>) => number[] => {
  const rootMemo = new Map<number, number[]>();

  const resolveRootSourceIds = (fileId: number, stack = new Set<number>()): number[] => {
    const memoized = rootMemo.get(fileId)
    if (memoized) {
      return memoized
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
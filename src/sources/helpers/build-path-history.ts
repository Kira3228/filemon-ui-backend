import { AnalysisNormalizedFileEvent } from "../../analysis/analysis.types";

export const buildPathHistory = (
  currentPath: string,
  renameRows: AnalysisNormalizedFileEvent[] = [],
) => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const row of renameRows) {
    for (const path of [row.oldPath, row.newPath, currentPath]) {
      const value = String(path || "").trim();
      if (value && !seen.has(value)) {
        seen.add(value);
        result.push(value);
      }
    }
  }

  if (!seen.has(currentPath)) {
    result.push(currentPath);
  }

  return result;
};

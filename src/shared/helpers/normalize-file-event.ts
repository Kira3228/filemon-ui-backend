import { AnalysisFileEventRow, AnalysisFilePathRef, AnalysisNormalizedFileEvent } from "../../analysis/analysis.types";
import { getStringDetail } from "../utils/get-string-details";
import { getDirName } from "../utils/get-dir-name";
import { splitLast } from "../utils/split-last";

export const normalizeFileEvent = (
  row: AnalysisFileEventRow,
  filesById: Map<number, AnalysisFilePathRef>,
): AnalysisNormalizedFileEvent | null => {
  let details: Record<string, unknown> = {};
  try {
    details = JSON.parse(row.details || "{}") as Record<string, unknown>;
  } catch {
    details = {};
  }

  const oldPath = getStringDetail(details, "old_full_path", "oldPath");
  const newPath = getStringDetail(details, "new_full_path", "newPath");
  if (!oldPath && !newPath) return null;

  let kind: AnalysisNormalizedFileEvent["kind"] = "RENAME";
  let label = "Переименован";
  const isDeleteEvent = String(row.event) === "1" || (!newPath && !!oldPath);
  if (isDeleteEvent) {
    kind = "DELETE";
    label = "Удален";
  } else if (oldPath && newPath && getDirName(oldPath) !== getDirName(newPath)) {
    kind = splitLast(oldPath) !== splitLast(newPath) ? "MOVE_RENAME" : "MOVE";
    label = kind === "MOVE_RENAME" ? "Перемещен и переименован" : "Перемещен";
  }

  const currentPath = filesById.get(row.file_id)?.full_path ?? newPath ?? oldPath;
  if (!currentPath) return null;

  return {
    id: row.id,
    fileId: row.file_id,
    kind,
    label,
    oldPath,
    newPath,
    outOfScope: Boolean(details.out_of_scope),
    details,
    createdAt: row.created_at,
    currentPath,
  };
}

import { injectable } from "tsyringe";
import {
  AnalysisFileEventRow,
  AnalysisFileLink,
  AnalysisFilePathRef,
  AnalysisNormalizedFileEvent,
  AnalysisProcessContext,
  Nullable,
  SortableValue,
} from "./analysis.types";

@injectable()
export class AnalysisNormalizerService {
  formatProcessDisplayName(executablePath?: Nullable<string>, pid?: Nullable<number>, fallback = "proc") {
    const executable = this.getFileName(executablePath || fallback);
    if (pid !== null && pid !== undefined) {
      return `${executable} (PID ${pid})`;
    }
    return executable;
  }

  normalizeFileEvent(
    row: AnalysisFileEventRow,
    filesById: Map<number, AnalysisFilePathRef>,
  ): AnalysisNormalizedFileEvent | null {
    let details: Record<string, unknown> = {};
    try {
      details = JSON.parse(row.details || "{}") as Record<string, unknown>;
    } catch {
      details = {};
    }

    const oldPath = this.getStringDetail(details, "old_full_path", "oldPath");
    const newPath = this.getStringDetail(details, "new_full_path", "newPath");
    if (!oldPath && !newPath) return null;

    let kind: AnalysisNormalizedFileEvent["kind"] = "RENAME";
    let label = "Переименован";
    const isDeleteEvent = String(row.event) === "1" || (!newPath && !!oldPath);
    if (isDeleteEvent) {
      kind = "DELETE";
      label = "Удален";
    } else if (oldPath && newPath && this.getDirName(oldPath) !== this.getDirName(newPath)) {
      kind = this.getFileName(oldPath) !== this.getFileName(newPath) ? "MOVE_RENAME" : "MOVE";
      label = kind === "MOVE_RENAME" ? "Перемещен и переименован" : "Перемещен";
    }

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
      currentPath: filesById.get(row.file_id)?.full_path || newPath || oldPath,
    };
  }

  normalizeExportCell(value: string | number | boolean | null | undefined) {
    if (value === null || value === undefined) { return ""; }
    return String(value);
  }

  toFileName(title: string) {
    const normalized = title
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, "_")
      .replace(/^_+|_+$/g, "");

    return normalized || "table_export";
  }

  buildPathHistory(currentPath: string, renameRows: AnalysisNormalizedFileEvent[]) {
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
    if (!seen.has(currentPath)) result.push(currentPath);
    return result;
  }

  buildProcessLabel(row: AnalysisProcessContext) {
    const executable = this.formatProcessDisplayName(row.executable_path, row.pid, "proc");
    const version = row.process_version_number ?? 1;
    if (row.username && row.uid !== null && row.uid !== undefined) {
      return `${executable} v${version} [${row.username}:${row.uid}]`;
    }
    if (row.username) return `${executable} v${version} [${row.username}]`;
    if (row.uid !== null && row.uid !== undefined) return `${executable} v${version} [uid:${row.uid}]`;
    return `${executable} v${version}`;
  }

  getOriginProcess(row?: Nullable<AnalysisProcessContext>) {
    if (!row?.origin_process_version_id) return "SOURCE";
    return this.formatProcessDisplayName(row.executable_path, row.pid, "proc");
  }

  resolveTimelineFileStatus(
    eventTimestamp: Nullable<string>,
    fileId: Nullable<number>,
    fileItemsById: Map<number, { currentStatus: string; lastStatusAt: Nullable<string> }>,
    statusHistory: Array<{ fileId: number; createdAt: string; nextStatus: string }>,
  ) {
    if (fileId === null || fileId === undefined) {
      return null;
    }

    const file = fileItemsById.get(fileId);
    if (!file) {
      return null;
    }

    const eventTime = eventTimestamp ? new Date(eventTimestamp).getTime() : Number.NaN;
    const relevantHistory = statusHistory
      .filter((row) => row.fileId === fileId)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

    if (Number.isFinite(eventTime)) {
      const matchingStatus = relevantHistory.find((row) => {
        const rowTime = new Date(row.createdAt).getTime();
        return Number.isFinite(rowTime) && rowTime <= eventTime;
      });
      if (matchingStatus) {
        return matchingStatus.nextStatus;
      }
    }

    const lastStatusTime = file.lastStatusAt ? new Date(file.lastStatusAt).getTime() : Number.NaN;
    if (Number.isFinite(eventTime) && Number.isFinite(lastStatusTime) && eventTime >= lastStatusTime) {
      return file.currentStatus;
    }

    return "Отслеживается";
  }

  getOriginUser(row?: Nullable<AnalysisProcessContext>) {
    if (!row?.origin_process_version_id) return "SOURCE";
    if (row.username) return row.username;
    if (row.uid !== null && row.uid !== undefined) return `uid:${row.uid}`;
    return "—";
  }

  fileLink(file?: AnalysisFilePathRef): AnalysisFileLink | null {
    if (!file) return null;
    return {
      id: file.id,
      fileId: file.id,
      name: this.getFileName(file.full_path),
      path: file.full_path,
    };
  }

  getFileName(value?: Nullable<string>) {
    const text = String(value || "").trim();
    if (!text) return "-";
    const parts = text.split(/[\\/]/).filter(Boolean);
    return parts[parts.length - 1] || text;
  }

  getDirName(value?: Nullable<string>) {
    const text = String(value || "").trim();
    if (!text) return "";
    const normalized = text.replace(/[\\/]+$/, "");
    const parts = normalized.split(/[\\/]/);
    parts.pop();
    return parts.join("/");
  }

  formatStatus(rawStatus?: Nullable<string | number>) {
    const normalizedStatus =
      rawStatus === null || rawStatus === undefined || rawStatus === ""
        ? rawStatus
        : Number(rawStatus);

    switch (normalizedStatus) {
      case 1: return "Отслеживается";
      case 2: return "Удален";
      case 3: return "Снят с наблюдения";
      case 4: return "Вне области наблюдения";
      case null:
      case undefined:
      case "":
        return "Отслеживается";
      default:
        return String(rawStatus);
    }
  }

  toSqliteDateTime(date: Date) {
    return date.toISOString().slice(0, 19).replace("T", " ");
  }

  compactRenameText(oldPath?: Nullable<string>, newPath?: Nullable<string>, outOfScope?: boolean) {
    const base = [oldPath || "?", newPath || "?"].join(" -> ");
    return outOfScope ? `${base} [out-of-scope]` : base;
  }

  sortDesc(a: SortableValue, b: SortableValue, fallbackA?: SortableValue, fallbackB?: SortableValue) {
    const aValue = a ? String(a) : "";
    const bValue = b ? String(b) : "";
    if (aValue === bValue) {
      if (fallbackA === fallbackB) return 0;
      return fallbackA > fallbackB ? -1 : 1;
    }
    return aValue > bValue ? -1 : 1;
  }

  sortAsc(a: SortableValue, b: SortableValue, fallbackA?: SortableValue, fallbackB?: SortableValue) {
    const aValue = a ? String(a) : "";
    const bValue = b ? String(b) : "";
    if (aValue === bValue) {
      if (fallbackA === fallbackB) return 0;
      return fallbackA > fallbackB ? 1 : -1;
    }
    return aValue > bValue ? 1 : -1;
  }

  private getStringDetail(details: Record<string, unknown>, ...keys: string[]) {
    for (const key of keys) {
      const value = details[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
    return null;
  }
}

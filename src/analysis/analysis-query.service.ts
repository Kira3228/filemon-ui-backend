import { injectable } from "tsyringe";
import { UpdateMonitoringStatusResult } from "../contracts/api-contracts";
import { File } from "../entities";
import { AppDatabaseService } from "../database/app-database.service";
import { ensureManualFileStatusEventsTable, hasTable } from "../database/schema";
import { NotFoundError, ValidationError } from "../errors/http-errors";
import { UpdateFileMonitoringStatusDto } from "./dto/update-file-monitoring-status.dto";
import { AnalysisNormalizerService } from "./analysis-normalizer.service";
import {
  AnalysisFileEventRow,
  AnalysisFileRow,
  AnalysisFileVersionRow,
  AnalysisManualStatusRow,
  AnalysisOperationRow,
  AnalysisProcessVersionRow,
  AnalysisReportSourceData,
  AnalysisStatusRow,
  FileMonitoringLookupRow,
  TMonitoringStatus,
} from "./analysis.types";

@injectable()
export class AnalysisQueryService {
  private readonly trackingStatus: TMonitoringStatus = 1;
  private readonly adminRemovedStatus: TMonitoringStatus = 3;

  constructor(
    private readonly databaseService: AppDatabaseService,
    private readonly normalizer: AnalysisNormalizerService,
  ) { }

  async fetchReportSourceData(filter: { limit?: number } = {}): Promise<AnalysisReportSourceData> {
    const limit = Math.max(50, Math.min(Number(filter.limit) || 250, 1000));
    const fileRepo = await this.databaseService.getRepository(File);
    const manager = fileRepo.manager;

    const files = await manager.query(`
      SELECT
        f.id,
        f.full_path,
        fs.uuid as filesystem_uuid,
        f.origin_process_version_id,
        f.last_status_at,
        f.tracking_started_at,
        f.initial_size_bytes,
        f.birth_time,
        f.last_status as raw_status,
        f.ino_gen as inode
      FROM files f
      LEFT JOIN filesystems fs ON fs.id = f.filesystem_id
      ORDER BY f.tracking_started_at DESC, f.id DESC
    `) as AnalysisFileRow[];

    const fileVersions = await manager.query(`
      SELECT
        fv.id,
        fv.file_id,
        fv.version_number,
        fv.depth,
        fv.created_at,
        fv.origin_process_version_id,
        pv.version_number as process_version_number,
        pv.created_at as process_version_created_at,
        p.id as process_id,
        p.executable_path,
        p.pid,
        u.username,
        u.uid,
        ofile.id as origin_file_id,
        ofile.full_path as origin_file_path
      FROM file_versions fv
      LEFT JOIN process_versions pv ON pv.id = fv.origin_process_version_id
      LEFT JOIN processes p ON p.id = pv.process_id
      LEFT JOIN os_users u ON u.id = p.os_user_id
      LEFT JOIN files ofile ON ofile.id = pv.origin_file_id
      ORDER BY fv.created_at DESC, fv.id DESC
    `) as AnalysisFileVersionRow[];

    const processVersions = await manager.query(`
      SELECT
        pv.id,
        pv.process_id,
        pv.version_number,
        pv.created_at,
        p.executable_path,
        p.pid,
        u.username,
        u.uid,
        ofile.id as origin_file_id,
        ofile.full_path as origin_file_path
      FROM process_versions pv
      LEFT JOIN processes p ON p.id = pv.process_id
      LEFT JOIN os_users u ON u.id = p.os_user_id
      LEFT JOIN files ofile ON ofile.id = pv.origin_file_id
      ORDER BY pv.created_at DESC, pv.id DESC
    `) as AnalysisProcessVersionRow[];

    const reads = await manager.query(`
      SELECT
        fr.file_id,
        fr.file_version_id,
        fr.process_version_id,
        fr.created_at as first_at,
        NULL as last_at,
        1 as count,
        f.full_path as file_path,
        fs.uuid as filesystem_uuid,
        pv.version_number as process_version_number,
        pv.created_at as process_version_created_at,
        p.id as process_id,
        p.executable_path,
        p.pid,
        u.username,
        u.uid,
        ofile.id as origin_file_id,
        ofile.full_path as origin_file_path,
        fv.version_number as file_version_number,
        fv.depth as file_version_depth
      FROM file_reads fr
      LEFT JOIN files f ON f.id = fr.file_id
      LEFT JOIN filesystems fs ON fs.id = f.filesystem_id
      LEFT JOIN process_versions pv ON pv.id = fr.process_version_id
      LEFT JOIN processes p ON p.id = pv.process_id
      LEFT JOIN os_users u ON u.id = p.os_user_id
      LEFT JOIN files ofile ON ofile.id = pv.origin_file_id
      LEFT JOIN file_versions fv ON fv.id = fr.file_version_id
      ORDER BY fr.created_at DESC, fr.file_id DESC
    `) as AnalysisOperationRow[];

    const writes = await manager.query(`
      SELECT
        fw.file_id,
        fw.file_version_id,
        fw.process_version_id,
        fw.created_at as first_at,
        NULL as last_at,
        1 as count,
        f.full_path as file_path,
        fs.uuid as filesystem_uuid,
        pv.version_number as process_version_number,
        pv.created_at as process_version_created_at,
        p.id as process_id,
        p.executable_path,
        p.pid,
        u.username,
        u.uid,
        ofile.id as origin_file_id,
        ofile.full_path as origin_file_path,
        fv.version_number as file_version_number,
        fv.depth as file_version_depth
      FROM file_writes fw
      LEFT JOIN files f ON f.id = fw.file_id
      LEFT JOIN filesystems fs ON fs.id = f.filesystem_id
      LEFT JOIN process_versions pv ON pv.id = fw.process_version_id
      LEFT JOIN processes p ON p.id = pv.process_id
      LEFT JOIN os_users u ON u.id = p.os_user_id
      LEFT JOIN files ofile ON ofile.id = pv.origin_file_id
      LEFT JOIN file_versions fv ON fv.id = fw.file_version_id
      ORDER BY fw.created_at DESC, fw.file_id DESC
    `) as AnalysisOperationRow[];

    const statusRows = await manager.query(`
      SELECT id, file_id, status, created_at
      FROM file_statuses
      ORDER BY created_at DESC, id DESC
    `) as AnalysisStatusRow[];

    const manualStatusRows = (await hasTable(manager, "manual_file_status_events"))
      ? await manager.query(`
      SELECT id, file_id, status_history_id, action, previous_status, new_status, created_at, details
      FROM manual_file_status_events
      ORDER BY created_at DESC, id DESC
    `) as AnalysisManualStatusRow[]
      : [];

    const fileEventRows = await manager.query(`
      SELECT id, file_id, event, created_at, details
      FROM file_events
      ORDER BY created_at DESC, id DESC
    `) as AnalysisFileEventRow[];

    return {
      generatedAt: new Date().toISOString(),
      limit,
      files,
      fileVersions,
      processVersions,
      reads,
      writes,
      statusRows,
      manualStatusRows,
      fileEventRows,
    };
  }

  async updateFileMonitoringStatus(
    fileId: number,
    payload: UpdateFileMonitoringStatusDto,
  ): Promise<UpdateMonitoringStatusResult> {
    if (!Number.isInteger(fileId) || fileId <= 0) {
      throw new ValidationError("Некорректный идентификатор файла");
    }

    const action = String(payload?.action || "").trim();
    if (!["untrack", "resume"].includes(action)) {
      throw new ValidationError("Некорректное действие для смены статуса файла");
    }

    const targetStatus = action === "untrack" ? this.adminRemovedStatus : this.trackingStatus;
    const changedAt = this.normalizer.toSqliteDateTime(new Date());
    const fileRepo = await this.databaseService.getRepository(File);

    return fileRepo.manager.transaction(async (manager) => {
      const row = await manager.query(
        `SELECT id, full_path, last_status, last_status_at FROM files WHERE id = ? LIMIT 1`,
        [fileId],
      ) as FileMonitoringLookupRow[];
      const file = row[0];

      if (!file) {
        throw new NotFoundError("Файл не найден");
      }

      const currentStatus = Number(file.last_status) as TMonitoringStatus;
      if (currentStatus === targetStatus) {
        return {
          fileId,
          path: file.full_path,
          status: targetStatus,
          statusLabel: this.normalizer.formatStatus(targetStatus),
          lastStatusAt: file.last_status_at,
        };
      }

      const canUntrack = currentStatus === this.trackingStatus && targetStatus === this.adminRemovedStatus;
      const canResume = currentStatus === this.adminRemovedStatus && targetStatus === this.trackingStatus;
      if (!canUntrack && !canResume) {
        throw new ValidationError(
          `Недопустимый переход статуса: ${this.normalizer.formatStatus(currentStatus)} -> ${this.normalizer.formatStatus(targetStatus)}`,
        );
      }

      await manager.query(
        `UPDATE files SET last_status = ?, last_status_at = ? WHERE id = ?`,
        [targetStatus, changedAt, fileId],
      );
      await manager.query(
        `INSERT INTO file_statuses (file_id, status, created_at) VALUES (?, ?, ?)`,
        [fileId, targetStatus, changedAt],
      );
      const insertedStatusRows = await manager.query(
        `SELECT id FROM file_statuses WHERE file_id = ? AND status = ? AND created_at = ? ORDER BY id DESC LIMIT 1`,
        [fileId, targetStatus, changedAt],
      ) as Array<{ id: number }>;
      const statusHistoryId = Number(insertedStatusRows[0]?.id) || null;
      const manualDetails = JSON.stringify({
        path: file.full_path,
        actor: "analysis_ui",
        action,
      });
      await ensureManualFileStatusEventsTable(manager);
      await manager.query(
        `INSERT INTO manual_file_status_events (file_id, status_history_id, action, previous_status, new_status, created_at, details)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [fileId, statusHistoryId, action, currentStatus, targetStatus, changedAt, manualDetails],
      );

      return {
        fileId,
        path: file.full_path,
        status: targetStatus,
        statusLabel: this.normalizer.formatStatus(targetStatus),
        lastStatusAt: changedAt,
      };
    });
  }
}

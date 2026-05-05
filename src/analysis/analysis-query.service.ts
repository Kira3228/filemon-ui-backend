import { injectable } from "tsyringe";
import { EntityManager } from "typeorm";
import { UpdateMonitoringStatusResult } from "../contracts/api-contracts";
import {
  File,
  FileEvent,
  FileRead,
  FileStatus,
  FileVersion,
  FileWrite,
  ManualFileStatusEvent,
  ProcessVersion,
} from "../entities";
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
  AnalysisReportSectionKey,
  AnalysisReportSourceData,
  AnalysisStatusRow,
  FileMonitoringLookupRow,
  TMonitoringStatus,
} from "./analysis.types";
import { log } from "console";

type AnalysisQueryFilter = {
  limit?: number;
  page?: number;
};

type AnalysisPagination = {
  limit: number;
  page: number;
  offset: number;
};

type AnalysisLoadContext = {
  manager: EntityManager;
  sourceData: AnalysisReportSourceData;
  fileIds: number[];
};

@injectable()
export class AnalysisQueryService {
  private readonly trackingStatus: TMonitoringStatus = 1;
  private readonly adminRemovedStatus: TMonitoringStatus = 3;

  constructor(
    private readonly databaseService: AppDatabaseService,
    private readonly normalizer: AnalysisNormalizerService,
  ) { }

  async fetchReportSourceData(filter: AnalysisQueryFilter = {}): Promise<AnalysisReportSourceData> {
    return this.buildFullReportSourceData(filter);
  }

  async fetchReportSummarySourceData(filter: AnalysisQueryFilter = {}): Promise<AnalysisReportSourceData> {
    return this.buildSummarySourceData(filter);
  }

  async fetchReportSectionSourceData(
    section: Exclude<AnalysisReportSectionKey, "capabilities" | "notices">,
    filter: AnalysisQueryFilter = {},
  ): Promise<AnalysisReportSourceData> {
    switch (section) {
      case "overview":
        return this.buildOverviewSourceData(filter);
      case "sources":
        return this.buildSourcesSourceData(filter);
      case "timeline":
        return this.buildTimelineSourceData(filter);
      case "files":
        return this.buildFilesSourceData(filter);
      case "statusHistory":
        return this.buildStatusHistorySourceData(filter);
      case "renameHistory":
        return this.buildRenameHistorySourceData(filter);
      case "processReads":
        return this.buildProcessReadsSourceData(filter);
      case "operations":
        return this.buildOperationsSourceData(filter);
      case "diagramData":
        return this.buildDiagramSourceData(filter);
      case "chains":
        return this.buildChainsSourceData(filter);
    }
  }

  private async buildFullReportSourceData(filter: AnalysisQueryFilter): Promise<AnalysisReportSourceData> {
    const context = await this.createLoadContext(filter, true);
    if (!this.hasFiles(context)) return context.sourceData;

    await this.loadFileVersions(context);
    await this.loadReads(context);
    await this.loadWrites(context);
    await this.loadStatusRows(context);
    await this.loadManualStatusRows(context);
    await this.loadFileEventRows(context);
    await this.loadProcessVersions(context);

    return context.sourceData;
  }

  private async buildSummarySourceData(filter: AnalysisQueryFilter): Promise<AnalysisReportSourceData> {
    const context = await this.createLoadContext(filter, true);
    if (!this.hasFiles(context)) return context.sourceData;

    await this.loadFileVersions(context);
    await this.loadReads(context);
    await this.loadWrites(context);
    await this.loadFileEventRows(context);

    return context.sourceData;
  }

  private async buildOverviewSourceData(filter: AnalysisQueryFilter): Promise<AnalysisReportSourceData> {
    const context = await this.createLoadContext(filter, true);
    if (!this.hasFiles(context)) return context.sourceData;

    await this.loadFileVersions(context);
    await this.loadReads(context);
    await this.loadWrites(context);
    await this.loadFileEventRows(context);

    return context.sourceData;
  }

  private async buildSourcesSourceData(filter: AnalysisQueryFilter): Promise<AnalysisReportSourceData> {
    const context = await this.createLoadContext(filter, false);

    if (!this.hasFiles(context)) {
      return context.sourceData
    };

    await this.loadFileVersions(context);
    await this.loadReads(context);
    await this.loadFileEventRows(context);

    return context.sourceData;
  }

  private async buildTimelineSourceData(filter: AnalysisQueryFilter): Promise<AnalysisReportSourceData> {
    const context = await this.createLoadContext(filter, true);
    if (!this.hasFiles(context)) return context.sourceData;

    await this.loadFileVersions(context);
    await this.loadReads(context);
    await this.loadWrites(context);
    await this.loadStatusRows(context);
    await this.loadManualStatusRows(context);
    await this.loadFileEventRows(context);

    return context.sourceData;
  }

  private async buildFilesSourceData(filter: AnalysisQueryFilter): Promise<AnalysisReportSourceData> {
    const context = await this.createLoadContext(filter, true);
    if (!this.hasFiles(context)) return context.sourceData;

    await this.loadFileVersions(context);
    await this.loadFileEventRows(context);

    return context.sourceData;
  }

  private async buildStatusHistorySourceData(filter: AnalysisQueryFilter): Promise<AnalysisReportSourceData> {
    const context = await this.createLoadContext(filter, true);
    if (!this.hasFiles(context)) return context.sourceData;

    await this.loadFileVersions(context);
    await this.loadStatusRows(context);
    await this.loadManualStatusRows(context);

    return context.sourceData;
  }

  private async buildRenameHistorySourceData(filter: AnalysisQueryFilter): Promise<AnalysisReportSourceData> {
    const context = await this.createLoadContext(filter, true);
    if (!this.hasFiles(context)) return context.sourceData;

    await this.loadFileVersions(context);
    await this.loadFileEventRows(context);

    return context.sourceData;
  }

  private async buildProcessReadsSourceData(filter: AnalysisQueryFilter): Promise<AnalysisReportSourceData> {
    const context = await this.createLoadContext(filter, true);
    if (!this.hasFiles(context)) return context.sourceData;

    await this.loadFileVersions(context);
    await this.loadReads(context);
    await this.loadProcessVersions(context);

    return context.sourceData;
  }

  private async buildOperationsSourceData(filter: AnalysisQueryFilter): Promise<AnalysisReportSourceData> {
    const context = await this.createLoadContext(filter, true);
    if (!this.hasFiles(context)) return context.sourceData;

    await this.loadFileVersions(context);
    await this.loadReads(context);
    await this.loadWrites(context);
    await this.loadStatusRows(context);
    await this.loadManualStatusRows(context);
    await this.loadFileEventRows(context);

    return context.sourceData;
  }

  private async buildDiagramSourceData(filter: AnalysisQueryFilter): Promise<AnalysisReportSourceData> {
    const context = await this.createLoadContext(filter, true);
    if (!this.hasFiles(context)) return context.sourceData;

    await this.loadFileVersions(context);
    await this.loadReads(context);
    await this.loadWrites(context);
    await this.loadProcessVersions(context);

    return context.sourceData;
  }

  private async buildChainsSourceData(filter: AnalysisQueryFilter): Promise<AnalysisReportSourceData> {
    const context = await this.createLoadContext(filter, true);
    if (!this.hasFiles(context)) return context.sourceData;

    await this.loadFileVersions(context);
    await this.loadReads(context);
    await this.loadWrites(context);

    return context.sourceData;
  }

  private async createLoadContext(
    filter: AnalysisQueryFilter,
    paginateFiles: boolean,
  ): Promise<AnalysisLoadContext> {

    const pagination = this.normalizeFilter(filter);
    const fileRepo = await this.databaseService.getRepository(File);
    const manager = fileRepo.manager;
    const sourceData = this.createEmptySourceData(pagination);

    sourceData.files = await this.loadFiles(manager, pagination, paginateFiles);

    return {
      manager,
      sourceData,
      fileIds: this.extractFileIds(sourceData.files),
    };
  }

  private normalizeFilter(filter: AnalysisQueryFilter): AnalysisPagination {
    const limit = Math.max(1, Math.min(Number(filter.limit) || 250, 1000));
    const page = Math.max(1, Number(filter.page) || 1);
    const offset = (page - 1) * limit;

    return { limit, page, offset };
  }

  private createEmptySourceData(pagination: AnalysisPagination): AnalysisReportSourceData {
    return {
      generatedAt: new Date().toISOString(),
      limit: pagination.limit,
      page: pagination.page,
      offset: pagination.offset,
      files: [],
      fileVersions: [],
      processVersions: [],
      reads: [],
      writes: [],
      statusRows: [],
      manualStatusRows: [],
      fileEventRows: [],
    };
  }

  private async loadFiles(
    manager: EntityManager,
    pagination: AnalysisPagination,
    paginateFiles: boolean,
  ): Promise<AnalysisFileRow[]> {
    const query = manager
      .createQueryBuilder(File, "f")
      .leftJoin("f.filesystem", "fs")
      .leftJoin("f.originProcessVersion", "opv")
      .select([
        "f.id as id",
        "f.full_path as full_path",
        "fs.uuid as filesystem_uuid",
        "opv.id as origin_process_version_id",
        "f.last_status_at as last_status_at",
        "f.tracking_started_at as tracking_started_at",
        "f.initial_size_bytes as initial_size_bytes",
        "f.birth_time as birth_time",
        "f.status as raw_status",
        "f.inoGen as inode",
      ])
      .orderBy("f.tracking_started_at", "DESC")
      .addOrderBy("f.id", "DESC");

    if (paginateFiles) {
      query.limit(pagination.limit).offset(pagination.offset);
    }

    return query.getRawMany() as Promise<AnalysisFileRow[]>;
  }

  private async loadFileVersions(context: AnalysisLoadContext): Promise<void> {
    context.sourceData.fileVersions = await context.manager
      .createQueryBuilder(FileVersion, "fv")
      .leftJoin("fv.file", "file")
      .leftJoin("fv.originProcessVersion", "pv")
      .leftJoin("pv.process", "p")
      .leftJoin("p.osUser", "u")
      .leftJoin("pv.originFile", "ofile")
      .select([
        "fv.id as id",
        "file.id as file_id",
        "fv.version_number as version_number",
        "fv.depth as depth",
        "fv.created_at as created_at",
        "pv.id as origin_process_version_id",
        "pv.version_number as process_version_number",
        "pv.created_at as process_version_created_at",
        "p.id as process_id",
        "p.executable_path as executable_path",
        "p.pid as pid",
        "u.username as username",
        "u.uid as uid",
        "ofile.id as origin_file_id",
        "ofile.full_path as origin_file_path",
      ])
      .where("file.id IN (:...fileIds)", { fileIds: context.fileIds })
      .orderBy("fv.created_at", "DESC")
      .addOrderBy("fv.id", "DESC")
      .getRawMany() as AnalysisFileVersionRow[];
  }

  private async loadReads(context: AnalysisLoadContext): Promise<void> {
    context.sourceData.reads = await this.buildOperationRowsQuery(context.manager, FileRead, "fr", context.fileIds)
      .getRawMany() as AnalysisOperationRow[];
  }

  private async loadWrites(context: AnalysisLoadContext): Promise<void> {
    context.sourceData.writes = await this.buildOperationRowsQuery(context.manager, FileWrite, "fw", context.fileIds)
      .getRawMany() as AnalysisOperationRow[];
  }

  private async loadStatusRows(context: AnalysisLoadContext): Promise<void> {
    context.sourceData.statusRows = await context.manager
      .createQueryBuilder(FileStatus, "fs")
      .leftJoin("fs.file", "file")
      .select([
        "fs.id as id",
        "file.id as file_id",
        "fs.status as status",
        "fs.created_at as created_at",
      ])
      .where("file.id IN (:...fileIds)", { fileIds: context.fileIds })
      .orderBy("fs.created_at", "DESC")
      .addOrderBy("fs.id", "DESC")
      .getRawMany() as AnalysisStatusRow[];
  }

  private async loadManualStatusRows(context: AnalysisLoadContext): Promise<void> {
    if (!await hasTable(context.manager, "manual_file_status_events")) {
      return;
    }

    context.sourceData.manualStatusRows = await context.manager
      .createQueryBuilder(ManualFileStatusEvent, "mse")
      .leftJoin("mse.file", "file")
      .leftJoin("mse.statusHistory", "statusHistory")
      .select([
        "mse.id as id",
        "file.id as file_id",
        "statusHistory.id as status_history_id",
        "mse.action as action",
        "mse.previous_status as previous_status",
        "mse.new_status as new_status",
        "mse.created_at as created_at",
        "mse.details as details",
      ])
      .where("file.id IN (:...fileIds)", { fileIds: context.fileIds })
      .orderBy("mse.created_at", "DESC")
      .addOrderBy("mse.id", "DESC")
      .getRawMany() as AnalysisManualStatusRow[];
  }

  private async loadFileEventRows(context: AnalysisLoadContext): Promise<void> {
    context.sourceData.fileEventRows = await context.manager
      .createQueryBuilder(FileEvent, "fe")
      .leftJoin("fe.file", "file")
      .select([
        "fe.id as id",
        "file.id as file_id",
        "fe.event as event",
        "fe.created_at as created_at",
        "fe.details as details",
      ])
      .where("file.id IN (:...fileIds)", { fileIds: context.fileIds })
      .orderBy("fe.created_at", "DESC")
      .addOrderBy("fe.id", "DESC")
      .getRawMany() as AnalysisFileEventRow[];
  }

  private async loadProcessVersions(context: AnalysisLoadContext): Promise<void> {
    const processVersionIds = this.collectProcessVersionIds(context.sourceData);
    if (processVersionIds.length === 0) {
      return;
    }

    context.sourceData.processVersions = await context.manager
      .createQueryBuilder(ProcessVersion, "pv")
      .leftJoin("pv.process", "p")
      .leftJoin("p.osUser", "u")
      .leftJoin("pv.originFile", "ofile")
      .select([
        "pv.id as id",
        "p.id as process_id",
        "pv.version_number as version_number",
        "pv.created_at as created_at",
        "p.executable_path as executable_path",
        "p.pid as pid",
        "u.username as username",
        "u.uid as uid",
        "ofile.id as origin_file_id",
        "ofile.full_path as origin_file_path",
      ])
      .where("pv.id IN (:...processVersionIds)", { processVersionIds })
      .orderBy("pv.created_at", "DESC")
      .addOrderBy("pv.id", "DESC")
      .getRawMany() as AnalysisProcessVersionRow[];
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
      const file = await manager
        .createQueryBuilder(File, "file")
        .select([
          "file.id as id",
          "file.full_path as full_path",
          "file.status as last_status",
          "file.last_status_at as last_status_at",
        ])
        .where("file.id = :fileId", { fileId })
        .limit(1)
        .getRawOne() as FileMonitoringLookupRow | undefined;

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

      await manager
        .createQueryBuilder()
        .update(File)
        .set({
          status: targetStatus,
          last_status_at: changedAt as unknown as Date,
        })
        .where("id = :fileId", { fileId })
        .execute();

      const insertStatusResult = await manager
        .createQueryBuilder()
        .insert()
        .into(FileStatus)
        .values({
          file: { id: fileId } as File,
          status: targetStatus,
          created_at: changedAt as unknown as Date,
        })
        .execute();

      const statusHistoryId = Number(insertStatusResult.identifiers[0]?.id) || null;
      const manualDetails = JSON.stringify({
        path: file.full_path,
        actor: "analysis_ui",
        action,
      });

      await ensureManualFileStatusEventsTable(manager);
      await manager
        .createQueryBuilder()
        .insert()
        .into(ManualFileStatusEvent)
        .values({
          file: { id: fileId } as File,
          statusHistory: statusHistoryId ? { id: statusHistoryId } as FileStatus : null,
          action,
          previous_status: currentStatus,
          new_status: targetStatus,
          created_at: changedAt as unknown as Date,
          details: manualDetails,
        })
        .execute();

      return {
        fileId,
        path: file.full_path,
        status: targetStatus,
        statusLabel: this.normalizer.formatStatus(targetStatus),
        lastStatusAt: changedAt,
      };
    });
  }

  private hasFiles(context: AnalysisLoadContext) {
    return context.fileIds.length > 0;
  }

  private extractFileIds(files: AnalysisFileRow[]): number[] {
    return files
      .map((file) => Number(file.id))
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  private collectProcessVersionIds(sourceData: AnalysisReportSourceData): number[] {
    const ids = [
      ...sourceData.files.map((file) => Number(file.origin_process_version_id)),
      ...sourceData.fileVersions.map((version) => Number(version.origin_process_version_id)),
      ...sourceData.reads.map((row) => Number(row.process_version_id)),
      ...sourceData.writes.map((row) => Number(row.process_version_id)),
    ];

    return Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)));
  }

  private buildOperationRowsQuery(
    manager: EntityManager,
    entity: typeof FileRead | typeof FileWrite,
    alias: "fr" | "fw",
    fileIds: number[],
  ) {
    return manager
      .createQueryBuilder(entity, alias)
      .leftJoin(`${alias}.file`, "file")
      .leftJoin("file.filesystem", "fs")
      .leftJoin(`${alias}.processVersion`, "pv")
      .leftJoin("pv.process", "p")
      .leftJoin("p.osUser", "u")
      .leftJoin("pv.originFile", "ofile")
      .leftJoin(`${alias}.fileVersion`, "fv")
      .select([
        `${alias}.file_id as file_id`,
        "fv.id as file_version_id",
        "pv.id as process_version_id",
        `${alias}.created_at as first_at`,
        "NULL as last_at",
        "1 as count",
        "file.full_path as file_path",
        "fs.uuid as filesystem_uuid",
        "pv.version_number as process_version_number",
        "pv.created_at as process_version_created_at",
        "p.id as process_id",
        "p.executable_path as executable_path",
        "p.pid as pid",
        "u.username as username",
        "u.uid as uid",
        "ofile.id as origin_file_id",
        "ofile.full_path as origin_file_path",
        "fv.version_number as file_version_number",
        "fv.depth as file_version_depth",
      ])
      .where(`${alias}.file_id IN (:...fileIds)`, { fileIds })
      .orderBy(`${alias}.created_at`, "DESC")
      .addOrderBy(`${alias}.file_id`, "DESC");
  }
}

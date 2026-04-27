import { injectable } from "tsyringe";
import { SelectQueryBuilder } from "typeorm";
import {
  File,
  FileVersion,
  FileRead,
  FileWrite,
} from "../entities";
import { EventFilterDto } from "./dto/event-filter.dto";
import { AppDatabaseService } from "../database/app-database.service";
import { ensureManualFileStatusEventsTable, hasTable } from "../database/schema";

export interface GetFilesFilter {
  filesystemId?: number;
  deleted?: boolean;
}

export interface GetFileVersionsFilter {
  fileId?: number;
  originProcessVersionId?: number;
  depth?: number;
}

export interface GetOpsFilter {
  fileId?: number;
  processVersionId?: number;
  from?: Date;
  to?: Date;
}

type EventQueryBuilder = SelectQueryBuilder<FileRead> | SelectQueryBuilder<FileWrite>;
type EventQueryAlias = "fr" | "fw";


@injectable()
export class EventService {
  constructor(
    private readonly databaseService: AppDatabaseService,
  ) { }


  async getFiles(filter: GetFilesFilter = {}) {
    const fileRepo = await this.databaseService.getRepository(File);
    const qb = fileRepo
      .createQueryBuilder("f")
      .leftJoinAndSelect("f.filesystem", "fs");

    if (filter.filesystemId !== undefined) {
      qb.andWhere("f.filesystem_id = :fsId", { fsId: filter.filesystemId });
    }

    if (filter.deleted === true) {
      qb.andWhere("f.last_status = :deletedStatus", { deletedStatus: 2 });
    } else if (filter.deleted === false) {
      qb.andWhere("f.last_status != :deletedStatus", { deletedStatus: 2 });
    }

    qb.orderBy("f.tracking_started_at", "DESC");

    return qb.getMany();
  }

  async getFileById(id: number) {
    const fileRepo = await this.databaseService.getRepository(File);

    return fileRepo
      .createQueryBuilder("f")
      .leftJoinAndSelect("f.filesystem", "fs")
      .leftJoinAndSelect("f.versions", "fv")
      .leftJoinAndSelect("fv.originProcessVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .where("f.id = :id", { id })
      .getOne();
  }

  async getFileVersions(filter: GetFileVersionsFilter = {}) {
    const fileVersionRepo = await this.databaseService.getRepository(FileVersion);
    const qb = fileVersionRepo
      .createQueryBuilder("fv")
      .leftJoinAndSelect("fv.file", "f")
      .leftJoinAndSelect("fv.originProcessVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u");

    if (filter.fileId !== undefined) {
      qb.andWhere("fv.file_id = :fileId", { fileId: filter.fileId });
    }

    if (filter.originProcessVersionId !== undefined) {
      qb.andWhere("fv.origin_process_version_id = :pvId", {
        pvId: filter.originProcessVersionId,
      });
    }

    if (filter.depth !== undefined) {
      qb.andWhere("fv.depth <= :depth", { depth: filter.depth });
    }

    qb.orderBy("fv.created_at", "DESC");

    return qb.getMany();
  }

  async getFileVersionById(id: number) {
    const fileVersionRepo = await this.databaseService.getRepository(FileVersion);

    return fileVersionRepo
      .createQueryBuilder("fv")
      .leftJoinAndSelect("fv.file", "f")
      .leftJoinAndSelect("fv.originProcessVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u")
      .where("fv.id = :id", { id })
      .getOne();
  }

  async getEvents(filter: EventFilterDto) {
    const fileReadRepo = await this.databaseService.getRepository(FileRead);
    const fileWriteRepo = await this.databaseService.getRepository(FileWrite);

    const qb = fileReadRepo
      .createQueryBuilder("fr")
      .leftJoinAndSelect("fr.file", "f")
      .leftJoinAndSelect("f.filesystem", "f_fs")
      .leftJoinAndSelect("f.originProcessVersion", "f_opv")
      .leftJoinAndSelect("fr.fileVersion", "fv")
      .leftJoinAndSelect("fr.processVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u")
      .leftJoinAndSelect("pv.originFile", "pv_of")
      .leftJoinAndSelect("pv_of.filesystem", "pv_of_fs");

    const wQb = fileWriteRepo
      .createQueryBuilder("fw")
      .leftJoinAndSelect("fw.file", "f")
      .leftJoinAndSelect("f.filesystem", "f_fs")
      .leftJoinAndSelect("f.originProcessVersion", "f_opv")
      .leftJoinAndSelect("fw.fileVersion", "fv")
      .leftJoinAndSelect("fw.processVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u")
      .leftJoinAndSelect("pv.originFile", "pv_of")
      .leftJoinAndSelect("pv_of.filesystem", "pv_of_fs");

    const applyFilters = (query: EventQueryBuilder, alias: EventQueryAlias) => {
      if (filter.birthTime) query.andWhere("f.birth_time = :bt", { bt: filter.birthTime });
      if (filter.status) query.andWhere("f.last_status = :st", { st: filter.status });
      if (filter.filesystemId) query.andWhere("f_fs.uuid = :fsId", { fsId: filter.filesystemId });
      if (filter.trackingStartedAt) query.andWhere("f.tracking_started_at = :tsa", { tsa: filter.trackingStartedAt });
      if (filter.osUserId) query.andWhere("u.username = :uname", { uname: filter.osUserId });
      if (filter.process) query.andWhere("p.executable_path LIKE :proc", { proc: `%${filter.process}%` });
      if (filter.versionNumber) query.andWhere("fv.version_number = :vnum", { vnum: filter.versionNumber });
      if (filter.firstAt) query.andWhere(`${alias}.created_at >= :first`, { first: filter.firstAt });
      if (filter.executablePath) query.andWhere(`p.executable_path LIKE :epath`, { epath: `%${filter.executablePath}%` });
    };

    applyFilters(qb, "fr");
    applyFilters(wQb, "fw");

    const [reads, writes] = await Promise.all([
      (!filter.operationType || filter.operationType === 'read') ? qb.getMany() : Promise.resolve([]),
      (!filter.operationType || filter.operationType === 'write') ? wQb.getMany() : Promise.resolve([]),
    ]);

    return [
      ...reads.map(r => ({ type: "read" as const, ...this.mapFileRead(r) })),
      ...writes.map(w => ({ type: "write" as const, ...this.mapFileRead(w) })),
    ].sort((a, b) => new Date(b.firstAt).getTime() - new Date(a.firstAt).getTime());
  }

  private mapFileRead(row: FileRead | FileWrite) {
    return {
      fileId: row.file?.id ?? null,
      filePath: row.file?.full_path ?? null,
      fileVersion: row.fileVersion?.version_number ?? null,
      processVersionId: row.processVersion?.id ?? null,
      process: row.processVersion?.process?.executable_path
        ?.split("/").pop() ?? null,
      processVersion: row.processVersion?.version_number ?? null,
      user: row.processVersion?.process?.osUser?.username ?? null,
      uid: row.processVersion?.process?.osUser?.uid ?? null,
      originFile: row.processVersion?.originFile?.full_path ?? null,
      filesystem: row.file?.filesystem?.uuid ?? null,
      depth: row.fileVersion?.depth ?? null,
      firstAt: row.created_at,
      lastAt: null,
      count: 1,
      initialSizeBytes: row.file?.initial_size_bytes ?? null,
      trackingStartAt: row.file?.tracking_started_at ?? null,
      lastStatusAt: row.file?.last_status_at ?? null,
      iNode: row.file?.inoGen ?? null,
    };
  }

  async getFileReadByPk(fileId: number, processVersionId: number) {
    const fileReadRepo = await this.databaseService.getRepository(FileRead);

    return fileReadRepo
      .createQueryBuilder("fr")
      .leftJoinAndSelect("fr.file", "f")
      .leftJoinAndSelect("fr.fileVersion", "fv")
      .leftJoinAndSelect("fr.processVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u")
      .where("fr.file_id = :fileId", { fileId })
      .andWhere("fr.process_version_id = :pvId", { pvId: processVersionId })
      .getOne();
  }

  async getFileWrite(filter: GetOpsFilter = {}) {
    const fileWriteRepo = await this.databaseService.getRepository(FileWrite);
    const qb = fileWriteRepo
      .createQueryBuilder("fw")
      .leftJoinAndSelect("fw.file", "f")
      .leftJoinAndSelect("fw.fileVersion", "fv")
      .leftJoinAndSelect("fw.processVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u");

    if (filter.fileId !== undefined) {
      qb.andWhere("fw.file_id = :fileId", { fileId: filter.fileId });
    }

    if (filter.processVersionId !== undefined) {
      qb.andWhere("fw.process_version_id = :pvId", {
        pvId: filter.processVersionId,
      });
    }

    if (filter.from !== undefined) {
      qb.andWhere("fw.created_at >= :from", { from: filter.from });
    }

    if (filter.to !== undefined) {
      qb.andWhere("fw.created_at <= :to", { to: filter.to });
    }

    qb.orderBy("fw.created_at", "DESC");

    return qb.getMany();
  }

  async getFileWriteByPk(fileId: number, processVersionId: number) {
    const fileWriteRepo = await this.databaseService.getRepository(FileWrite);

    return fileWriteRepo
      .createQueryBuilder("fw")
      .leftJoinAndSelect("fw.file", "f")
      .leftJoinAndSelect("fw.fileVersion", "fv")
      .leftJoinAndSelect("fw.processVersion", "pv")
      .leftJoinAndSelect("pv.process", "p")
      .leftJoinAndSelect("p.osUser", "u")
      .where("fw.file_id = :fileId", { fileId })
      .andWhere("fw.process_version_id = :pvId", { pvId: processVersionId })
      .getOne();
  }

  async getFileChain(rootFileId: number, maxDepth?: number) {
    const fileRepo = await this.databaseService.getRepository(File);
    const fileReadRepo = await this.databaseService.getRepository(FileRead);
    const fileVersionRepo = await this.databaseService.getRepository(FileVersion);
    const rootFile = await fileRepo.findOne(rootFileId);
    if (!rootFile) return null;

    const queue: Array<{ fileId: number; depth: number }> = [
      { fileId: rootFileId, depth: 0 },
    ];
    const visitedFiles = new Set<number>([rootFileId]);

    const nodes: Array<{
      type: "file" | "process_version";
      id: number;
      depth: number;
      data: unknown;
    }> = [];

    const edges: Array<{
      from: string;
      to: string;
      relation: "read" | "write";
    }> = [];

    while (queue.length > 0) {
      const { fileId, depth } = queue.shift()!;

      if (maxDepth !== undefined && depth >= maxDepth) continue;

      const reads = await fileReadRepo
        .createQueryBuilder("fr")
        .leftJoinAndSelect("fr.processVersion", "pv")
        .leftJoinAndSelect("pv.process", "p")
        .leftJoinAndSelect("p.osUser", "u")
        .where("fr.file_id = :fileId", { fileId })
        .getMany();

      for (const read of reads) {
        const pv = read.processVersion;
        const pvNodeId = `pv_${pv.id}`;
        nodes.push({ type: "process_version", id: pv.id, depth: depth + 1, data: pv });
        edges.push({ from: `f_${fileId}`, to: pvNodeId, relation: "read" });

        const writtenVersions = await fileVersionRepo
          .createQueryBuilder("fv")
          .leftJoinAndSelect("fv.file", "f")
          .where("fv.origin_process_version_id = :pvId", { pvId: pv.id })
          .getMany();

        for (const fv of writtenVersions) {
          const childFileId = fv.file.id;
          edges.push({ from: pvNodeId, to: `f_${childFileId}`, relation: "write" });

          if (!visitedFiles.has(childFileId)) {
            visitedFiles.add(childFileId);
            nodes.push({
              type: "file",
              id: childFileId,
              depth: depth + 2,
              data: fv.file,
            });
            queue.push({ fileId: childFileId, depth: depth + 2 });
          }
        }
      }
    }



    return {
      root: rootFile,
      nodes,
      edges,
    };
  }

  async seedDatabase(count: number = 1000) {
    const fileRepo = await this.databaseService.getRepository(File);
    const manager = fileRepo.manager;
    await manager.query('PRAGMA foreign_keys = OFF');

    try {
      console.time("Seed Duration");

      // Чистим
      if (await hasTable(manager, "manual_file_status_events")) {
        await manager.query('DELETE FROM manual_file_status_events');
      }
      await manager.query('DELETE FROM file_events');
      await manager.query('DELETE FROM file_statuses');
      await manager.query('DELETE FROM file_writes');
      await manager.query('DELETE FROM file_reads');
      await manager.query('DELETE FROM file_versions');
      await manager.query('DELETE FROM process_versions');
      await manager.query('DELETE FROM processes');
      await manager.query('DELETE FROM files');
      await manager.query('DELETE FROM os_users');
      await manager.query('DELETE FROM filesystems');

      // 1. Filesystems
      await manager.query(`INSERT INTO filesystems (id, uuid) VALUES (1, '550e8400-e29b-41d4-a716-446655440000')`);
      await manager.query(`INSERT INTO filesystems (id, uuid) VALUES (2, '6ba7b811-9dad-11d1-80b4-00c04fd430c8')`);

      // 2. OS Users
      await manager.query(`INSERT INTO os_users (id, uid, gid, username, home_directory, shell, full_name) VALUES (1, 0, 0, 'root', '/root', '/bin/bash', 'Superuser')`);
      await manager.query(`INSERT INTO os_users (id, uid, gid, username, home_directory, shell, full_name) VALUES (2, 1000, 1000, 'node_user', '/home/node', '/bin/sh', 'App Runner')`);

      // 3. Files
      const rootSourceCount = Math.min(count, Math.max(1, Math.floor(count / 4), 5));
      for (let i = 1; i <= count; i++) {
        const buf = Buffer.alloc(4);
        buf.writeUInt32BE(i, 0);
        const trackingStartedAt = new Date(Date.now() - (count - i + 1) * 60_000).toISOString();
        const birthTime = new Date(Date.now() - (count - i + 2) * 60_000).toISOString();
        const status = i % 50 === 0 ? 2 : i % 33 === 0 ? 3 : i % 77 === 0 ? 4 : 1;
        const lastStatusAt = status === 1
          ? trackingStartedAt
          : new Date(Date.now() - (count - i) * 45_000).toISOString();
        await manager.query(
          `INSERT INTO files
           (id, filesystem_id, filehandle, ino_gen, full_path, origin_process_version_id, tracking_started_at, initial_size_bytes, birth_time, last_status, last_status_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            i,
            (i % 2) + 1,
            buf,
            `${i}:${i * 3}`,
            `/var/www/uploads/doc_${i}.pdf`,
            null,
            trackingStartedAt,
            Math.floor(Math.random() * 5000000),
            birthTime,
            status,
            lastStatusAt,
          ]
        );

        await manager.query(
          `INSERT INTO file_statuses (file_id, status, created_at) VALUES (?, ?, ?)`,
          [i, 1, trackingStartedAt],
        );

        if (status !== 1) {
          await manager.query(
            `INSERT INTO file_statuses (file_id, status, created_at) VALUES (?, ?, ?)`,
            [i, status, lastStatusAt],
          );

          if (status === 3) {
            await ensureManualFileStatusEventsTable(manager);
            await manager.query(
              `INSERT INTO manual_file_status_events (file_id, status_history_id, action, previous_status, new_status, created_at, details)
               VALUES (?, (SELECT id FROM file_statuses WHERE file_id = ? AND status = ? AND created_at = ? LIMIT 1), ?, ?, ?, ?, ?)`,
              [
                i,
                i,
                status,
                lastStatusAt,
                "untrack",
                1,
                status,
                lastStatusAt,
                JSON.stringify({ path: `/var/www/uploads/doc_${i}.pdf`, actor: "seed", action: "untrack" }),
              ],
            );
          }
        }

        if (i % 40 === 0) {
          await manager.query(
            `INSERT INTO file_events (file_id, event, created_at, details) VALUES (?, ?, ?, ?)`,
            [
              i,
              2,
              new Date(Date.now() - (count - i) * 30_000).toISOString(),
              JSON.stringify({
                old_full_path: `/var/www/uploads/doc_${i}_old.pdf`,
                new_full_path: `/var/www/uploads/doc_${i}.pdf`,
                out_of_scope: false,
              }),
            ],
          );
        }

        if (status === 2) {
          await manager.query(
            `INSERT INTO file_events (file_id, event, created_at, details) VALUES (?, ?, ?, ?)`,
            [
              i,
              1,
              lastStatusAt,
              JSON.stringify({
                old_full_path: `/var/www/uploads/doc_${i}.pdf`,
                new_full_path: null,
                out_of_scope: false,
              }),
            ],
          );
        }
      }

      // 4. Processes
      for (let i = 1; i <= count; i++) {
        await manager.query(
          `INSERT INTO processes
           (id, pid, executable_path, arguments, parent_pid, os_user_id, group_id, environment, process_start_time, details_source, process_exit_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            i,
            Math.floor(Math.random() * 60000) + 1,
            `/usr/local/bin/worker-${i % 5}`,
            `--mode=active --thread=${i}`,
            1,
            (i % 2) + 1,
            1000,
            'NODE_ENV=production;DEBUG=false',
            new Date().toISOString(),
            (i % 3) + 1,
            null,
          ]
        );
      }

      // 5. Process Versions
      for (let i = 1; i <= count; i++) {
        await manager.query(
          `INSERT INTO process_versions
           (id, process_id, version_number, origin_file_id, working_directory, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            i,
            i,
            1,
            ((i - 1) % rootSourceCount) + 1,
            `/home/user/project_${i}`,
            new Date().toISOString(),
          ]
        );
      }

      // 6. File Versions
      for (let i = 1; i <= count; i++) {
        await manager.query(
          `INSERT INTO file_versions
           (id, file_id, version_number, origin_process_version_id, depth, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            i,
            i,
            1,
            i <= rootSourceCount ? null : i - rootSourceCount,
            i <= rootSourceCount ? 0 : 1 + ((i - rootSourceCount - 1) % 5),
            new Date().toISOString(),
          ]
        );
      }

      // 7. File Reads
      for (let i = 1; i <= count; i++) {
        const originFileId = ((i - 1) % rootSourceCount) + 1;
        await manager.query(
          `INSERT INTO file_reads
           (file_id, process_version_id, file_version_id, created_at)
          VALUES (?, ?, ?, ?)`,
          [
            originFileId,
            i,
            originFileId,
            new Date(Date.now() - Math.random() * 86400000).toISOString(),
          ]
        );
      }

      // 8. File Writes
      for (let i = rootSourceCount + 1; i <= count; i++) {
        await manager.query(
          `INSERT INTO file_writes
           (file_id, process_version_id, file_version_id, created_at)
          VALUES (?, ?, ?, ?)`,
          [
            i,
            i - rootSourceCount,
            i,
            new Date(Date.now() - Math.random() * 86400000).toISOString(),
          ]
        );
      }

      console.timeEnd("Seed Duration");
      console.log(`✅ Seeded current schema with ${count} files and ${count} process versions.`);

    } finally {
      await manager.query('PRAGMA foreign_keys = ON');
    }
  }


}

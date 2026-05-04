import { inject, injectable } from "tsyringe";
import { AnalysisFileRow } from "../analysis/analysis.types";
import { FileRepositoryToken } from "../constants/tokens";
import { Repository } from "typeorm";
import { File } from "../entities";

@injectable()
export class FilesReadModel {
  constructor(@inject(FileRepositoryToken) private readonly fileRepository: Repository<File>) {

  }

  private buildFilesQuery() {
    return this.fileRepository
      .createQueryBuilder("f")
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
  }

  async findAllFiles(): Promise<AnalysisFileRow[]> {
    return this.buildFilesQuery().getRawMany() as Promise<AnalysisFileRow[]>;
  }

  async findRootFiles(query: { page?: number, limit?: number } = {}): Promise<AnalysisFileRow[]> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(Number(query.limit) || 250, 1000));
    const offset = (page - 1) * limit;

    return this.buildFilesQuery()
      .where("opv.id IS NULL")
      .limit(limit)
      .offset(offset)
      .getRawMany() as Promise<AnalysisFileRow[]>;
  }
}


import { inject, injectable } from "tsyringe";
import { FileRepositoryToken } from "../constants/tokens";
import { Repository } from "typeorm";
import { File } from "../entities";
import { AnalysisFileRow } from "./analysis.types";

@injectable()
export class FileService {
  constructor(
    @inject(FileRepositoryToken) private readonly fileRepository: Repository<File>
  ) { }

  async getFiles(): Promise<AnalysisFileRow[]> {
    const files = await this.fileRepository
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
      .addOrderBy("f.id", "DESC")
      .getRawMany();

    return files;
  }
}

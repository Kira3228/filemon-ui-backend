import { inject, injectable } from "tsyringe";
import { AnalysisFileVersionRow } from "../analysis/analysis.types";
import { FileVersionRepositoryToken } from "../constants/tokens";
import { Repository } from "typeorm";
import { FileVersion } from "../entities";

@injectable()
export class FileVersionReadModel {
  constructor(
    @inject(FileVersionRepositoryToken)
    private readonly fileVersionRepository: Repository<FileVersion>,
  ) { }

  private buildFileVersionsQuery() {
    return this.fileVersionRepository
      .createQueryBuilder("fv")
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
      .orderBy("fv.created_at", "DESC")
      .addOrderBy("fv.id", "DESC");
  }

  async findFileVersionsByFileIds(fileIds: number[]): Promise<AnalysisFileVersionRow[]> {
    if (!fileIds.length) {
      return [];
    }

    return this.buildFileVersionsQuery()
      .where("file.id IN (:...fileIds)", { fileIds })
      .getRawMany() as Promise<AnalysisFileVersionRow[]>;
  }
}
